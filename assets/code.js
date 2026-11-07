(function(){
var $=function(i){return document.getElementById(i)};
var box=$("pgm");if(!box)return;
function sp(a,e){return '<span data-l="ar">'+a+'</span><span data-l="en">'+e+'</span>'}
var ORIGINAL={
html:'<div class="card">\n  <h3>تعلّم بايثون من الصفر</h3>\n  <p class="price">$3.33</p>\n  <p class="iqd" id="iqd"></p>\n  <button id="add">أضف للسلة</button>\n  <p class="cart" id="cart">السلة فاضية</p>\n</div>',
css:'body {\n  font-family: system-ui, sans-serif;\n  display: grid;\n  place-items: center;\n  padding: 24px;\n  background: #f3ecdc;\n}\n.card {\n  width: 240px;\n  padding: 18px;\n  text-align: center;\n  background: #fff;\n  border: 2px solid #d4a63a;\n  border-radius: 16px;\n}\n.price { font-size: 26px; font-weight: 700; margin: 4px 0; }\n.iqd { color: #6b6b6b; margin: 0 0 12px; }\nbutton {\n  background: #d4a63a;\n  border: 0;\n  padding: 10px 20px;\n  border-radius: 999px;\n  font-size: 16px;\n  cursor: pointer;\n}\nbutton:hover { background: #b88a1f; }\n.cart { margin-top: 12px; }',
js:'// Dollar to dinar, same rounding as this site\nconst usd = 3.33;\nconst rate = 1500;\nconst iqd = Math.round(usd * rate / 250) * 250;\ndocument.getElementById("iqd").textContent =\n  "≈ " + iqd.toLocaleString("en-US") + " IQD";\n\nlet count = 0;\ndocument.getElementById("add").addEventListener("click", function () {\n  count++;\n  const total = (count * iqd).toLocaleString("en-US");\n  document.getElementById("cart").textContent =\n    "In cart: " + count + " | Total: " + total + " IQD";\n});'};
var ROLES={
html:[sp("HTML: الهيكل","HTML: structure"),sp("يحدد ما الموجود في الصفحة: عنوان وسعر وزر. بدون CSS تبدو الصفحة بسيطة، وبدون JavaScript لا يعمل الزر.","Defines what is on the page: a title, a price, a button. Without CSS it looks plain; without JavaScript the button does nothing."),sp("غيّر عنوان الكتاب إلى أي اسم، أو أضف سطراً <p>جديد</p>.","Change the book title to any name, or add a line <p>new</p>.")],
css:[sp("CSS: الشكل","CSS: style"),sp("يختار الألوان والمسافات والإطار وشكل الزر. لا يغيّر المحتوى، بل طريقة ظهوره.","Chooses colors, spacing, borders and the button shape. It does not change the content, only how it looks."),sp("غيّر #d4a63a إلى red، أو border-radius: 16px إلى 0.","Change #d4a63a to red, or border-radius: 16px to 0.")],
js:[sp("JavaScript: الحركة","JavaScript: behavior"),sp("يحسب السعر بالدينار ويعدّ الضغطات ويحدّث السلة. هذا ما يجعل الصفحة تتفاعل.","Computes the dinar price, counts clicks and updates the cart. This is what makes a page react."),sp("غيّر rate من 1500 إلى 1400 وشاهد السعر.","Change rate from 1500 to 1400 and watch the price.")]};
var code={html:ORIGINAL.html,css:ORIGINAL.css,js:ORIGINAL.js},cur="html",timer=null;
var ta=$("pgcode"),out=$("pgout"),errEl=$("pgerr"),role=$("pgrole");
try{var sv=JSON.parse(localStorage.getItem("pg_code")||"null");if(sv&&typeof sv.html==="string"&&typeof sv.css==="string"&&typeof sv.js==="string")code={html:sv.html.slice(0,20000),css:sv.css.slice(0,20000),js:sv.js.slice(0,20000)}}catch(e){}
function save(){try{localStorage.setItem("pg_code",JSON.stringify(code))}catch(e){}}
function showTab(k){cur=k;[].forEach.call(box.querySelectorAll("#pgtabs button"),function(b){b.setAttribute("aria-selected",b.getAttribute("data-k")===k?"true":"false")});
 var r=ROLES[k];role.innerHTML="<b>"+r[0]+"</b><p>"+r[1]+'</p><p class="try"><b>'+sp("جرّب:","Try:")+"</b> "+r[2]+"</p>";ta.value=code[k]}
function render(){
 var offCss=$("pgoffcss").checked,offJs=$("pgoffjs").checked;errEl.textContent="";
 var js=offJs?"":'<script>window.onerror=function(m){parent.postMessage({pgErr:String(m)},"*")}<\/script><script>'+code.js.replace(/<\/script/gi,"<\\/script")+'\n<\/script>';
 var css=offCss?"":"<style>"+code.css.replace(/<\/style/gi,"")+"</style>";
 out.srcdoc='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+css+"</head><body>"+code.html+js+"</body></html>"}
window.addEventListener("message",function(e){if(e.source===out.contentWindow&&e.data&&typeof e.data.pgErr==="string")errEl.textContent=(document.documentElement.getAttribute("data-lang")==="en"?"Error: ":"خطأ: ")+e.data.pgErr.slice(0,200)});
ta.addEventListener("input",function(){code[cur]=ta.value;save();clearTimeout(timer);timer=setTimeout(render,300)});
ta.addEventListener("keydown",function(e){if(e.key==="Tab"){e.preventDefault();var s=ta.selectionStart;ta.setRangeText("  ",s,ta.selectionEnd,"end");ta.dispatchEvent(new Event("input"))}});
[].forEach.call(box.querySelectorAll("#pgtabs button"),function(b){b.addEventListener("click",function(){showTab(b.getAttribute("data-k"))})});
$("pgoffcss").addEventListener("change",render);$("pgoffjs").addEventListener("change",render);
$("pgreset").addEventListener("click",function(){code={html:ORIGINAL.html,css:ORIGINAL.css,js:ORIGINAL.js};save();showTab(cur);render()});
var started=false;
function start(){if(started)return;started=true;showTab("html");render()}
if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();start()}},{rootMargin:"200px"});io.observe(box)}else start();
showTab("html");
})();
