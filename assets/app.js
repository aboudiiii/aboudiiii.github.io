(function(){
var TELEGRAM_USER="Aboudi_Dev26";
var P={
 i:{p:7,ar:"الزخارف الإسلامية (٤٠ تصميماً)",en:"Islamic Patterns (40 designs)"},
 k:{p:4,ar:"ألوان الطبيعة للأطفال (٢٠ مشهداً)",en:"Nature Coloring Book for Kids (20 scenes)"},
 m:{p:3,ar:"مندالا هندسية (١٠)",en:"Geometric Mandalas (10)",img:"mandala",t:"mandala",
    d_ar:"عشر مندالا دائرية، من البسيطة إلى الدقيقة، للتلوين الهادئ.",d_en:"Ten round mandalas, from simple to intricate, for calm coloring."},
 a:{p:3,ar:"مساجد وعمارة إسلامية (٨)",en:"Mosques and Architecture (8)",img:"mosques",t:"mosques",
    d_ar:"قباب ومآذن ومحراب وأقواس وفوانيس ونوافذ وبوابات.",d_en:"Domes, minarets, a mihrab, arches, lanterns, windows and gates."},
 f:{p:3,ar:"زخارف نباتية (٦)",en:"Floral Ornaments (6)",img:"floral",t:"floral",
    d_ar:"أغصان وزهور وأكاليل وأوراق بتفاصيل ناعمة.",d_en:"Vines, flowers, garlands and leaves in soft detail."},
 s:{p:4,ar:"نجوم وبلاطات هندسية (١٧)",en:"Stars and Tiles (17)",img:"stars",t:"stars",
    d_ar:"سبعة عشر نمطاً من البلاطات الإسلامية المتكررة.",d_en:"Seventeen repeating Islamic tile patterns."}
};
var root=document.documentElement;
function L(){return root.getAttribute("data-lang")==="en"?"en":"ar"}
function sp(a,e){return '<span data-l="ar">'+a+'</span><span data-l="en">'+e+'</span>'}
// packs grid
var g=document.getElementById("packs"), h="";
["m","a","f","s"].forEach(function(k){var x=P[k];
 h+='<article class="pk"><img class="cover" loading="lazy" alt="" src="assets/'+x.img+'_cover.jpg">'
  +'<h3>'+sp(x.ar,x.en)+'</h3><p>'+sp(x.d_ar,x.d_en)+'</p>'
  +'<div class="thumbs three"><img loading="lazy" alt="" src="assets/'+x.img+'_1.jpg"><img loading="lazy" alt="" src="assets/'+x.img+'_2.jpg"><img loading="lazy" alt="" src="assets/'+x.img+'_3.jpg"></div>'
  +'<div class="bar"><div class="price">$'+x.p+'</div><button type="button" data-pick="'+k+'">'+sp("أضف للطلب","Add to order")+'</button></div></article>'});
g.innerHTML=h;
// order builder
var list=document.getElementById("items"); h="";
["i","k","m","a","f","s"].forEach(function(k){
 h+='<label class="item"><input type="checkbox" value="'+k+'" id="c_'+k+'"><span class="n" data-name="'+k+'"></span><span class="p">$'+P[k].p+'</span></label>'});
list.innerHTML=h;
var boxes=[].slice.call(list.querySelectorAll("input")), msg=document.getElementById("msg"),
    totalEl=document.getElementById("total"), saveEl=document.getElementById("saving"), tg=document.getElementById("tg"), st=document.getElementById("state");
function sizeVal(){var r=document.querySelector('input[name="size"]:checked');return r?r.value:"A4"}
function calc(){
 var sel=boxes.filter(function(b){return b.checked}).map(function(b){return b.value});
 var sum=sel.reduce(function(a,k){return a+P[k].p},0), total=sum, deal="";
 var books=sel.indexOf("i")>-1&&sel.indexOf("k")>-1;
 var packs=["m","a","f","s"].every(function(k){return sel.indexOf(k)>-1});
 if(books){total-=2;deal+=(deal?" + ":"")+(L()==="ar"?"خصم الدفترين":"Two-books deal")}
 if(packs){total-=2;deal+=(deal?" + ":"")+(L()==="ar"?"خصم الحزم الأربع":"Four-packs deal")}
 return {sel:sel,total:total,saved:sum-total,deal:deal};
}
function text(c){
 var l=L(), lines=c.sel.map(function(k){return "- "+P[k][l]+" ($"+P[k].p+")"}).join("\n");
 if(!c.sel.length) lines=l==="ar"?"(اختر دفتراً من القائمة)":"(pick a book from the list)";
 return l==="ar"
  ?"السلام عليكم، أريد شراء نسخ PDF إلكترونية:\n"+lines+"\nالحجم: "+sizeVal()+"\nالمجموع: $"+c.total+"\nأعلم أنها ملفات رقمية فقط بدون طباعة أو شحن."
  :"Hello, I'd like to buy these PDF copies:\n"+lines+"\nSize: "+sizeVal()+"\nTotal: $"+c.total+"\nI understand these are digital files only, with no printing or shipping.";
}
function refresh(){
 var c=calc(), t=text(c);
 totalEl.textContent="$"+c.total; msg.textContent=t;
 saveEl.textContent=c.saved?((L()==="ar"?"وفّرت ":"You save ")+"\u2066$"+c.saved+"\u2069 — "+c.deal):"";
 tg.href="https://t.me/"+TELEGRAM_USER+"?text="+encodeURIComponent(t);
 [].forEach.call(document.querySelectorAll("[data-name]"),function(n){n.textContent=P[n.getAttribute("data-name")][L()]});
}
function pick(k){var b=document.getElementById("c_"+k); b.checked=true; refresh(); document.getElementById("order").scrollIntoView({behavior:"smooth"})}
[].forEach.call(document.querySelectorAll("[data-pick]"),function(b){b.addEventListener("click",function(){
 var k=b.getAttribute("data-pick");
 if(k==="b"){document.getElementById("c_i").checked=true;document.getElementById("c_k").checked=true;refresh();document.getElementById("order").scrollIntoView({behavior:"smooth"})} else pick(k)})});
boxes.forEach(function(b){b.addEventListener("change",refresh)});
[].forEach.call(document.querySelectorAll('input[name="size"]'),function(r){r.addEventListener("change",refresh)});
document.getElementById("copy").addEventListener("click",function(){
 var c=calc(), t=text(c);
 function ok(){st.textContent=L()==="ar"?"تم النسخ. ألصقها في محادثة تيليجرام.":"Copied. Paste it into the Telegram chat."}
 function fb(){var r=document.createRange();r.selectNodeContents(msg);var s=getSelection();s.removeAllRanges();s.addRange(r);st.textContent=L()==="ar"?"حدد النص أعلاه وانسخه.":"Select the text above and copy it."}
 try{navigator.clipboard.writeText(t).then(ok,fb)}catch(e){fb()}
});
function setLang(l){
 root.setAttribute("data-lang",l); root.lang=l; root.dir=l==="ar"?"rtl":"ltr";
 document.getElementById("lang").textContent=l==="ar"?"English":"العربية";
 try{localStorage.setItem("lang",l)}catch(e){}
 refresh();
}
document.getElementById("lang").addEventListener("click",function(){setLang(L()==="ar"?"en":"ar")});
var saved="ar"; try{saved=localStorage.getItem("lang")||"ar"}catch(e){}
setLang(saved==="en"?"en":"ar");
})();
