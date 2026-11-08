/* Interactivity boosts: sort, savings nudge, recently viewed, suggestions, share, undo, daily challenge. No dependencies. */
(function(){
var root=document.documentElement;
function L(){return root.getAttribute("data-lang")==="en"?"en":"ar"}
function sp(a,e){return '<span data-l="ar">'+a+'</span><span data-l="en">'+e+'</span>'}
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
var NAMES=window.HAYALI_NAMES||{};
function nm(k){return NAMES[k]?sp(esc(NAMES[k].ar),esc(NAMES[k].en)):""}
function curKey(){var m=/^#shop-([a-z])$/.exec(location.hash);if(m)return m[1];var s=document.querySelector("#slist .srow[aria-selected=true]");return s?s.getAttribute("data-k"):null}

/* ---- 1. sort ---- */
var slist=$("slist"),ORD={},sortMode="def",MO=null;
(function(){
 var box=document.querySelector("#shop .srch");if(!slist||!box)return;
 var s=document.createElement("select");s.id="sortsel";s.className="sortsel";s.setAttribute("aria-label","sort");
 s.innerHTML='<option value="def">'+(L()==="ar"?"الترتيب الافتراضي":"Default order")+'</option><option value="low">'+(L()==="ar"?"الأرخص أولاً":"Cheapest first")+'</option><option value="high">'+(L()==="ar"?"الأغلى أولاً":"Priciest first")+'</option>'+(window.HAYALI_API?'<option value="hot">'+(L()==="ar"?"الأكثر طلباً":"Most ordered")+'</option>':'');
 box.appendChild(s);
 s.addEventListener("change",function(){sortMode=s.value;apply()});
 MO=new MutationObserver(function(){apply()});MO.observe(slist,{childList:true});setTimeout(apply,0);
 if(window.HAYALI_API){try{fetch(window.HAYALI_API+"/api/stats",{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(d){if(d&&d.ok&&d.orders){ORD=d.orders;apply()}})}catch(e){}}
})();
function apply(){
 if(!slist)return;if(MO)MO.disconnect();
 var rows=[].slice.call(slist.querySelectorAll(".srow[data-k]"));
 rows.forEach(function(r,i){if(r.getAttribute("data-i")==null)r.setAttribute("data-i",i)});
 if(sortMode!=="def"){var P=NAMES;
  rows.sort(function(a,b){var ka=a.getAttribute("data-k"),kb=b.getAttribute("data-k"),pa=P[ka]?P[ka].p:0,pb=P[kb]?P[kb].p:0;
   if(sortMode==="low")return pa-pb;if(sortMode==="high")return pb-pa;return (ORD[kb]|0)-(ORD[ka]|0)})
 }else rows.sort(function(a,b){return a.getAttribute("data-i")-b.getAttribute("data-i")});
 var cur=[].slice.call(slist.querySelectorAll(".srow[data-k]")),same=cur.every(function(r,i){return r===rows[i]});
 if(!same){var anchor=slist.querySelector(".addsaved");rows.forEach(function(r){slist.insertBefore(r,anchor)})}
 rows.forEach(function(r){if(r.getAttribute("data-k")==="y"&&!r.querySelector(".start")){var s=document.createElement("span");s.className="start";s.innerHTML=sp("ابدأ من هنا","Start here");r.querySelector(".nm").appendChild(s)}});
 if(MO)MO.observe(slist,{childList:true});
}

/* ---- 4. savings nudge ---- */
(function(){
 var sv=$("saving"),items=$("items");if(!sv||!items)return;
 var n=document.createElement("div");n.className="nudge";n.id="nudge";n.hidden=true;n.setAttribute("aria-live","polite");sv.insertAdjacentElement("afterend",n);
 function on(k){var b=$("c_"+k);return !!(b&&b.checked)}
 function upd(){
  var packs=["m","a","f","s"].filter(on).length,pair=(on("i")?1:0)+(on("k")?1:0),h="",pct=0;
  if(packs>0&&packs<4){var r=4-packs;pct=packs*25;h=sp("أضف "+r+(r===1?" حزمة":" حزم")+" لتوفّر $2","Add "+r+" more pack"+(r===1?"":"s")+" to save $2")}
  else if(pair===1){pct=50;h=sp("أضف "+(on("i")?"ألوان الطبيعة للأطفال":"الزخارف الإسلامية")+" لتوفّر $2","Add the "+(on("i")?"Nature Coloring Book":"Islamic Patterns book")+" to save $2")}
  if(!h){n.hidden=true;n.innerHTML="";return}
  n.hidden=false;n.innerHTML='<div class="nt">🎁 '+h+'</div><div class="nbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="width:'+pct+'%"></i></div>'}
 items.addEventListener("change",function(){setTimeout(upd,0)});
 new MutationObserver(function(){upd()}).observe(root,{attributes:true,attributeFilter:["data-lang"]});
 upd();
})();

/* ---- 5. recently viewed + suggestions, 7. share ---- */
var SUG={y:["j","v"],j:["x","y"],v:["y","x"],x:["j","y"],r:["n"],n:["r"],i:["k","m"],k:["i","a"],m:["a","f"],a:["m","s"],f:["s","m"],s:["f","a"]};
var sdet=$("sdet")||$("sdetail"),lastK=null,shopSec=$("shop");
var box5=document.createElement("div");box5.id="extras";box5.className="extras";
function recent(){try{var a=JSON.parse(store("recent")||"[]");return Array.isArray(a)?a.filter(function(k){return NAMES[k]}):[]}catch(e){return[]}}
function pill(k){return '<button type="button" class="xp" data-go="'+k+'">'+nm(k)+'</button>'}
function renderExtras(){
 var k=curKey();if(!k||!NAMES[k]||!sdet)return;
 if(k!==lastK){lastK=k;var r=recent().filter(function(x){return x!==k});r.unshift(k);store("recent",JSON.stringify(r.slice(0,8)));r.shift();}
 var seen=recent().filter(function(x){return x!==k}).slice(0,4),sug=(SUG[k]||[]).filter(function(x){return NAMES[x]});
 var h="";
 if(sug.length)h+='<div class="xrow"><b>'+sp("قد يعجبك أيضاً","You may also like")+'</b><div>'+sug.map(pill).join("")+'</div></div>';
 if(seen.length)h+='<div class="xrow"><b>'+sp("شاهدتَ مؤخراً","Recently viewed")+'</b><div>'+seen.map(pill).join("")+'</div></div>';
 var url=encodeURIComponent(location.origin+location.pathname+"#shop-"+k),tx=encodeURIComponent(NAMES[k].ar+" - "+NAMES[k].en);
 h+='<div class="xrow"><b>'+sp("شارك","Share")+'</b><div><a class="xp" target="_blank" rel="noopener" href="https://wa.me/?text='+tx+'%20'+url+'">WhatsApp</a><a class="xp" target="_blank" rel="noopener" href="https://t.me/share/url?url='+url+'&text='+tx+'">Telegram</a></div></div>';
 box5.innerHTML=h;
 if(box5.parentNode!==sdet.parentNode)sdet.insertAdjacentElement("afterend",box5);
}
if(sdet){
 box5.addEventListener("click",function(e){var b=e.target.closest("[data-go]");if(b){location.hash="#shop-"+b.getAttribute("data-go")}});
 var t5;new MutationObserver(function(){clearTimeout(t5);t5=setTimeout(renderExtras,30)}).observe(sdet,{childList:true});
 window.addEventListener("hashchange",function(){setTimeout(renderExtras,60)});
 setTimeout(renderExtras,300);
}

/* ---- 7. undo for cart changes ---- */
(function(){
 var items=$("items");if(!items)return;
 var bar=document.createElement("div");bar.className="undo";bar.hidden=true;document.body.appendChild(bar);var tm,quiet=true;setTimeout(function(){quiet=false},1500);
 items.addEventListener("change",function(e){
  var inp=e.target;if(quiet||!inp||!inp.id||inp.id.indexOf("c_")!==0)return;
  var k=inp.id.slice(2),added=inp.checked;
  bar.innerHTML='<span>'+(NAMES[k]?nm(k)+" · ":"")+(added?sp("أُضيف","Added"):sp("أُزيل","Removed"))+'</span><button type="button">'+(L()==="ar"?"تراجع":"Undo")+'</button>';
  bar.hidden=false;clearTimeout(tm);tm=setTimeout(function(){bar.hidden=true},5000);
  bar.querySelector("button").onclick=function(){bar.hidden=true;inp.checked=!added;inp.dispatchEvent(new Event("change",{bubbles:true}))}
 });
})();

/* ---- 8. daily challenge ---- */
var Q=[
 ["ما ناتج ‎print(2 + 3 * 4)‎ في بايثون؟",["14","20","24"],0,"الضرب قبل الجمع: 3*4=12 ثم 2+12=14."],
 ["أي دالة تعطيك طول القائمة؟",["size()","len()","count()"],1,"len(قائمة) ترجع عدد العناصر."],
 ["ما نوع القيمة ‎3.0‎؟",["int","float","str"],1,"أي رقم فيه فاصلة عشرية هو float."],
 ["ما ناتج ‎'ab' * 3‎؟",["ababab","ab3","خطأ"],0,"ضرب النص بعدد يكرره."],
 ["كيف تبدأ حلقة تكرار من ٠ إلى ٤؟",["for i in range(5)","for i in range(0,4)","for i in 5"],0,"range(5) يعطي 0,1,2,3,4."],
 ["أي رمز يبدأ التعليق في بايثون؟",["//","#","/*"],1,"التعليق في بايثون يبدأ بعلامة #."],
 ["ما ناتج ‎7 // 2‎؟",["3.5","3","4"],1,"القسمة الصحيحة تحذف الكسر."],
 ["ما ناتج ‎7 % 2‎؟",["1","3","0"],0,"% يعطي باقي القسمة."],
 ["أي كلمة تُعرّف دالة؟",["func","def","function"],1,"نكتب def اسم_الدالة():"],
 ["ما ناتج ‎bool(0)‎؟",["True","False","None"],1,"الصفر يُعتبر False."],
 ["كيف تضيف عنصراً لنهاية قائمة؟",["add()","append()","push()"],1,"قائمة.append(عنصر)."],
 ["ما ناتج ‎'hello'[1]‎؟",["h","e","l"],1,"الفهرسة تبدأ من ٠ فالحرف الثاني e."],
 ["ما ناتج ‎len('Python')‎؟",["5","6","7"],1,"Python ست حروف."],
 ["أي نوع بيانات يحفظ أزواج مفتاح وقيمة؟",["list","dict","tuple"],1,"القاموس dict."]
];
(function(){
 var host=$("daily-box");if(!host)return;
 var day=Math.floor((Date.now()+3*3600000)/86400000),q=Q[day%Q.length],key="daily_"+day,done=store(key);
 var st=parseInt(store("daily_streak")||"0",10)||0,last=parseInt(store("daily_last")||"0",10)||0;
 if(last<day-1)st=0;
 function paint(sel){
  var ok=sel!=null&&sel===q[2];
  host.innerHTML='<div class="dq" lang="ar" dir="rtl"><p class="dqt">'+esc(q[0])+'</p><div class="dqo">'+q[1].map(function(o,i){
   var c=sel==null?"":(i===q[2]?" good":(i===sel?" bad":""));
   return '<button type="button" class="dqb'+c+'" data-i="'+i+'"'+(sel!=null?" disabled":"")+'><bdi dir="ltr">'+esc(o)+'</bdi></button>'}).join("")+'</div>'
   +(sel!=null?'<p class="dqe" aria-live="polite">'+(ok?"✅ صحيح! ":"❌ ليس هذا. ")+esc(q[3])+'</p>':"")
   +'<p class="dqs">🔥 '+sp("أيام متتالية: "+st,"Day streak: "+st)+'</p>'+(sel!=null?'<p class="dqs">'+sp("عُد غداً لسؤال جديد. وللتعمّق، دفتر بايثون يشرح كل هذا خطوة بخطوة.","Come back tomorrow for a new one. The Python book explains all of this step by step.")+'</p><a class="btn" href="#shop-y">'+(L()==="ar"?"شاهد دفتر بايثون":"See the Python book")+'</a>':"")+'</div>'}
 paint(done==null?null:parseInt(done,10));
 host.addEventListener("click",function(e){var b=e.target.closest(".dqb");if(!b||store(key)!=null)return;
  var i=parseInt(b.getAttribute("data-i"),10);store(key,String(i));
  if(i===q[2]){st=(last===day-1?st:0)+1;last=day;store("daily_streak",String(st));store("daily_last",String(day))}
  paint(i)});
})();
})();
