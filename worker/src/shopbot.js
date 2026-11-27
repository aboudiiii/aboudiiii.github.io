import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { safeEqual } from './util.js';

const API = (env, method) => `https://api.telegram.org/bot${env.SHOP_TG_TOKEN}/${method}`;
const esc = (s) => String(s ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const money = (n, multiplier = 1) => String.fromCharCode(36) + (Number(n || 0) * multiplier / 100).toFixed(2);
async function tg(env, method, payload) {
  const r = await fetch(API(env, method), { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload) });
  const j = await r.json().catch(()=>({}));
  if (!r.ok || !j.ok) throw new Error('telegram_' + method + '_failed');
  return j.result;
}
const kb = rows => ({ inline_keyboard: rows });
async function say(env, chat, text, reply_markup) {
  return tg(env, 'sendMessage', {chat_id:chat, text, parse_mode:'HTML', disable_web_page_preview:true, ...(reply_markup?{reply_markup}:{})});
}
async function user(env, from) {
  const id=String(from.id), now=Date.now();
  await env.DB.prepare(`INSERT INTO shop_users(telegram_id,username,first_name,created_at,updated_at)
    VALUES(?,?,?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET username=excluded.username,first_name=excluded.first_name,updated_at=excluded.updated_at`)
    .bind(id,from.username||null,from.first_name||'',now,now).run();
  return env.DB.prepare('SELECT * FROM shop_users WHERE telegram_id=?').bind(id).first();
}
async function products(env, section) {
  const q= section ? env.DB.prepare('SELECT * FROM shop_products WHERE active=1 AND section=? ORDER BY sort_order') : env.DB.prepare('SELECT * FROM shop_products WHERE active=1 ORDER BY sort_order');
  return (section ? await q.bind(section).all() : await q.all()).results || [];
}
const sections = [
  ['novels','📖 الروايات'],['coloring','🎨 كتب التلوين'],['planners','📋 التعليم والمخططات'],['programming','💻 كتب البرمجة']
];
async function home(env, chat, lang='ar') {
  const row=await env.DB.prepare('SELECT language FROM shop_users WHERE telegram_id=?').bind(String(chat)).first();
  lang=row?.language||lang;
  const en=lang==='en';
  const names=en?['📖 Novels','🎨 Coloring Books','📋 Planners & Learning','💻 Programming']:sections.map(x=>x[1]);
  const rows=sections.map(([id],i)=>[{text:names[i],callback_data:'s:cat:'+id}]);
  rows.push([{text:en?'🛒 Cart':'🛒 السلة',callback_data:'s:cart'},{text:en?'📦 My orders':'📦 طلباتي',callback_data:'s:orders'}]);
  rows.push([{text:en?'🌍 Country':'🌍 اختيار الدولة',callback_data:'s:country'}]);
  rows.push([{text:en?'🎟 Coupon':'🎟 إدخال كوبون',callback_data:'s:coupon'}]);
  rows.push([{text:en?'🎁 Free samples':'🎁 عينات مجانية',callback_data:'s:samples'}]);
  rows.push([{text:en?'💬 Support':'💬 الدعم',callback_data:'s:support'}]);
  rows.push([{text:en?'👥 Invite a friend':'👥 دعوة صديق',callback_data:'s:referral'}]);
  rows.push([{text:en?'🌐 العربية':'🌐 English',callback_data:'s:lang'}]);
  return say(env,chat,en?'Welcome to Al-Hayali Digital Library 📚\\nChoose a category:':'مرحباً بك في مكتبة الحيالي الرقمية 📚\\nاختر القسم الذي تريد تصفحه:',kb(rows));
}
async function showCategory(env, chat, section) {
  const list=await products(env,section);
  const selectedUser=await env.DB.prepare('SELECT country FROM shop_users WHERE telegram_id=?').bind(String(chat)).first();
  const priceMultiplier=await countryMultiplier(env,selectedUser?.country);
  if(!list.length) return say(env,chat,'لا توجد منتجات متاحة حالياً.');
  const rows=list.map(p=>[{text:`${p.title_ar} — ${money(p.price_usd_cents,priceMultiplier)}`,callback_data:'s:p:'+p.product_key}]);
  rows.push([{text:'⬅️ الأقسام',callback_data:'s:home'}]);
  return say(env,chat,'اختر المنتج لعرض التفاصيل:',kb(rows));
}
async function showProduct(env, chat, id, uid) {
  const p=await env.DB.prepare('SELECT * FROM shop_products WHERE product_key=? AND active=1').bind(id).first();
  if(!p) return say(env,chat,'المنتج غير متاح.');
  const cart=await env.DB.prepare('SELECT selected_items FROM shop_users WHERE telegram_id=?').bind(uid).first();
  const selected=JSON.parse(cart?.selected_items||'[]');
  const rows=[[{text:selected.includes(id)?'➖ إزالة من السلة':'➕ أضف إلى السلة',callback_data:'s:toggle:'+id}]];
  rows.push([{text:'🛒 عرض السلة',callback_data:'s:cart'},{text:'⬅️ رجوع',callback_data:'s:cat:'+p.section}]);
  const desc=p.description_ar||'ملف رقمي قابل للتنزيل بعد تأكيد الدفع.';
  const u=await env.DB.prepare('SELECT country FROM shop_users WHERE telegram_id=?').bind(uid).first();
  const priceMultiplier=await countryMultiplier(env,u?.country);
  return say(env,chat,`<b>${esc(p.title_ar)}</b>\n\n${esc(desc)}\n\nالسعر: <b>${money(p.price_usd_cents,priceMultiplier)}</b>`,kb(rows));
}
async function cart(env, chat, uid) {
  const u=await env.DB.prepare('SELECT selected_items,country FROM shop_users WHERE telegram_id=?').bind(uid).first();
  const ids=JSON.parse(u?.selected_items||'[]');
  if(!ids.length) return say(env,chat,'سلتك فارغة حالياً.',kb([[{text:'🛍 تصفح المنتجات',callback_data:'s:home'}]]));
  const marks=ids.map(()=>'?').join(',');
  const r=await env.DB.prepare(`SELECT product_key,title_ar,price_usd_cents FROM shop_products WHERE product_key IN (${marks}) AND active=1`).bind(...ids).all();
  const items=r.results||[], total=items.reduce((a,p)=>a+p.price_usd_cents,0);
  const priceMultiplier=await countryMultiplier(env,u?.country);
  const rows=items.map(p=>[{text:'❌ '+p.title_ar,callback_data:'s:toggle:'+p.product_key}]);
  rows.push([{text:'إتمام الطلب',callback_data:'s:checkout'}],[{text:'إفراغ السلة',callback_data:'s:clear'},{text:'متابعة التسوق',callback_data:'s:home'}]);
  return say(env,chat,items.map(p=>esc(p.title_ar)+' — '+money(p.price_usd_cents,priceMultiplier)).join('\n')+`\n\nالإجمالي: <b>${money(total,priceMultiplier)}</b>`,kb(rows));
}
async function orders(env, chat, uid) {
  const r=await env.DB.prepare('SELECT id,total_usd_cents,status,created_at FROM shop_orders WHERE telegram_id=? ORDER BY id DESC LIMIT 10').bind(uid).all();
  if(!r.results?.length) return say(env,chat,'لا توجد طلبات سابقة.');
  const lines=r.results.map(o=>`#${o.id} · ${money(o.total_usd_cents)} · ${o.status}`);
  const rows=r.results.filter(o=>['pending','review'].includes(o.status)).map(o=>[{text:`إلغاء الطلب #${o.id}`,callback_data:'s:cancelorder:'+o.id}]);
  return say(env,chat,'<b>طلباتك الأخيرة</b>\n'+lines.join('\n'),rows.length?kb(rows):undefined);
}
async function checkout(env, chat, uid) {
  const u=await env.DB.prepare('SELECT selected_items,country,coupon_code FROM shop_users WHERE telegram_id=?').bind(uid).first();
  const ids=JSON.parse(u?.selected_items||'[]');
  if(!ids.length) return say(env,chat,'السلة فارغة.');
  return say(env,chat,'اختر حجم الملفات:',kb([[{text:'A4',callback_data:'s:size:A4'},{text:'Letter',callback_data:'s:size:Letter'}],[{text:'النسختان',callback_data:'s:size:both'}],[{text:'إلغاء',callback_data:'s:cart'}]]));
}
async function createOrder(env, chat, uid, size) {
  if (!['A4','Letter','both'].includes(size)) return say(env,chat,'حجم الملف غير صالح. اختر A4 أو Letter أو النسختين.');
  const u=await env.DB.prepare('SELECT selected_items,country,coupon_code FROM shop_users WHERE telegram_id=?').bind(uid).first();
  const ids=JSON.parse(u?.selected_items||'[]');
  if(!Array.isArray(ids) || !ids.length) return say(env,chat,'السلة فارغة.');
  if(ids.length>20 || ids.some(x=>typeof x!=='string') || new Set(ids).size!==ids.length) return say(env,chat,'السلة غير صالحة. أعد اختيار المنتجات من جديد.');
  const rows=await env.DB.prepare(`SELECT product_key,price_usd_cents,is_single FROM shop_products WHERE active=1 AND product_key IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all();
  const items=rows.results||[];
  if(items.length!==ids.length) return say(env,chat,'بعض المنتجات لم تعد متاحة. حدّث سلتك.');
  const actualSize=items.some(x=>x.is_single)?'A4':size;
  const subtotal=items.reduce((n,p)=>n+p.price_usd_cents,0);
  const priceMultiplier=await countryMultiplier(env,u?.country);
  let discount=0, couponCode=null;
  if(u.coupon_code) {
    const cp=await env.DB.prepare("SELECT percent FROM shop_coupons WHERE code=? AND active=1 AND (expires_at=0 OR expires_at>?) AND (max_uses<0 OR used_count<max_uses)").bind(u.coupon_code,Date.now()).first();
    if(cp) { discount=Math.round(subtotal*Number(cp.percent||0)/100); couponCode=u.coupon_code; }
  }
  const discountedSubtotal=Math.max(0,subtotal-discount);
  const total=Math.round(discountedSubtotal*priceMultiplier);
  const now=Date.now();
  const res=await env.DB.prepare(`INSERT INTO shop_orders(telegram_id,items_json,paper_size,subtotal_usd_cents,discount_usd_cents,total_usd_cents,currency_country,coupon_code,referral_code,status,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?, 'pending',?,?)`).bind(uid,JSON.stringify(ids),actualSize,subtotal,discount,total,u.country||'IQ',couponCode,u.referral_code,now,now).run();
  const oid=res.meta.last_row_id;
  if(couponCode) {
    const used=await env.DB.prepare("UPDATE shop_coupons SET used_count=used_count+1 WHERE code=? AND active=1 AND (max_uses<0 OR used_count<max_uses) AND (expires_at=0 OR expires_at>?)").bind(couponCode,now).run();
    if(!used.meta.changes) {
      await env.DB.prepare('DELETE FROM shop_orders WHERE id=?').bind(oid).run();
      return say(env,chat,'انتهت صلاحية الكوبون أو نفدت استخداماته. أعد المحاولة.');
    }
  }
  await env.DB.batch(items.map(p=>env.DB.prepare('INSERT INTO shop_order_items(order_id,product_key,unit_price_usd_cents) VALUES(?,?,?)').bind(oid,p.product_key,p.price_usd_cents)));
  await env.DB.prepare("UPDATE shop_users SET coupon_code=NULL WHERE telegram_id=?").bind(uid).run();
  await env.DB.prepare("UPDATE shop_users SET selected_items='[]',updated_at=? WHERE telegram_id=?").bind(now,uid).run();
  const payment=env.SHOP_PAYMENT_INSTRUCTIONS||'يرجى التواصل مع الدعم لمعرفة طريقة الدفع المتاحة.';
  await say(env,chat,`تم إنشاء طلبك رقم <b>#${oid}</b>\nالإجمالي: <b>${money(total)}</b>\n\n${esc(payment)}\n\nبعد التحويل أرسل صورة وصل الدفع هنا. سيبقى الطلب قيد المراجعة حتى موافقة الإدارة.`);
  if(env.SHOP_OWNER_ID) await say(env,env.SHOP_OWNER_ID,`طلب جديد #${oid} من العميل ${uid} — ${money(total)}`);
}
async function showSamples(env,chat,uid) {
  const used=await env.DB.prepare('SELECT COUNT(*) n FROM shop_samples WHERE telegram_id=?').bind(uid).first();
  if((used?.n||0)>=3) return say(env,chat,'وصلت إلى الحد المسموح: 3 عينات مجانية.');
  return say(env,chat,'اختر عينة مجانية (متاح حتى 3 عينات):',kb([
    [{text:'عينة تلوين A4',callback_data:'s:sample:Free_Sample_A4.pdf'}],
    [{text:'عينة تلوين Letter',callback_data:'s:sample:Free_Sample_Letter.pdf'}],
    [{text:'عينة مدينة الأصداء',callback_data:'s:sample:Echo_City_Free_Sample.pdf'}],
    [{text:'عينة المرايا الثلاث',callback_data:'s:sample:Three_Mirrors_Free_Sample.pdf'}]
  ]));
}
async function sendSample(env,chat,uid,name) {
  const allowed=new Set(['Free_Sample_A4.pdf','Free_Sample_Letter.pdf','Echo_City_Free_Sample.pdf','Three_Mirrors_Free_Sample.pdf']);
  if(!allowed.has(name)) return say(env,chat,'العينة غير متاحة.');
  // Reserve a slot before contacting Telegram so concurrent clicks cannot exceed the 3-sample cap.
  const reserved=await env.DB.prepare(`INSERT INTO shop_samples(telegram_id,sample_key,created_at)
    SELECT ?,?,? WHERE (SELECT COUNT(*) FROM shop_samples WHERE telegram_id=?) < 3`)
    .bind(uid,name,Date.now(),uid).run();
  if(!reserved.meta.changes) return say(env,chat,'وصلت إلى الحد المسموح: 3 عينات مجانية.');
  const reservationId=reserved.meta.last_row_id;
  try {
    const key='samples/'+name, obj=await env.SHOP_FILES.get(key);
    if(!obj) throw new Error('sample_missing');
    const form=new FormData(); form.set('chat_id',chat); form.set('caption','عينة مجانية من مكتبة الحيالي');
    const stamped=await stampedSampleFile(env,uid,name,obj);
    form.set('document',new File([stamped],name,{type:'application/pdf'}));
    const res=await fetch(API(env,'sendDocument'),{method:'POST',body:form});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data.ok) throw new Error('sample_delivery_failed');
    await say(env,chat,'استمتع بالعينة! ❤️');
  } catch(e) {
    await env.DB.prepare('DELETE FROM shop_samples WHERE id=? AND telegram_id=?').bind(reservationId,uid).run();
    throw e;
  }
}
async function transitionOrderAndReleaseCoupon(env, orderId, telegramId, fromStatus, toStatus, reason = null) {
  const now=Date.now();
  const statements=[
    env.DB.prepare(`UPDATE shop_orders SET status=?,rejection_reason=?,coupon_release_state=CASE WHEN coupon_code IS NOT NULL AND coupon_release_state=0 THEN 1 ELSE coupon_release_state END,updated_at=? WHERE id=? AND telegram_id=? AND status=?
        AND NOT EXISTS (SELECT 1 FROM shop_delivery_locks WHERE order_id=shop_orders.id AND expires_at>?)`)
      .bind(toStatus,reason,now,orderId,telegramId,fromStatus,now),
    env.DB.prepare(`UPDATE shop_coupons SET used_count=MAX(0,used_count-1) WHERE code=(SELECT coupon_code FROM shop_orders WHERE id=? AND status=? AND coupon_release_state=1)`)
      .bind(orderId,toStatus),
    env.DB.prepare(`UPDATE shop_orders SET coupon_release_state=2 WHERE id=? AND status=? AND coupon_release_state=1`)
      .bind(orderId,toStatus)
  ];
  const result=await env.DB.batch(statements);
  return Number(result?.[0]?.meta?.changes||0)>0;
}
export async function stampPdf(bytes, label, watermark) {
  if (!(bytes instanceof ArrayBuffer) && !ArrayBuffer.isView(bytes)) throw new Error('invalid_pdf_bytes');
  const input = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (input.byteLength > 25 * 1024 * 1024) throw new Error('pdf_too_large_to_stamp');
  const pdf = await PDFDocument.load(input, { updateMetadata: true, throwOnInvalidObject: false });
  const pages = pdf.getPages();
  if (!pages.length || pages.length > 500) throw new Error('pdf_page_limit');
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const footer = String(label).replace(/[^\x20-\x7E]/g, '').slice(0, 140);
  const mark = String(watermark).replace(/[^\x20-\x7E]/g, '').slice(0, 100);
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    if (index >= 1 && footer) {
      const size = 7;
      const textWidth = font.widthOfTextAtSize(footer, size);
      page.drawText(footer, { x: Math.max(12, (width - textWidth) / 2), y: 10, size, font, color: rgb(0.42,0.42,0.42), opacity: 0.72 });
    }
    if (index >= 2 && ((index + 1) * 7) % 9 === 0 && mark) {
      const size = Math.min(22, Math.max(12, width / 24));
      const textWidth = font.widthOfTextAtSize(mark, size);
      page.drawText(mark, { x: Math.max(12, (width - textWidth) / 2), y: height * 0.48, size, font, color: rgb(0.55,0.55,0.55), opacity: 0.16, rotate: degrees(-28) });
    }
  });
  pdf.setProducer('Al-Hayali Digital Library');
  pdf.setSubject(footer || 'Personal-use digital license');
  pdf.setModificationDate(new Date());
  return await pdf.save({ useObjectStreams: true });
}
async function stampedOrderFile(env, order, product, key) {
  const obj = await env.SHOP_FILES.get(key);
  if (!obj) throw new Error('r2_missing:' + key);
  const filename = key.split('/').pop();
  const source = await obj.arrayBuffer();
  if (!filename.toLowerCase().endsWith('.pdf')) return { bytes: source, filename, contentType: obj.httpMetadata?.contentType || 'application/octet-stream' };
  const userRow = await env.DB.prepare('SELECT username FROM shop_users WHERE telegram_id=?').bind(order.telegram_id).first();
  const username = String(userRow?.username || order.telegram_id).replace(/[^A-Za-z0-9_]/g, '').slice(0,40) || String(order.telegram_id);
  const label = 'Licensed to order #' + order.id + ' - @' + username + ' - personal use only';
  const watermark = 'Order #' + order.id + ' @' + username;
  const bytes = await stampPdf(source, label, watermark);
  return { bytes, filename, contentType: 'application/pdf' };
}
async function stampedSampleFile(env, uid, name, obj) {
  const bytes = await stampPdf(await obj.arrayBuffer(), 'Free sample - user ' + uid + ' - not for resale', 'Sample user ' + uid);
  return bytes;
}
async function receiveReceipt(env, m) {
  const uid=String(m.from.id), photo=m.photo?.at(-1);
  if(!photo) return false;
  const o=await env.DB.prepare("SELECT id,total_usd_cents FROM shop_orders WHERE telegram_id=? AND status='pending' ORDER BY id DESC LIMIT 1").bind(uid).first();
  if(!o) { await say(env,m.chat.id,'لا يوجد طلب بانتظار إيصال الدفع.'); return true; }
  const saved=await env.DB.prepare("UPDATE shop_orders SET status='review',receipt_file_id=?,receipt_file_unique_id=?,receipt_caption=?,updated_at=? WHERE id=? AND telegram_id=? AND status='pending'")
    .bind(photo.file_id,photo.file_unique_id||null,String(m.caption||'').slice(0,500),Date.now(),o.id,uid).run();
  if(!saved.meta.changes) { await say(env,m.chat.id,'وصل إيصال آخر لهذا الطلب أو تغيّرت حالته. إذا تحتاج مساعدة تواصل مع الدعم.'); return true; }
  await say(env,m.chat.id,'وصل الإيصال ✅ طلبك الآن قيد مراجعة الإدارة.');
  if(env.SHOP_OWNER_ID) await tg(env,'sendPhoto',{chat_id:env.SHOP_OWNER_ID,photo:photo.file_id,caption:`إيصال الطلب #${o.id} — ${money(o.total_usd_cents)} — العميل ${uid}`,reply_markup:kb([[{text:'✅ موافقة وتسليم',callback_data:'s:approve:'+o.id},{text:'❌ رفض',callback_data:'s:reject:'+o.id}]])});
  return true;
}
async function deliver(env, orderId, adminId) {
  const lockToken=crypto.randomUUID(), now=Date.now();
  const lease=await env.DB.prepare(`INSERT INTO shop_delivery_locks(order_id,lock_token,expires_at,created_at)
    SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM shop_orders WHERE id=? AND status IN ('review','delivery_failed'))
    ON CONFLICT(order_id) DO UPDATE SET lock_token=excluded.lock_token,
    expires_at=excluded.expires_at,created_at=excluded.created_at
    WHERE shop_delivery_locks.expires_at < ?`)
    .bind(orderId,lockToken,now+60*60*1000,now,orderId,now).run();
  if(!lease.meta.changes) return 'هناك عملية تسليم أخرى قيد التنفيذ لهذا الطلب.';
  const o=await env.DB.prepare("SELECT * FROM shop_orders WHERE id=? AND status IN ('review','delivery_failed')").bind(orderId).first();
  if(!o) {
    await env.DB.prepare('DELETE FROM shop_delivery_locks WHERE order_id=? AND lock_token=?').bind(orderId,lockToken).run();
    return 'الطلب غير موجود أو تمت معالجته.';
  }
  const ids=JSON.parse(o.items_json||'[]');
  try {
    for(const id of ids) {
      const p=await env.DB.prepare('SELECT * FROM shop_products WHERE product_key=? AND active=1').bind(id).first();
      if(!p) throw new Error('missing_product:'+id);
      const keys=p.is_single?[p.file_single_key]:o.paper_size==='both'?[p.file_a4_key,p.file_letter_key]:[o.paper_size==='Letter'?p.file_letter_key:p.file_a4_key];
      const required=keys.filter(Boolean);
      if(!required.length) throw new Error('missing_file_key:'+id);
      for(const key of required) {
        // Track every physical file independently so a retry never resends a file
        // that Telegram already accepted when a later file in the same product failed.
        const deliveryKey=id+':'+key.split('/').pop();
        const prior=await env.DB.prepare("SELECT status FROM shop_delivery_attempts WHERE order_id=? AND product_key=? ORDER BY attempt_no DESC LIMIT 1").bind(orderId,deliveryKey).first();
        if(prior?.status==='sent') continue;
        const count=await env.DB.prepare("SELECT COUNT(*) n FROM shop_delivery_attempts WHERE order_id=? AND product_key=?").bind(orderId,deliveryKey).first();
        if(count.n>=5) throw new Error('delivery_limit:'+deliveryKey);
        const attemptNo=count.n+1;
        await env.DB.prepare("INSERT INTO shop_delivery_attempts(order_id,product_key,attempt_no,status,created_at) VALUES(?,?,?,'started',?)").bind(orderId,deliveryKey,attemptNo,Date.now()).run();
        const stamped=await stampedOrderFile(env,o,p,key);
        const form=new FormData();
        form.set('chat_id',o.telegram_id);
        form.set('caption',p.title_ar||id);
        form.set('document',new File([stamped.bytes],stamped.filename,{type:stamped.contentType}));
        const rr=await fetch(API(env,'sendDocument'),{method:'POST',body:form});
        const jj=await rr.json().catch(()=>({}));
        if(!rr.ok||!jj.ok) throw new Error('telegram_delivery_failed:'+deliveryKey);
        await env.DB.prepare("UPDATE shop_delivery_attempts SET status='sent',telegram_message_id=? WHERE order_id=? AND product_key=? AND attempt_no=?").bind(String(jj.result.message_id),orderId,deliveryKey,attemptNo).run();
      }
    }
    const done=await env.DB.prepare("UPDATE shop_orders SET status='approved',approved_at=COALESCE(approved_at,?),approved_by=?,delivery_error=NULL,updated_at=? WHERE id=? AND status IN ('review','delivery_failed')").bind(Date.now(),adminId,Date.now(),orderId).run();
    if(!done.meta.changes) return 'تعذر تثبيت حالة الطلب؛ تحقق من سجل التسليم.';
    await say(env,o.telegram_id,`تم تأكيد طلبك #${orderId} وتسليم ملفاتك بنجاح. شكراً لثقتك بمكتبة الحيالي ❤️`);
    await say(env,o.telegram_id,'قيّم تجربتك معنا:',kb([[{text:'⭐ 1',callback_data:'s:rate:'+orderId+':1'},{text:'⭐ 2',callback_data:'s:rate:'+orderId+':2'},{text:'⭐ 3',callback_data:'s:rate:'+orderId+':3'},{text:'⭐ 4',callback_data:'s:rate:'+orderId+':4'},{text:'⭐ 5',callback_data:'s:rate:'+orderId+':5'}]]));
    return 'تمت الموافقة والتسليم.';
  } catch(e) {
    await env.DB.prepare("UPDATE shop_delivery_attempts SET status='failed',error=? WHERE order_id=? AND status='started'").bind(String(e.message).slice(0,200),orderId).run();
    await env.DB.prepare("UPDATE shop_orders SET status='delivery_failed',delivery_error=?,updated_at=? WHERE id=? AND status IN ('review','delivery_failed')").bind(String(e.message).slice(0,300),Date.now(),orderId).run();
    if(env.SHOP_OWNER_ID) await say(env,env.SHOP_OWNER_ID,`تعذّر إكمال تسليم الطلب #${orderId}: ${esc(e.message)}`);
    return 'فشل التسليم. سُجلت المحاولة ويمكن للإدارة إعادة المحاولة بعد التحقق.';
  } finally {
    await env.DB.prepare('DELETE FROM shop_delivery_locks WHERE order_id=? AND lock_token=?').bind(orderId,lockToken).run();
  }
}
async function callback(env, cb) {
  const data=String(cb.data||'').split(':'), action=data[1], uid=String(cb.from.id), chat=cb.message?.chat?.id;
  const admin=uid===String(env.SHOP_OWNER_ID||'');
  if(action==='approve'||action==='reject') {
    if(!admin) return tg(env,'answerCallbackQuery',{callback_query_id:cb.id,text:'غير مصرّح'});
    const id=Number(data[2]);
    if(action==='approve') { const result=await deliver(env,id,uid); await tg(env,'answerCallbackQuery',{callback_query_id:cb.id,text:result.slice(0,180)}); }
    else {
      const order=await env.DB.prepare('SELECT telegram_id FROM shop_orders WHERE id=?').bind(id).first();
      const changed=order ? await transitionOrderAndReleaseCoupon(env,id,order.telegram_id,'review','rejected','owner_rejected') : false;
      if(changed && order) await say(env,order.telegram_id,`تم رفض طلبك #${id} بعد مراجعة الإيصال. إذا تعتقد أن هناك خطأ، تواصل مع الدعم.`);
      await tg(env,'answerCallbackQuery',{callback_query_id:cb.id,text:changed?'تم رفض الطلب':'الطلب قيد التسليم أو تمت معالجته مسبقاً'});
    }
    return;
  }
  await user(env,cb.from);
  if(action==='home') await home(env,chat);
  else if(action==='cat') await showCategory(env,chat,data[2]);
  else if(action==='p') await showProduct(env,chat,data[2],uid);
  else if(action==='cart') await cart(env,chat,uid);
  else if(action==='orders') await orders(env,chat,uid);
  else if(action==='cancelorder') {
    const id=Number(data[2]);
    const changed=await transitionOrderAndReleaseCoupon(env,id,uid,'pending','cancelled');
    await say(env,chat,changed?'تم إلغاء الطلب وإرجاع استخدام الكوبون إن وُجد.':'لا يمكن إلغاء هذا الطلب؛ قد يكون قيد المراجعة أو تمت معالجته.');
    await orders(env,chat,uid);
  }
  else if(action==='checkout') await checkout(env,chat,uid);
  else if(action==='coupon') { await env.DB.prepare("UPDATE shop_users SET active_mode='coupon' WHERE telegram_id=?").bind(uid).run(); await say(env,chat,'أرسل رمز الكوبون الآن، أو /cancel للإلغاء.'); }
  else if(action==='country') {
    const countries=await env.DB.prepare('SELECT code,name_ar,flag FROM shop_countries WHERE active=1 ORDER BY code').all();
    const rows=(countries.results||[]).map(x=>[{text:x.flag+' '+x.name_ar,callback_data:'s:setcountry:'+x.code}]);
    rows.push([{text:'⬅️ رجوع',callback_data:'s:home'}]);
    await say(env,chat,'اختر بلدك حتى تظهر الأسعار المناسبة:',kb(rows));
  }
  else if(action==='setcountry') {
    const code=data[2];
    const valid=await env.DB.prepare('SELECT code FROM shop_countries WHERE code=? AND active=1').bind(code).first();
    if(valid) {
      await env.DB.prepare('UPDATE shop_users SET country=?,updated_at=? WHERE telegram_id=?').bind(code,Date.now(),uid).run();
      await say(env,chat,'تم تحديث بلدك بنجاح. الأسعار ستُحسب وفق بلدك المختار.');
      await home(env,chat);
    }
  }
  else if(action==='clear') { await env.DB.prepare("UPDATE shop_users SET selected_items='[]' WHERE telegram_id=?").bind(uid).run(); await cart(env,chat,uid); }
  else if(action==='toggle') {
    const p=data[2], row=await env.DB.prepare('SELECT selected_items FROM shop_users WHERE telegram_id=?').bind(uid).first(), a=JSON.parse(row?.selected_items||'[]');
    const next=a.includes(p)?a.filter(x=>x!==p):[...a,p].slice(0,20);
    await env.DB.prepare('UPDATE shop_users SET selected_items=?,updated_at=? WHERE telegram_id=?').bind(JSON.stringify(next),Date.now(),uid).run();
    await showProduct(env,chat,p,uid);
  } else if(action==='size') await createOrder(env,chat,uid,data[2]);
  else if(action==='lang') {
    const current=await env.DB.prepare('SELECT language FROM shop_users WHERE telegram_id=?').bind(uid).first();
    const next=current?.language==='en'?'ar':'en';
    await env.DB.prepare('UPDATE shop_users SET language=?,updated_at=? WHERE telegram_id=?').bind(next,Date.now(),uid).run();
    await home(env,chat,next);
  }
  else if(action==='rate') { const id=Number(data[2]), rating=Number(data[3]); if(!Number.isInteger(rating)||rating<1||rating>5) return; const saved=await env.DB.prepare("UPDATE shop_orders SET rating=?,review_requested_at=COALESCE(review_requested_at,?),updated_at=? WHERE id=? AND telegram_id=? AND status='approved' AND rating IS NULL").bind(rating,Date.now(),Date.now(),id,uid).run(); await say(env,chat,saved.meta.changes?'شكراً لتقييمك! نقدر رأيك ❤️':'تم تسجيل تقييمك مسبقاً أو الطلب غير مؤهل.'); }
  else if(action==='samples') await showSamples(env,chat,uid);
  else if(action==='sample') await sendSample(env,chat,uid,data.slice(2).join(':'));
  else if(action==='support') { await env.DB.prepare("UPDATE shop_users SET active_mode='support' WHERE telegram_id=?").bind(uid).run(); await say(env,chat,'أرسل رسالتك الآن. للإلغاء أرسل /cancel.'); }
  else if(action==='referral') { const bot=String(env.SHOP_BOT_USERNAME||'').replace(/^@/,''); if(!bot) return say(env,chat,'رابط الدعوة غير مهيأ حالياً.'); await say(env,chat,'شارك رابطك مع أصدقائك وساهم في نشر مكتبة الحيالي: https://t.me/'+bot+'?start=ref_'+uid); }
  await tg(env,'answerCallbackQuery',{callback_query_id:cb.id}).catch(()=>{});
}
export async function setupShopWebhook(env,url) {
  if(!safeEqual(url.pathname,'/setup-shop/'+env.SHOP_TG_WEBHOOK_SECRET)) return new Response('forbidden',{status:403});
  if(!env.SHOP_TG_TOKEN || !env.SHOP_TG_WEBHOOK_SECRET) return new Response('ShopBot secrets are not configured',{status:503});
  const hook=`${url.origin}/shop-tg/${env.SHOP_TG_WEBHOOK_SECRET}`;
  const result=await tg(env,'setWebhook',{url:hook,secret_token:env.SHOP_TG_WEBHOOK_SECRET,allowed_updates:['message','callback_query']});
  return new Response(result ? 'ShopBot webhook registered. You can close this page.' : 'Webhook setup failed',{status:200});
}
export async function shopWebhook(req,env,url) {
  if(!safeEqual(url.pathname,'/shop-tg/'+env.SHOP_TG_WEBHOOK_SECRET)) return new Response('forbidden',{status:403});
  if(req.headers.get('X-Telegram-Bot-Api-Secret-Token')!==env.SHOP_TG_WEBHOOK_SECRET) return new Response('forbidden',{status:403});
  const update=await req.json().catch(()=>null);
  if(!update?.update_id) return new Response('bad update',{status:400});
  const claim=await env.DB.prepare('INSERT OR IGNORE INTO shop_webhook_updates(update_id,processed_at) VALUES(?,?)').bind(update.update_id,Date.now()).run();
  if(!claim.meta.changes) return new Response('ok');
  try {
    if(update.message) {
      const m=update.message;
      if(m.from?.id) await user(env,m.from);
      if(m.photo) await receiveReceipt(env,m);
      else if(/^\/start/.test(m.text||'')) {
        const payload=(m.text||'').trim().split(/\s+/,2)[1]||'';
        const match=payload.match(/^ref_(\d{5,20})$/);
        if(match && match[1]!==String(m.from.id)) await env.DB.prepare('UPDATE shop_users SET referral_code=COALESCE(referral_code,?),updated_at=? WHERE telegram_id=? AND referral_code IS NULL').bind(match[1],Date.now(),String(m.from.id)).run();
        await home(env,m.chat.id);
      }
      else if(m.reply_to_message && String(m.chat.id)===String(env.SHOP_OWNER_ID||'')) {
        const link=await env.DB.prepare('SELECT telegram_id FROM shop_support_links WHERE owner_message_id=?').bind(String(m.reply_to_message.message_id)).first();
        if(link) await say(env,link.telegram_id,'💬 رد الدعم:\\n'+esc(m.text||m.caption||''));
      }
      else if(m.text==='/cancel' && String(m.chat.id)!==String(env.SHOP_OWNER_ID||'')) {
        await env.DB.prepare("UPDATE shop_users SET active_mode='' WHERE telegram_id=?").bind(String(m.from.id)).run();
        await say(env,m.chat.id,'تم الإلغاء.');
      }
      else if(m.text && String(m.chat.id)!==String(env.SHOP_OWNER_ID||'') && (await env.DB.prepare('SELECT active_mode FROM shop_users WHERE telegram_id=?').bind(String(m.from.id)).first())?.active_mode==='coupon') {
        const code=m.text.trim().toUpperCase().slice(0,20);
        const cp=await env.DB.prepare("SELECT code FROM shop_coupons WHERE code=? AND active=1 AND (expires_at=0 OR expires_at>?) AND (max_uses<0 OR used_count<max_uses)").bind(code,Date.now()).first();
        await env.DB.prepare("UPDATE shop_users SET active_mode='',coupon_code=? WHERE telegram_id=?").bind(cp?code:null,String(m.from.id)).run();
        await say(env,m.chat.id,cp?'تم تفعيل الكوبون. سيظهر الخصم عند إنشاء الطلب.':'الكوبون غير صالح أو منتهي.');
      }
      else if(String(m.chat.id)!==String(env.SHOP_OWNER_ID||'')) {
        const support=await env.DB.prepare("SELECT active_mode FROM shop_users WHERE telegram_id=?").bind(String(m.from.id)).first();
        if(support?.active_mode==='support') {
          const sent=await say(env,env.SHOP_OWNER_ID,'رسالة دعم من '+esc(m.from.first_name||'عميل')+' (@'+esc(m.from.username||'بدون')+'):\\n'+esc(m.text||m.caption||'[مرفق]'));
          await env.DB.prepare('INSERT OR REPLACE INTO shop_support_links(owner_message_id,telegram_id,customer_message_id,created_at) VALUES(?,?,?,?)').bind(String(sent.message_id),String(m.from.id),String(m.message_id),Date.now()).run();
          await env.DB.prepare("UPDATE shop_users SET active_mode='' WHERE telegram_id=?").bind(String(m.from.id)).run();
          await say(env,m.chat.id,'وصلت رسالتك للدعم. سنرد عليك هنا.');
        } else if(m.text && !m.text.startsWith('/')) {
          const sent=await say(env,env.SHOP_OWNER_ID,'رسالة من '+esc(m.from.first_name||'عميل')+':\\n'+esc(m.text));
          await env.DB.prepare('INSERT OR REPLACE INTO shop_support_links(owner_message_id,telegram_id,customer_message_id,created_at) VALUES(?,?,?,?)').bind(String(sent.message_id),String(m.from.id),String(m.message_id),Date.now()).run();
          await say(env,m.chat.id,'وصلت رسالتك للإدارة.');
        }
      }
      else if(m.text?.startsWith('/')) {
        if(String(m.from?.id)!==String(env.SHOP_OWNER_ID||'')) await say(env,m.chat.id,'الأمر غير متاح.');
        else {
          const [command,...args]=(m.text||'').trim().split(/\\s+/);
          if(command==='/help') await say(env,m.chat.id,'<b>أوامر الإدارة</b>\\n/pending — الطلبات قيد المراجعة\\n/stats — إحصائيات المتجر\\n/coupon CODE PERCENT MAX — إنشاء كوبون');
          else if(command==='/pending') {
            const q=await env.DB.prepare("SELECT id,telegram_id,total_usd_cents,status FROM shop_orders WHERE status IN ('pending','review','delivery_failed') ORDER BY created_at LIMIT 20").all();
            await say(env,m.chat.id,q.results?.length?q.results.map(o=>`#${o.id} · ${o.status} · ${money(o.total_usd_cents)} · ${o.telegram_id}`).join('\\n'):'لا توجد طلبات معلقة.');
          } else if(command==='/stats') {
            const q=await env.DB.prepare("SELECT COUNT(*) total, SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) approved, SUM(CASE WHEN status IN ('pending','review','delivery_failed') THEN 1 ELSE 0 END) open, SUM(CASE WHEN status='approved' THEN total_usd_cents ELSE 0 END) revenue FROM shop_orders").first();
            await say(env,m.chat.id,`<b>إحصائيات المتجر</b>\\nكل الطلبات: ${q.total||0}\\nالمكتملة: ${q.approved||0}\\nالمعلقة: ${q.open||0}\\nالإيراد المسجل: ${money(q.revenue||0)}`);
          } else if(command==='/coupon') {
            const [code,percentRaw,maxRaw]=args, percent=Number(percentRaw), max=Number(maxRaw??-1);
            if(!/^[A-Z0-9_-]{3,20}$/.test(code||'')||!Number.isInteger(percent)||percent<1||percent>90||!Number.isInteger(max)||max===0||max< -1) await say(env,m.chat.id,'الصيغة: /coupon CODE PERCENT MAX\\nمثال: /coupon SAVE10 10 100\\nاستخدم -1 لعدد غير محدود.');
            else {
              await env.DB.prepare("INSERT INTO shop_coupons(code,percent,max_uses,used_count,expires_at,active,created_at,created_by) VALUES(?,?,?,0,0,1,?,?) ON CONFLICT(code) DO UPDATE SET percent=excluded.percent,max_uses=excluded.max_uses,active=1").bind(code.toUpperCase(),percent,max,Date.now(),String(m.from.id)).run();
              await say(env,m.chat.id,`تم إنشاء/تحديث الكوبون ${esc(code.toUpperCase())} بخصم ${percent}%.`);
            }
          } else await say(env,m.chat.id,'أمر غير معروف. أرسل /help.');
        }
      }
    }
    if(update.callback_query) await callback(env,update.callback_query);
  } catch(e) {
    // Remove the dedupe marker so Telegram can retry transient failures.
    await env.DB.prepare('DELETE FROM shop_webhook_updates WHERE update_id=?').bind(update.update_id).run();
    console.error('shopbot_update_failed',String(e?.message||'unknown').slice(0,120));
    return new Response('retry',{status:500});
  }
  return new Response('ok');
}
async function countryMultiplier(env, code) {
  const row = await env.DB.prepare('SELECT price_multiplier FROM shop_countries WHERE code=? AND active=1').bind(code || 'IQ').first();
  return Number(row?.price_multiplier || 1);
}
