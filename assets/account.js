/* Order stats badges, email subscription and customer account. Active only when assets/config.js sets window.HAYALI_API. */
(function(){
var API=(window.HAYALI_API||"").replace(/\/$/,""),TG=window.HAYALI_TG_BOT||"";
var sec=document.getElementById("join");if(!API){if(sec)sec.hidden=true;return}
var root=document.documentElement,T0=Date.now(),KEY="hayali_session";
function L(){return root.getAttribute("data-lang")==="en"?"en":"ar"}
function sp(a,e){return '<span data-l="ar">'+a+'</span><span data-l="en">'+e+'</span>'}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function $(id){return document.getElementById(id)}
function store(v){try{if(v===undefined)return localStorage.getItem(KEY);if(v)localStorage.setItem(KEY,v);else localStorage.removeItem(KEY)}catch(e){}return null}
var tok=store();
function api(path,body,auth){
 var h={"Content-Type":"application/json"};if(auth&&tok)h.Authorization="Bearer "+tok;
 if(body)body.t=T0;
 return fetch(API+path,{method:body?"POST":"GET",headers:h,body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().catch(function(){return {ok:false}}).then(function(d){d.status=r.status;return d})}).catch(function(){return {ok:false,error:"network"}})}
var M={bad_email:["اكتب بريدًا صحيحًا.","Enter a valid email."],rate_limited:["محاولات كثيرة. حاول لاحقًا.","Too many attempts. Try later."],too_fast:["انتظر لحظات ثم أعد المحاولة.","Please wait a moment and try again."],invalid_code:["الرمز غير صحيح أو منتهٍ.","The code is wrong or expired."],mail_failed:["تعذّر إرسال البريد الآن.","Could not send the email now."]};
function msg(id,ar,en,bad){var n=$(id);if(!n)return;n.className="rvst"+(bad?" bad":" good");n.innerHTML=sp(ar,en)}
function err(id,d){var m=M[d&&d.error]||["تعذّر الإرسال الآن. حاول لاحقًا.","Could not send right now. Try again later."];msg(id,m[0],m[1],true)}

/* ----- order stats ----- */
var ORD={},MIN=3;
function badge(k){var n=ORD[k]|0;return n>=MIN?n:0}
function decorate(){
 [].forEach.call(document.querySelectorAll("#slist .srow[data-k]"),function(b){var k=b.getAttribute("data-k");
  if(b.querySelector(".hot"))return;var n=badge(k);if(n&&topK()===k){var s=document.createElement("span");s.className="hot";s.innerHTML="🔥 "+sp("الأكثر طلبًا","Most ordered");b.querySelector(".nm").appendChild(s)}});
 var add=document.querySelector("#sdet [data-add]");
 if(add&&!document.querySelector("#sdet .ordn")){var k=add.getAttribute("data-add"),n=badge(k),h=document.querySelector("#sdet h3");
  if(n&&h){var p=document.createElement("p");p.className="ordn";p.innerHTML=(topK()===k?"🔥 "+sp("الأكثر طلبًا","Most ordered")+" · ":"")+sp("طُلب "+n+" مرة","Ordered "+n+" times");h.insertAdjacentElement("afterend",p)}}}
function topK(){var b=null,m=0;for(var k in ORD){if(ORD[k]>m){m=ORD[k];b=k}}return m>=MIN?b:null}
var mo;function watch(){["slist","sdet"].forEach(function(id){var n=$(id);if(n)mo.observe(n,{childList:true})})}
mo=new MutationObserver(function(){mo.disconnect();decorate();watch()});
api("/api/stats").then(function(d){if(d&&d.ok&&d.orders){ORD=d.orders;decorate();watch()}});

/* ----- subscribe ----- */
var sf=$("subForm");
if(sf)sf.addEventListener("submit",function(e){e.preventDefault();var b=sf.querySelector("button");b.disabled=true;
 api("/api/subscribe",{email:sf.email.value,website:sf.website.value}).then(function(d){b.disabled=false;
  if(d.ok){sf.reset();msg("subSt","تحقق من بريدك واضغط رابط التأكيد.","Check your email and tap the confirmation link.")}else err("subSt",d)})});
if(TG&&$("subTg")){$("subTg").href="https://t.me/"+TG+"?start=sub";$("subTg").hidden=false}

/* ----- account ----- */
var af=$("accForm"),cf=$("codeForm"),mail="";
function show(v){$("accIn").hidden=v!=="in";$("accCode").hidden=v!=="code";$("accOut").hidden=v!=="out"}
function money(n){return n?"$"+n:""}
function renderOrders(d){
 $("accEmail").textContent=d.email;var P=window.HAYALI_NAMES||{};
 $("accList").innerHTML=d.orders.length?d.orders.map(function(o){
  var dt=o.paid_at?new Date(o.paid_at).toISOString().slice(0,10):"";
  return '<li><b dir="ltr">'+esc(o.code)+'</b> · <bdi>'+esc(dt)+'</bdi> '+esc(money(o.total))+'<br><small>'+o.items.map(function(k){return esc((P[k]&&P[k][L()])||k)}).join(" · ")+'</small></li>'}).join(""):'<li>'+sp("لا توجد مشتريات مرتبطة بهذا البريد بعد.","No purchases are linked to this email yet.")+'</li>';
 show("out")}
function load(){if(!tok){show("in");return}
 api("/api/me",null,true).then(function(d){if(d.ok)renderOrders(d);else{if(d.status===401){tok=null;store("")}show("in")}})}
if(af)af.addEventListener("submit",function(e){e.preventDefault();var b=af.querySelector("button");b.disabled=true;mail=af.email.value;
 api("/api/auth/request",{email:mail,website:af.website.value}).then(function(d){b.disabled=false;
  if(d.ok){$("codeTo").textContent=mail;show("code");$("codeIn").focus()}else err("accSt",d)})});
if(cf)cf.addEventListener("submit",function(e){e.preventDefault();var b=cf.querySelector("button");b.disabled=true;
 api("/api/auth/verify",{email:mail,code:cf.code.value}).then(function(d){b.disabled=false;
  if(d.ok&&d.token){tok=d.token;store(tok);cf.reset();load()}else err("codeSt",d)})});
if($("accBack"))$("accBack").addEventListener("click",function(){show("in")});
if($("accLogout"))$("accLogout").addEventListener("click",function(){api("/api/auth/logout",{},true);tok=null;store("");show("in")});
load();
})();
