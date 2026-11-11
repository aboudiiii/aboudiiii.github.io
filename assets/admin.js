(function(){
"use strict";
var API=(window.HAYALI_API||"").replace(/\/$/,""),BOT=window.HAYALI_TG_BOT||"",KEY="hayali_session";
function $(id){return document.getElementById(id)}
function token(v){try{localStorage.removeItem(KEY);if(v===undefined)return sessionStorage.getItem(KEY)||"";if(v)sessionStorage.setItem(KEY,v);else sessionStorage.removeItem(KEY)}catch(e){}return ""}
var tok=token(),pollTimer=null,lastSummary=null,lastCoupons=[];
function status(id,msg,kind){var n=$(id);n.textContent=msg||"";n.className="status"+(kind?" "+kind:"")}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function request(path,body){
 var headers={"Content-Type":"application/json"};if(tok)headers.Authorization="Bearer "+tok;
 return fetch(API+path,{method:body?"POST":"GET",headers:headers,body:body?JSON.stringify(body):undefined,cache:"no-store"})
 .then(function(r){return r.json().catch(function(){return {ok:false,error:"bad_response"}}).then(function(d){d.status=r.status;return d})})
 .catch(function(){return {ok:false,error:"network"}})
}
function showAuthed(on){$("login").classList.toggle("hide",on);$("dashboard").classList.toggle("hide",!on);$("logout").classList.toggle("hide",!on)}
function signIn(){
 if(!API){status("loginStatus","عنوان API غير مضبوط في config.js","error");return}
 if(!BOT){status("loginStatus","اسم بوت تيليجرام غير مضبوط في config.js","error");return}
 var b=$("loginBtn");b.disabled=true;status("loginStatus","جارٍ تجهيز رابط الدخول…");
 request("/api/auth/tg/start",{t:Date.now()-4000}).then(function(d){
  if(!d.ok||!d.s){b.disabled=false;status("loginStatus","تعذّر بدء تسجيل الدخول. حاول مرة أخرى.","error");return}
  var url="https://t.me/"+BOT+"?start=login_"+d.s,open=$("openTg");open.href=url;open.classList.remove("hide");open.textContent="افتح تيليجرام وأرسل Start";
  status("loginStatus","افتح البوت واضغط Start، ثم أرسل للبوت هذا الرمز: "+(/^\d{6}$/.test(String(d.c))?d.c:"")+" — نتحقق من حسابك هنا…");
  var end=Date.now()+5*60*1000;
  function poll(){
   if(Date.now()>end){b.disabled=false;status("loginStatus","انتهت المهلة. حاول تسجيل الدخول مجدداً.","error");return}
   request("/api/auth/tg/poll",{s:d.s}).then(function(p){
    if(p.ok&&p.token){tok=p.token;token(tok);open.classList.add("hide");b.disabled=false;load();return}
    if(p.pending){pollTimer=setTimeout(poll,2500);return}
    b.disabled=false;status("loginStatus",p.status===403?"هذا الحساب غير مخوّل للإدارة.":"انتهت صلاحية رابط الدخول أو حدث خطأ.","error")
   })
  }
  poll();
 })
}
function fmtDate(t){if(!t)return "—";try{return new Date(Number(t)).toLocaleString("ar-IQ")}catch(e){return "—"}}
function load(){
 Promise.all([request("/api/admin/summary"),request("/api/admin/coupons")]).then(function(rs){
  var s=rs[0],c=rs[1];
  if(s.status===401||s.status===403||c.status===401||c.status===403){token("");tok="";showAuthed(false);status("loginStatus", "الحساب الحالي ليس حساب المالك المصرّح له.", "error");return}
  if(!s.ok||!c.ok){status("loginStatus","تعذّر تحميل لوحة الإدارة. تحقق من إعدادات Worker وترحيل قاعدة البيانات.","error");showAuthed(false);return}
  showAuthed(true);renderSummary(s);renderCoupons(c.coupons||[])
 })
}
function renderSummary(d){
 lastSummary=d;
 if($("customers")) $("customers").textContent=Number(d.customers||0).toLocaleString("en-US");
 $("orders").textContent=Number(d.orders||0).toLocaleString("en-US");
 $("revenue").textContent="$"+Number(d.recorded_revenue_usd||0).toFixed(2);
 $("average").textContent="$"+Number(d.average_recorded_order_usd||0).toFixed(2);
 $("missing").textContent=Number(d.orders_missing_totals||0).toLocaleString("en-US");
 $("couponCount").textContent=Number(d.coupon_count||0).toLocaleString("en-US");
 $("topProducts").innerHTML=(d.top_products||[]).map(function(x){return "<tr><td>"+esc(x.product)+"</td><td>"+esc(x.n)+"</td></tr>"}).join("")||'<tr><td colspan="2">لا توجد بيانات بعد</td></tr>';
 $("daily").innerHTML=(d.daily||[]).map(function(x){return "<tr><td>"+esc(x.day)+"</td><td>"+esc(x.orders)+"</td><td>$"+Number(x.revenue||0).toFixed(2)+"</td></tr>"}).join("")||'<tr><td colspan="3">لا توجد بيانات خلال الفترة</td></tr>';
 if($("monthly")) $("monthly").innerHTML=(d.monthly||[]).map(function(x){return "<tr><td>"+esc(x.month)+"</td><td>"+esc(x.orders)+"</td><td>$"+Number(x.revenue||0).toFixed(2)+"</td></tr>"}).join("")||'<tr><td colspan="3">لا توجد بيانات شهرية</td></tr>';
 if($("audit")) $("audit").innerHTML=(d.audit||[]).map(function(x){return "<tr><td>"+esc(x.action)+"</td><td>"+esc(x.entity_id||"—")+"</td><td>"+esc(fmtDate(x.created_at))+"</td></tr>"}).join("")||'<tr><td colspan="3">لا توجد عمليات إدارية مسجلة</td></tr>';
 $("recent").innerHTML=(d.recent_orders||[]).map(function(x){return "<tr><td>"+esc(x.code)+"</td><td>"+esc(x.email||x.telegram_id||"—")+"</td><td>"+(x.total_usd==null?"غير مسجل":"$"+Number(x.total_usd).toFixed(2))+"</td><td>"+esc(fmtDate(x.paid_at))+"</td></tr>"}).join("")||'<tr><td colspan="4">لا توجد طلبات</td></tr>';
}
function renderCoupons(rows){
 lastCoupons=rows;
 $("coupons").innerHTML=rows.length?rows.map(function(c){
  var active=Number(c.active)===1;
  return '<div class="coupon"><div><b>'+esc(c.code)+'</b> <span class="pill '+(active?"active":"paused")+'">'+(active?"مفعّل":"متوقف")+'</span><div class="note">'+(c.kind==="percent"?Number(c.value)+"%":"$"+Number(c.value).toFixed(2))+' · الحد الأدنى $'+Number(c.min_total_usd||0).toFixed(2)+' · الاستخدام '+Number(c.used_count||0)+(c.max_uses==null?"":" / "+Number(c.max_uses))+'</div></div><div class="actions"><button class="btn secondary" type="button" data-action="toggle" data-id="'+esc(c.id)+'" data-active="'+(active?"0":"1")+'">'+(active?"إيقاف":"تفعيل")+'</button><button class="btn danger" type="button" data-action="delete" data-id="'+esc(c.id)+'">حذف</button></div></div>'
 }).join(""):'<p class="empty">لا توجد كوبونات بعد.</p>';
}
function dateValue(v){return v?new Date(v).getTime():null}

function exportCsv(){
 if(!lastSummary){status("loginStatus","حمّل البيانات أولاً.","error");return}
 var rows=[["تقرير مكتبة الحيالي الرقمية"],["تاريخ الإنشاء",new Date(lastSummary.generated_at).toISOString()],[],["المؤشر","القيمة"],["إجمالي الطلبات",lastSummary.orders],["الإيرادات المسجلة USD",lastSummary.recorded_revenue_usd],["متوسط الطلب USD",lastSummary.average_recorded_order_usd],["طلبات بلا مبلغ",lastSummary.orders_missing_totals],["العملاء المعروفون",lastSummary.customers],[],["الطلبات الأخيرة"],["رمز الطلب","البريد","تيليجرام","المبلغ USD","تاريخ الدفع"]];
 (lastSummary.recent_orders||[]).forEach(function(x){rows.push([x.code,x.email,x.telegram_id,x.total_usd,fmtDate(x.paid_at)])});
 rows.push([],["الأداء الشهري"],["الشهر","الطلبات","الإيراد USD"]);
 (lastSummary.monthly||[]).forEach(function(x){rows.push([x.month,x.orders,x.revenue])});
 rows.push([],["الكوبونات"],["الرمز","النوع","القيمة","مفعّل","عدد الاستخدامات","الحد الأعلى"]);
 lastCoupons.forEach(function(x){rows.push([x.code,x.kind,x.value,x.active,x.used_count,x.max_uses])});
 var csv="\ufeff"+rows.map(function(r){return r.map(function(v){var s=String(v==null?"":v);if(typeof v==="string"&&/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}).join(",")}).join("\r\n");
 var blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="hayali-admin-report-"+new Date().toISOString().slice(0,10)+".csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}

$("exportCsv").addEventListener("click",exportCsv);
$("exportPdf").addEventListener("click",function(){window.print()});
$("loginBtn").addEventListener("click",signIn);
$("refresh").addEventListener("click",load);
$("logout").addEventListener("click",function(){request("/api/auth/logout",{}).finally(function(){token("");tok="";clearTimeout(pollTimer);showAuthed(false)})});
$("couponForm").addEventListener("submit",function(e){
 e.preventDefault();var f=e.currentTarget,b=f.querySelector('button[type="submit"]');b.disabled=true;
 var data={action:"create",code:f.code.value,kind:f.kind.value,value:Number(f.value.value),min_total_usd:Number(f.min_total_usd.value||0),max_uses:f.max_uses.value||null,starts_at:dateValue($("couponStart").value),ends_at:dateValue($("couponEnd").value)};
 request("/api/admin/coupons",data).then(function(d){b.disabled=false;
  if(d.ok){f.reset();$("couponMin").value="0";status("couponStatus","تم إنشاء الكوبون، وهو متوقف افتراضياً.","ok");load()}
  else status("couponStatus",d.error==="coupon_code_exists"?"هذا الرمز مستخدم بالفعل.":"تعذّر إنشاء الكوبون. راجع القيم المدخلة.","error")
 })
});
$("coupons").addEventListener("click",function(e){
 var b=e.target.closest("button[data-action]");if(!b)return;
 var action=b.getAttribute("data-action"),id=b.getAttribute("data-id");
 if(action==="delete"&&!confirm("هل تريد حذف هذا الكوبون؟"))return;
 b.disabled=true;
 request("/api/admin/coupons",{action:action,id:id,active:b.getAttribute("data-active")==="1"}).then(function(d){
  if(d.ok){status("couponStatus",action==="delete"?"تم حذف الكوبون.":"تم تحديث حالة الكوبون.","ok");load()}
  else{b.disabled=false;status("couponStatus","تعذّر تحديث الكوبون.","error")}
 })
});
document.querySelectorAll(".nav a").forEach(function(a){a.addEventListener("click",function(){document.querySelectorAll(".nav a").forEach(function(n){n.classList.remove("active")});a.classList.add("active")})});
if(tok)load();else showAuthed(false);
})();