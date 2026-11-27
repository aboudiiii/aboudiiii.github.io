import { safeEqual } from './util.js';

const noStore = { 'Cache-Control':'no-store, no-cache, must-revalidate', Pragma:'no-cache', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer' };
const hex = b => [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function hmac(keyBytes,value) {
  const key=await crypto.subtle.importKey('raw',keyBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
}
const sha256 = async value => hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
async function verifyInitData(initData,botToken) {
  if(typeof initData!=='string'||initData.length>8192||!botToken)return null;
  const params=new URLSearchParams(initData),hash=params.get('hash');
  if(!hash||!/^[a-f0-9]{64}$/i.test(hash))return null;
  params.delete('hash');
  const authDate=Number(params.get('auth_date'));
  if(!Number.isFinite(authDate)||Math.abs(Date.now()/1000-authDate)>300)return null;
  const check=[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
  const secret=await hmac(new TextEncoder().encode('WebAppData'),botToken);
  if(!safeEqual(hex(await hmac(secret,check)),hash.toLowerCase()))return null;
  try { const user=JSON.parse(params.get('user')||'null');return user?.id?{id:String(user.id)}:null; } catch { return null; }
}
export async function createReaderSession(req,env) {
  if(!env.SHOP_TG_TOKEN||!env.SHOP_FILES)return Response.json({ok:false,error:'reader_unavailable'},{status:503,headers:noStore});
  const body=await req.json().catch(()=>null);
  if(!body||!Number.isSafeInteger(body.orderId)||typeof body.productKey!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(body.productKey))
    return Response.json({ok:false,error:'invalid_request'},{status:400,headers:noStore});
  const tgUser=await verifyInitData(body.initData,env.SHOP_TG_TOKEN);
  if(!tgUser)return Response.json({ok:false,error:'telegram_auth_failed'},{status:401,headers:noStore});
  const order=await env.DB.prepare("SELECT id,telegram_id,items_json FROM shop_orders WHERE id=? AND telegram_id=? AND status='approved'")
    .bind(body.orderId,tgUser.id).first();
  if(!order)return Response.json({ok:false,error:'purchase_not_found'},{status:403,headers:noStore});
  let ids;try{ids=JSON.parse(order.items_json||'[]')}catch{ids=[]}
  if(!Array.isArray(ids)||!ids.includes(body.productKey))return Response.json({ok:false,error:'purchase_not_found'},{status:403,headers:noStore});
  const product=await env.DB.prepare("SELECT product_key,title_ar,content_type,reader_page_count,active FROM shop_products WHERE product_key=?")
    .bind(body.productKey).first();
  if(!product?.active||product.content_type!=='reader'||!Number.isInteger(product.reader_page_count)||product.reader_page_count<1)
    return Response.json({ok:false,error:'reader_not_ready'},{status:409,headers:noStore});
  const token=crypto.randomUUID()+crypto.randomUUID(),now=Date.now(),expires=now+15*60*1000,hash=await sha256(token);
  await env.DB.prepare('INSERT INTO shop_reader_sessions(session_hash,telegram_id,order_id,product_key,expires_at,created_at,last_seen_at) VALUES(?,?,?,?,?,?,?)')
    .bind(hash,tgUser.id,order.id,product.product_key,expires,now,now).run();
  await env.DB.prepare("INSERT INTO shop_reader_access_logs(telegram_id,order_id,product_key,event,created_at) VALUES(?,?,?,?,?)")
    .bind(tgUser.id,order.id,product.product_key,'session_created',now).run();
  return Response.json({ok:true,token,expiresAt:expires,pageCount:product.reader_page_count,title:product.title_ar},{headers:noStore});
}
export async function readerPage(req,env,pageNumber) {
  const auth=req.headers.get('Authorization')||'',token=auth.startsWith('Bearer ')?auth.slice(7):'';
  if(!/^[a-f0-9-]{60,80}$/i.test(token)||!Number.isInteger(pageNumber)||pageNumber<1)return new Response('forbidden',{status:403,headers:noStore});
  const hash=await sha256(token),now=Date.now();
  const session=await env.DB.prepare(`SELECT s.telegram_id,s.order_id,s.product_key,p.reader_page_count
    FROM shop_reader_sessions s JOIN shop_orders o ON o.id=s.order_id JOIN shop_products p ON p.product_key=s.product_key
    WHERE s.session_hash=? AND s.expires_at>? AND o.status='approved' AND p.active=1 AND p.content_type='reader'`)
    .bind(hash,now).first();
  if(!session||pageNumber>session.reader_page_count)return new Response('not found',{status:404,headers:noStore});
  const obj=await env.SHOP_FILES.get('reader-pages/'+session.product_key+'/'+pageNumber+'.webp');
  if(!obj)return new Response('page not ready',{status:404,headers:noStore});
  await env.DB.prepare('UPDATE shop_reader_sessions SET last_seen_at=? WHERE session_hash=?').bind(now,hash).run();
  await env.DB.prepare("INSERT INTO shop_reader_access_logs(telegram_id,order_id,product_key,page_number,event,created_at) VALUES(?,?,?,?,?,?)")
    .bind(session.telegram_id,session.order_id,session.product_key,pageNumber,'page_view',now).run();
  return new Response(obj.body,{headers:{...noStore,'Content-Type':'image/webp'}});
}
export function readerShell() {
 const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><meta name="referrer" content="no-referrer"><title>قارئ مكتبة الحيالي</title><script src="https://telegram.org/js/telegram-web-app.js"></script><style>
 *{box-sizing:border-box}body{margin:0;background:#111827;color:#f9fafb;font-family:system-ui,sans-serif}.top{position:sticky;top:0;background:#172033;padding:12px 16px;display:flex;justify-content:space-between;z-index:2}.muted{color:#cbd5e1;font-size:13px}.page{padding:12px;max-width:900px;margin:auto;position:relative}.page img{display:block;width:100%;height:auto;border-radius:8px;background:white;user-select:none;-webkit-user-drag:none}.watermark{position:absolute;top:45%;left:5%;right:5%;text-align:center;transform:rotate(-25deg);font-size:clamp(15px,3vw,30px);font-weight:700;color:#64748b;opacity:.3;pointer-events:none;white-space:nowrap}.controls{display:flex;gap:12px;justify-content:center;padding:16px}.controls button{padding:10px 20px;border:0;border-radius:8px;background:#2563eb;color:white;font-size:16px}.controls button:disabled{opacity:.35}#status{text-align:center;padding:24px;color:#cbd5e1}</style></head><body><header class="top"><strong id="title">مكتبة الحيالي</strong><span class="muted" id="count"></span></header><main class="page"><img id="page" alt="صفحة الكتاب" draggable="false"><div class="watermark" id="mark">نسخة مرخصة</div></main><div class="controls"><button id="prev" disabled>السابق</button><button id="next" disabled>التالي</button></div><div id="status">يتم التحقق من عملية الشراء…</div><script>
 const tg=window.Telegram?.WebApp;tg?.ready();tg?.expand();const q=new URLSearchParams(location.search),orderId=Number(q.get('order')),productKey=q.get('product');
 let token='',page=1,total=0;const status=document.getElementById('status'),img=document.getElementById('page'),count=document.getElementById('count');
 async function loadPage(){const r=await fetch('/api/shop/reader/page/'+page,{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok){status.textContent='انتهت الجلسة أو الصفحة غير متاحة.';return}const blob=await r.blob();if(img.dataset.url)URL.revokeObjectURL(img.dataset.url);img.dataset.url=URL.createObjectURL(blob);img.src=img.dataset.url;count.textContent=page+' / '+total;status.textContent='';document.getElementById('prev').disabled=page<=1;document.getElementById('next').disabled=page>=total;}
 async function start(){if(!tg?.initData){status.textContent='افتح الكتاب من زر القراءة داخل Telegram.';return}if(!Number.isSafeInteger(orderId)||!productKey){status.textContent='رابط القراءة غير صالح.';return}
 const r=await fetch('/api/shop/reader/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData,orderId,productKey})});const j=await r.json().catch(()=>({}));
 if(!r.ok||!j.ok){status.textContent=j.error==='reader_not_ready'?'الكتاب قيد التجهيز حالياً.':'لا يوجد شراء مؤكد لهذا الكتاب على حسابك.';return}
 token=j.token;total=j.pageCount;document.getElementById('title').textContent=j.title||'قارئ مكتبة الحيالي';const u=tg.initDataUnsafe?.user||{};document.getElementById('mark').textContent='نسخة مرخصة · '+(u.username?'@'+u.username:'ID '+u.id);await loadPage();}
 document.getElementById('prev').onclick=()=>{if(page>1){page--;loadPage()}};document.getElementById('next').onclick=()=>{if(page<total){page++;loadPage()}};
 document.addEventListener('contextmenu',e=>e.preventDefault());start().catch(()=>status.textContent='حدث خطأ أثناء فتح الكتاب.');
 </script></body></html>`;
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8',...noStore,'Content-Security-Policy':"default-src 'self'; script-src 'self' https://telegram.org 'unsafe-inline'; img-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors https://web.telegram.org https://*.telegram.org"}});
}
