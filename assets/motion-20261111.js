(function(){
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches, hover=matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---- count-up stats ---- */
var stats=$("#stats");
if(stats){
 var n=$$("#items .item").length; $$("b[data-count]",stats).forEach(function(b){if(b.getAttribute("data-count")==="auto")b.setAttribute("data-count",n||16)});
 var run=function(){ $$("b[data-count]",stats).forEach(function(b){var to=+b.getAttribute("data-count")||0;
  if(reduce){b.textContent=to;return}
  var t0=performance.now(),d=1100;(function f(t){var p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);b.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(f)})(t0)})};
 if("IntersectionObserver" in window){var so=new IntersectionObserver(function(es){if(es[0].isIntersecting){so.disconnect();run()}},{threshold:.4});so.observe(stats)}else run();
}

/* ---- staggered pop-in ---- */
if(!reduce&&"IntersectionObserver" in window){
 var po=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");po.unobserve(x.target)}})},{threshold:.12});
 [".ngrid",".strip",".stats"].forEach(function(sel){var box=$(sel);if(!box)return;[].slice.call(box.children).forEach(function(el,i){el.classList.add("pop");el.style.setProperty("--d",(i*70)+"ms");po.observe(el)})});
}

/* ---- hero: drifting sparks + pointer glow ---- */
var hero=$(".hero");
if(hero&&!reduce){
 for(var i=0;i<12;i++){var s=document.createElement("i");s.className="spark";s.setAttribute("aria-hidden","true");
  s.style.cssText="left:"+(Math.random()*96+2).toFixed(1)+"%;top:"+(Math.random()*90+4).toFixed(1)+"%;--s:"+(6+Math.random()*10).toFixed(1)+"px;--t:"+(7+Math.random()*8).toFixed(1)+"s;--dl:-"+(Math.random()*9).toFixed(1)+"s";hero.appendChild(s)}
 if(hover)hero.addEventListener("pointermove",function(e){var r=hero.getBoundingClientRect();hero.style.setProperty("--mx",(e.clientX-r.left)+"px");hero.style.setProperty("--my",(e.clientY-r.top)+"px")});
}

/* ---- 3D tilt on covers and cards ---- */
if(hover&&!reduce){
 var tilt=function(el,host){host=host||el;
  host.addEventListener("pointermove",function(e){var r=host.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
   el.style.setProperty("--ry",(x*14).toFixed(1)+"deg");el.style.setProperty("--rx",(-y*14).toFixed(1)+"deg");el.classList.add("tilting")});
  host.addEventListener("pointerleave",function(){el.style.setProperty("--ry","0deg");el.style.setProperty("--rx","0deg");el.classList.remove("tilting")});
 };
 $$(".shelf a").forEach(function(a){tilt($("img",a),a)});
 $$(".ncard").forEach(function(c){tilt(c)});
 var sd=$("#sdetail");if(sd){var bk=function(){var b=$(".book",sd);if(b&&!b.__t){b.__t=1;tilt(b)}};new MutationObserver(bk).observe(sd,{childList:true});bk()}
}

/* ---- fly-to-cart + sparkle burst ---- */
function burst(x,y){
 for(var i=0;i<9;i++){var p=document.createElement("i");p.className="bst";var a=Math.PI*2*i/9+Math.random()*.5,d=26+Math.random()*26;
  p.style.cssText="left:"+x+"px;top:"+y+"px;--dx:"+(Math.cos(a)*d).toFixed(0)+"px;--dy:"+(Math.sin(a)*d).toFixed(0)+"px";document.body.appendChild(p);setTimeout(function(q){q.remove()},650,p)}
}
function fly(k){
 var pill=$("#cartpill"),sd=$("#sdetail"),lab=$("#c_"+k),li=lab&&lab.parentNode?$("img",lab.parentNode):null,dc=sd?$(".cover",sd):null,src=li;
 if(dc&&li&&dc.getBoundingClientRect().width&&(dc.getAttribute("src")||"").split("?")[0]===(li.getAttribute("src")||"").split("?")[0])src=dc;
 if(!pill||!src)return;
 var a=src.getBoundingClientRect(),b=pill.getBoundingClientRect();if(!a.width||!b.width)return;
 var c=document.createElement("img");c.className="flyimg";c.alt="";c.src=src.currentSrc||src.src;
 var w=Math.min(a.width,90),hh=w*a.height/a.width;
 c.style.cssText="left:"+(a.left+a.width/2-w/2)+"px;top:"+(a.top+a.height/2-hh/2)+"px;width:"+w+"px;height:"+hh+"px";document.body.appendChild(c);
 var dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
 c.animate([{transform:"translate(0,0) scale(1) rotate(0)",opacity:1},{transform:"translate("+dx*.5+"px,"+(dy*.5-60)+"px) scale(.7) rotate(-8deg)",opacity:1,offset:.5},{transform:"translate("+dx+"px,"+dy+"px) scale(.12) rotate(10deg)",opacity:.2}],{duration:750,easing:"cubic-bezier(.5,0,.3,1)"}).onfinish=function(){c.remove();pill.classList.remove("bump");void pill.offsetWidth;pill.classList.add("bump");burst(b.left+b.width/2,b.top+b.height/2)};
}
if(!reduce){document.addEventListener("change",function(e){var t=e.target;if(t&&t.matches&&t.matches("#items input")&&t.checked)setTimeout(function(){fly(t.value)},30)})}

/* ---- ripple ---- */
if(!reduce){document.addEventListener("pointerdown",function(e){var b=e.target.closest&&e.target.closest("button.add,a.btn,.cartpill,.chips button,.sec2,#pdl");if(!b)return;
 var r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),sp=document.createElement("span");sp.className="rip";
 sp.style.cssText="width:"+s+"px;height:"+s+"px;left:"+(e.clientX-r.left-s/2)+"px;top:"+(e.clientY-r.top-s/2)+"px";b.appendChild(sp);setTimeout(function(){sp.remove()},600)})}

/* ---- back to top ---- */
var up=document.createElement("button");up.type="button";up.className="totop";up.setAttribute("aria-label","للأعلى / Back to top");up.textContent="↑";document.body.appendChild(up);
up.addEventListener("click",function(){window.scrollTo({top:0,behavior:reduce?"auto":"smooth"})});
/* Shown only while scrolling up, and hidden again after a short pause, so at rest it never covers text or controls. */
var tick=false,lastY=scrollY,hideT=0,hide=function(){up.classList.remove("on")},
 show=function(){up.classList.add("on");clearTimeout(hideT);hideT=setTimeout(hide,2200)};
addEventListener("scroll",function(){if(tick)return;tick=true;requestAnimationFrame(function(){var y=scrollY;
 if(y<=900)hide();else if(y<lastY-4)show();else if(y>lastY+4)hide();
 lastY=y;tick=false})},{passive:true});
up.addEventListener("touchstart",function(){clearTimeout(hideT)},{passive:true});
up.addEventListener("focus",function(){if(scrollY>900)show()});

/* ---- refined section entrances + page-turn feedback ---- */
if(!reduce&&"IntersectionObserver" in window){
 var revealObserver=new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
   if(entry.isIntersecting){entry.target.classList.add("motion-in");revealObserver.unobserve(entry.target)}
  });
 },{threshold:.14,rootMargin:"0px 0px -36px 0px"});
 $$(".sec>.head,.pv,.qz,.pgm,.order,.dqwrap,.free").forEach(function(el){revealObserver.observe(el)});
}
/* Animate a book page only after its new image has actually loaded. */
var pageImage=$("#vimg");
if(pageImage&&"MutationObserver" in window){
 var pageObserver=new MutationObserver(function(){
  pageImage.addEventListener("load",function(){
   pageImage.classList.remove("page-turn");void pageImage.offsetWidth;pageImage.classList.add("page-turn");
  },{once:true});
 });
 pageObserver.observe(pageImage,{attributes:true,attributeFilter:["src"]});
}
/* Give dynamically selected product details a soft entrance without changing their layout. */
var detail=$("#sdetail");
if(detail&&"MutationObserver" in window){
 var detailObserver=new MutationObserver(function(){
  detail.classList.remove("detail-arrive");void detail.offsetWidth;detail.classList.add("detail-arrive");
 });
 detailObserver.observe(detail,{childList:true,subtree:true});
}

})();