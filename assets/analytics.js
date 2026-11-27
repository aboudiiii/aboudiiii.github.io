(function(){
"use strict";
var API=(window.HAYALI_API||"").replace(/\/$/,""),CONSENT="hayali_analytics_consent",SESSION="hayali_analytics_session";
if(!API||!document.body)return;
function el(tag,attrs,text){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k])});if(text)n.textContent=text;return n}
function consent(){try{return localStorage.getItem(CONSENT)}catch(e){return null}}
function setConsent(v){try{localStorage.setItem(CONSENT,v)}catch(e){}}
function sessionId(){try{var id=sessionStorage.getItem(SESSION);if(!/^[a-f0-9]{32}$/.test(id||"")){var b=new Uint8Array(16);crypto.getRandomValues(b);id=Array.from(b).map(function(x){return x.toString(16).padStart(2,"0")}).join("");sessionStorage.setItem(SESSION,id)}return id}catch(e){return ""}}
function productFromPath(path){var m=/^\/books\/([a-z0-9-]+)\.html$/i.exec(path);return m?m[1]:""}
function sourceInfo(){
 var u=new URL(location.href),s=(u.searchParams.get("utm_source")||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40),c=(u.searchParams.get("utm_campaign")||"").replace(/[^a-zA-Z0-9 _-]/g,"").slice(0,60);
 if(s)return {source:"campaign",campaign:s+(c?" / "+c:"")};
 var host="";try{host=new URL(document.referrer).hostname.toLowerCase()}catch(e){}
 if(!host||host===location.hostname)return {source:"direct",campaign:""};
 if(/google\.|bing\.|yahoo\.|duckduckgo\./.test(host))return {source:"search",campaign:""};
 if(/facebook\.|instagram\.|tiktok\.|youtube\.|t\.co$|x\.com$/.test(host))return {source:"social",campaign:""};
 if(/mail\.|gmail\.|outlook\./.test(host))return {source:"email",campaign:""};
 return {source:"referral",campaign:""};
}
var page=location.pathname.replace(/[^a-zA-Z0-9_./-]/g,"").slice(0,160)||"/",product=productFromPath(page),src=sourceInfo(),sid="";
function send(event,key){
 if(consent()!=="yes")return;
 sid=sid||sessionId();if(!sid)return;
 var body={session_id:sid,event:event,page:page,product:key||product||"",source:src.source,campaign:src.campaign};
 try{fetch(API+"/api/analytics",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),keepalive:true,credentials:"omit"}).catch(function(){})}catch(e){}
}
function bind(){
 send("page_view");
 if(product)send("product_view",product);
 document.addEventListener("change",function(e){
  var n=e.target;if(!n||n.type!=="checkbox"||!n.checked||!n.closest("#items"))return;
  var key=(n.id||"").replace(/^c_/,"").toLowerCase();if(/^[a-z0-9_-]{1,12}$/.test(key))send("add_to_cart",key);
 });
 document.addEventListener("click",function(e){
  var a=e.target&&e.target.closest?e.target.closest("a,button"):null;if(!a)return;
  var href=a.getAttribute("href")||"";
  if(/t\.me\//i.test(href)){send("telegram_click");return}
  if(a.id==="cartgo"||href==="#order"||/\?add=y(?:#|$)/.test(href))send("begin_checkout");
  var link=/^\/?books\/([a-z0-9-]+)\.html(?:[?#]|$)/i.exec(href);
  if(link)send("product_view",link[1]);
 });
}
function showNotice(){
 if(consent()!==null)return;
 var box=el("aside",{class:"hayali-consent","aria-label":"Analytics privacy choice"});
 box.style.cssText="position:fixed;z-index:9999;inset:auto 12px 12px 12px;max-width:680px;margin:auto;padding:14px 16px;border:1px solid #c7a65c;border-radius:14px;background:#102d27;color:#fff;box-shadow:0 8px 32px #0005;font:14px/1.7 system-ui,sans-serif;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap";
 var copy=el("p",{},document.documentElement.lang==="en"?"We use privacy-friendly, first-party analytics to understand visits and improve the store. No name, email, full referrer URL or ad profile is collected. You can decline.":"نستخدم إحصاءات داخلية لفهم الزيارات وتحسين المتجر، دون جمع الاسم أو البريد أو رابط الإحالة الكامل. تگدر ترفض التتبع.");
 copy.style.cssText="margin:0;flex:1 1 300px";
 var actions=el("div",{});actions.style.cssText="display:flex;gap:8px";
 var accept=el("button",{type:"button"},document.documentElement.lang==="en"?"Allow":"موافق"),reject=el("button",{type:"button"},document.documentElement.lang==="en"?"Decline":"رفض");
 [accept,reject].forEach(function(b){b.style.cssText="border:1px solid #d8b45f;border-radius:9px;padding:8px 13px;background:#d8b45f;color:#10251f;font-weight:700;cursor:pointer"});
 reject.style.background="transparent";reject.style.color="#fff";
 accept.addEventListener("click",function(){setConsent("yes");box.remove();bind()});
 reject.addEventListener("click",function(){setConsent("no");box.remove()});
 actions.append(accept,reject);box.append(copy,actions);document.body.append(box);
}
if(consent()==="yes")bind();else if(consent()!=="no")showNotice();
})();