(function(){
var root=document.documentElement;
function L(){return root.getAttribute("data-lang")==="en"?"en":"ar"}
function sp(a,e){return '<span data-l="ar">'+a+'</span><span data-l="en">'+e+'</span>'}
function $(i){return document.getElementById(i)}

/* ---------- online coloring ---------- */
var PAGES=[
 {f:"c_i3",ar:"مسجد",en:"Mosque"},{f:"c_i32",ar:"مسجد ليلاً",en:"Night mosque"},{f:"c_i10",ar:"فوانيس",en:"Lanterns"},
 {f:"c_i20",ar:"سجادة",en:"Prayer rug"},{f:"c_i13",ar:"مندالا ١",en:"Mandala 1"},{f:"c_i17",ar:"مندالا ٢",en:"Mandala 2"},
 {f:"c_k3",ar:"تلال وزهور",en:"Hills"},{f:"c_k4",ar:"جبال وبحيرة",en:"Mountains"},{f:"c_k7",ar:"قوس قزح",en:"Rainbow"},
 {f:"c_k8",ar:"منارة",en:"Lighthouse"},{f:"c_k17",ar:"بيت",en:"House"},{f:"c_k22",ar:"شروق",en:"Sunrise"}
];
var COLORS=["#e63946","#f4845f","#f6c945","#8ac926","#2a9d8f","#4cc9f0","#3a86ff","#6a4c93","#f28fb5","#8d5a36","#2b2b2b","#ffffff"];
var cv=$("pc"), ctx=cv.getContext("2d",{willReadFrequently:true}), cur=0, color=COLORS[0];
var G=null, img=null, u32=null, hist=[], busy=false;
var tabs=$("ptabs"), pal=$("ppal");
tabs.innerHTML=PAGES.map(function(p,i){return '<button type="button" role="tab" data-i="'+i+'" aria-selected="'+(i===0)+'">'+sp(p.ar,p.en)+'</button>'}).join("");
pal.innerHTML=COLORS.map(function(c,i){return '<button type="button" class="sw" data-c="'+c+'" style="background:'+c+'" aria-label="'+c+'" aria-pressed="'+(i===0)+'"></button>'}).join("")
 +'<label class="sw" title="+">+<input type="color" id="pcol" value="#ff6600"></label>';
function pick(c){color=c;[].forEach.call(pal.querySelectorAll("button.sw"),function(b){b.setAttribute("aria-pressed",b.getAttribute("data-c")===c)})}
pal.addEventListener("click",function(e){var b=e.target.closest("button.sw");if(b)pick(b.getAttribute("data-c"))});
$("pcol").addEventListener("input",function(e){pick(e.target.value)});
function hex(c){return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]}
function load(i){
 cur=i; hist=[]; $("pload").classList.remove("off");
 [].forEach.call(tabs.children,function(b,j){b.setAttribute("aria-selected",j===i)});
 var im=new Image(); im.onload=function(){
  if(cur!==i)return;
  cv.width=im.naturalWidth; cv.height=im.naturalHeight; ctx.drawImage(im,0,0); img=im;
  var d=ctx.getImageData(0,0,cv.width,cv.height); G=new Uint8Array(cv.width*cv.height);
  for(var k=0;k<G.length;k++)G[k]=d.data[k*4];
  $("pload").classList.add("off");
 };
 im.src="assets/pg/"+PAGES[i].f+".png";
}
tabs.addEventListener("click",function(e){var b=e.target.closest("button");if(b)load(+b.getAttribute("data-i"))});
function fill(x,y){
 if(!G||busy)return; var W=cv.width,H=cv.height, T=140;
 var s=y*W+x;
 if(G[s]<T){ // nudge off an anti-aliased line pixel
  var f=false; for(var r=1;r<=3&&!f;r++)for(var dy=-r;dy<=r&&!f;dy++)for(var dx=-r;dx<=r;dx++){
   var nx=x+dx,ny=y+dy; if(nx>=0&&ny>=0&&nx<W&&ny<H&&G[ny*W+nx]>=T){s=ny*W+nx;f=true;break}}
  if(!f)return;
 }
 var d=ctx.getImageData(0,0,W,H), data=d.data, u=new Uint32Array(data.buffer);
 var seen=new Uint8Array(W*H), q=new Int32Array(W*H), qh=0, qt=0, ch=[];
 q[qt++]=s; seen[s]=1;
 while(qh<qt){var p=q[qh++]; ch.push(p); var px=p%W;
  var n;
  if(px>0){n=p-1; if(!seen[n]&&G[n]>=T){seen[n]=1;q[qt++]=n}}
  if(px<W-1){n=p+1; if(!seen[n]&&G[n]>=T){seen[n]=1;q[qt++]=n}}
  if(p>=W){n=p-W; if(!seen[n]&&G[n]>=T){seen[n]=1;q[qt++]=n}}
  if(p<W*(H-1)){n=p+W; if(!seen[n]&&G[n]>=T){seen[n]=1;q[qt++]=n}}
 }
 var rgb=hex(color), prev=new Uint32Array(ch.length), idx=new Int32Array(ch);
 for(var i=0;i<ch.length;i++){var p=ch[i]; prev[i]=u[p]; var g=G[p]/255;
  var o=p*4; data[o]=Math.round(rgb[0]*g); data[o+1]=Math.round(rgb[1]*g); data[o+2]=Math.round(rgb[2]*g); data[o+3]=255;}
 ctx.putImageData(d,0,0);
 hist.push({idx:idx,prev:prev}); if(hist.length>25)hist.shift();
}
cv.addEventListener("pointerdown",function(e){
 var r=cv.getBoundingClientRect(); fill(Math.floor((e.clientX-r.left)*cv.width/r.width),Math.floor((e.clientY-r.top)*cv.height/r.height));
});
$("pundo").addEventListener("click",function(){
 var h=hist.pop(); if(!h)return; var W=cv.width,H=cv.height, d=ctx.getImageData(0,0,W,H), u=new Uint32Array(d.data.buffer);
 for(var i=0;i<h.idx.length;i++)u[h.idx[i]]=h.prev[i]; ctx.putImageData(d,0,0);
});
$("preset").addEventListener("click",function(){if(img){ctx.drawImage(img,0,0);hist=[]}});
$("pdl").addEventListener("click",function(){
 var o=document.createElement("canvas"); o.width=cv.width; o.height=cv.height+44; var c=o.getContext("2d");
 c.fillStyle="#fff"; c.fillRect(0,0,o.width,o.height); c.drawImage(cv,0,0);
 c.fillStyle="#6b7a90"; c.font="20px sans-serif"; c.textAlign="center"; c.fillText("aboudiiii.github.io  ·  Al-Hayali Digital Library",o.width/2,cv.height+29);
 o.toBlob(function(b){var a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="my-coloring-"+PAGES[cur].f+".png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(a.href)},4000)},"image/png");
});
load(0);

/* ---------- book preview ---------- */
var BOOKS=[{k:"pi",n:8,ar:"الزخارف الإسلامية",en:"Islamic Patterns"},{k:"pk",n:8,ar:"ألوان الطبيعة للأطفال",en:"Nature for Kids"}];
var bi=0, pi=1, vt=$("vtabs"), vi=$("vimg"), vth=$("vthumbs");
vt.innerHTML=BOOKS.map(function(b,i){return '<button type="button" role="tab" data-b="'+i+'" aria-selected="'+(i===0)+'">'+sp(b.ar,b.en)+'</button>'}).join("");
function showP(){
 var b=BOOKS[bi]; vi.src="assets/pg/"+b.k+pi+".jpg";
 var ct="<bdi dir=\"ltr\">"+pi+" / "+b.n+"</bdi>"; $("vcount").innerHTML=ct;
 [].forEach.call(vth.children,function(t,j){t.setAttribute("aria-current",j+1===pi)});
}
function showB(i){
 bi=i;pi=1;[].forEach.call(vt.children,function(t,j){t.setAttribute("aria-selected",j===i)});
 var b=BOOKS[i], h=""; for(var j=1;j<=b.n;j++)h+='<button type="button" data-p="'+j+'" aria-label="'+j+'"><img alt="" loading="lazy" src="assets/pg/'+b.k+j+'.jpg"></button>';
 vth.innerHTML=h; showP();
}
vt.addEventListener("click",function(e){var b=e.target.closest("button");if(b)showB(+b.getAttribute("data-b"))});
vth.addEventListener("click",function(e){var b=e.target.closest("button");if(b){pi=+b.getAttribute("data-p");showP()}});
function step(d){var n=BOOKS[bi].n;pi=((pi-1+d+n)%n)+1;showP()}
$("vnext").addEventListener("click",function(){step(1)});
$("vprev").addEventListener("click",function(){step(-1)});
(function(){var x0=null;vi.addEventListener("touchstart",function(e){x0=e.touches[0].clientX},{passive:true});
 vi.addEventListener("touchend",function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>40)step(dx<0?(root.dir==="rtl"?-1:1):(root.dir==="rtl"?1:-1))})})();
showB(0);

/* ---------- quiz ---------- */
var NAMES={i:["الزخارف الإسلامية (٤٠ تصميماً)","Islamic Patterns (40 designs)","i_cover"],k:["ألوان الطبيعة للأطفال (٢٠ مشهداً)","Nature Coloring Book for Kids (20 scenes)","k_cover"],
 m:["مندالا هندسية (١٠)","Geometric Mandalas (10)","mandala_cover"],a:["مساجد وعمارة إسلامية (٨)","Mosques and Architecture (8)","mosques_cover"],
 f:["زخارف نباتية (٦)","Floral Ornaments (6)","floral_cover"],
 p:["مخطط الدراسة والامتحانات","Study and Exam Planner","planner_cover"],c:["قوالب السيرة الذاتية (Word)","Editable CV Templates (Word)","cv_cover"],e:["كتاب التعلّم الممتع للأطفال","Fun Learning Book for Kids","learn_cover"],t:["متتبع الصلوات والعادات","Prayer and Habit Tracker","tracker_cover"],s:["نجوم وبلاطات هندسية (١٧)","Stars and Tiles (17)","stars_cover"]};
var Q=[
 {ar:"ماذا تبحث عنه؟",en:"What are you looking for?",o:[["me",["تلوين لي (بالغ)","Coloring for me (adult)"]],["kid",["تلوين وتعلّم لطفل","Coloring and learning for a child"]],["both",["تلوين لي ولأطفالي","Coloring for me and my kids"]],["study",["مخطط دراسة أو سيرة ذاتية","A study planner or CV"]],["faith",["متابعة صلواتي وعاداتي","Track my prayers and habits"]]]},
 {ar:"ما الذي يعجبك أكثر؟",en:"What do you like most?",o:[["geo",["زخارف ومندالا هندسية","Geometric patterns and mandalas"]],["arch",["مساجد وعمارة","Mosques and architecture"]],["flo",["زهور وأغصان","Flowers and vines"]],["nat",["مناظر طبيعية","Nature scenes"]]]},
 {ar:"كم تريد من التصاميم؟",en:"How much do you want?",o:[["few",["مجموعة صغيرة وسعر أقل","A small set, lower price"]],["many",["دفتر كامل وفير","A full, generous book"]]]}
];
var qs=0, ans=[], qz=$("qz");
function rec(a){
 var who=a[0],like=a[1],size=a[2],r=[];
 if(who==="study")return["p","c"]; if(who==="faith")return["t"];
 if(who==="kid"||like==="nat"&&who!=="me")r.push("k");
 if(who==="kid")r.push("e");
 if(who!=="kid"){
  if(size==="many"){ if(like!=="nat")r.push("i"); else r.push("k"); }
  else{ var m={geo:"m",arch:"a",flo:"f",nat:"k"}; r.push(m[like]); if(like==="geo")r.push("s") }
 }
 if(who==="both"&&r.indexOf("k")<0)r.push("k");
 return r.filter(function(x,i){return r.indexOf(x)===i}).slice(0,3);
}
function rq(){
 if(qs>=Q.length){var r=rec(ans);
  qz.innerHTML='<div class="qn">'+sp("اقتراحنا لك","Our suggestion")+'</div><h3>'+sp("هذا ما يناسبك","This fits you")+'</h3><div class="rs">'+
   r.map(function(k){var n=NAMES[k];return '<div class="ri"><img alt="" src="assets/'+n[2]+'.jpg?v=3"><div>'+sp(n[0],n[1])+'</div></div>'}).join("")+'</div>'+
   '<div class="acts"><button type="button" id="qgo">'+sp("أضفها للطلب","Add to my order")+'</button><button type="button" class="ghost" id="qre">'+sp("أعد الاختبار","Retake")+'</button></div>';
  $("qgo").onclick=function(){
   [].forEach.call(document.querySelectorAll('#items input'),function(b){var w=r.indexOf(b.value)>-1; if(b.checked!==w){b.checked=w;b.dispatchEvent(new Event("change",{bubbles:true}))}});
   $("order").scrollIntoView({behavior:"smooth"})};
  $("qre").onclick=function(){qs=0;ans=[];rq()}; return}
 var q=Q[qs];
 qz.innerHTML='<div class="qbar"><i style="width:'+(qs/Q.length*100)+'%"></i></div><div class="qn">'+sp("السؤال "+(qs+1)+" من "+Q.length,"Question "+(qs+1)+" of "+Q.length)+'</div><h3>'+sp(q.ar,q.en)+'</h3><div class="qo">'+
  q.o.map(function(o){return '<button type="button" data-v="'+o[0]+'">'+sp(o[1][0],o[1][1])+'</button>'}).join("")+'</div>';
}
qz.addEventListener("click",function(e){var b=e.target.closest(".qo button");if(!b)return;ans[qs]=b.getAttribute("data-v");qs++; if(qs===1&&(ans[0]==="study"||ans[0]==="faith"))qs=Q.length; rq()});
rq();

/* ---------- reviews: shown only when real reviews exist ---------- */
// Add real customer reviews here only after collecting their permission, e.g. {ar:"نص",en:"text",name:"اسم"}
var REVIEWS=[];
if(REVIEWS.length){$("reviews").hidden=false;$("rv").innerHTML=REVIEWS.map(function(r){return '<figure><blockquote>'+sp(r.ar||r.en,r.en||r.ar)+'</blockquote><figcaption>'+(r.name||"")+'</figcaption></figure>'}).join("")}

/* ---------- deal meter in order section ---------- */
var sv=$("saving"), mt=document.createElement("div"); mt.className="meter"; mt.innerHTML='<div class="mt" id="mtt"></div><div class="mb"><i id="mti"></i></div>'; sv.parentNode.insertBefore(mt,sv);
function meter(){
 var c=function(k){var e=$("c_"+k);return e&&e.checked}, books=(c("i")?1:0)+(c("k")?1:0), packs=["m","a","f","s"].filter(c).length, t="", ar=L()==="ar";
 var pct=Math.round((books+packs)/6*100), msg;
 if(books===2&&packs===4)msg=ar?"حصلت على كل الخصومات 🎉":"You unlocked every deal 🎉";
 else{var parts=[]; if(books<2)parts.push(ar?"أضف "+(2-books)+" دفتر لتوفّر $2":"add "+(2-books)+" book(s) to save $2");
  if(packs<4)parts.push(ar?"أضف "+(4-packs)+" حزم لتوفّر $2":"add "+(4-packs)+" pack(s) to save $2"); msg=parts.join(ar?" · ":" · ")}
 $("mtt").textContent=msg; $("mti").style.width=pct+"%";
}
document.addEventListener("change",function(e){if(e.target.closest&&e.target.closest("#items"))meter()});
$("lang").addEventListener("click",function(){setTimeout(meter,0)});
meter();

/* ---------- scroll reveal ---------- */
if("IntersectionObserver" in window&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
 var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}})},{threshold:.08});
 [].forEach.call(document.querySelectorAll(".sec .head,.plaque,.step,.pk,.deal,.thumbs,.free"),function(el){el.classList.add("rvl");io.observe(el)});
}
})();
