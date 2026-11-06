(function(){
var IQD_RATE=1500; // approximate dollar rate in Iraqi dinar; keep equal to USD_IQD in the bot config
var P={
 i:{p:7,img:"i_cover",ar:"الزخارف الإسلامية (٤٠ تصميماً)",en:"Islamic Patterns (40 designs)"},
 k:{p:4,img:"k_cover",ar:"ألوان الطبيعة للأطفال (٢٠ مشهداً)",en:"Nature Coloring Book for Kids (20 scenes)"},
 m:{p:3,img:"mandala_cover",ar:"مندالا هندسية (١٠)",en:"Geometric Mandalas (10)",
    d_ar:"عشر مندالا دائرية، من البسيطة إلى الدقيقة، للتلوين الهادئ.",d_en:"Ten round mandalas, from simple to intricate, for calm coloring."},
 a:{p:3,img:"mosques_cover",ar:"مساجد وعمارة إسلامية (٨)",en:"Mosques and Architecture (8)",
    d_ar:"قباب ومآذن ومحراب وأقواس وفوانيس ونوافذ وبوابات.",d_en:"Domes, minarets, a mihrab, arches, lanterns, windows and gates."},
 f:{p:3,img:"floral_cover",ar:"زخارف نباتية (٦)",en:"Floral Ornaments (6)",
    d_ar:"أغصان وزهور وأكاليل وأوراق بتفاصيل ناعمة.",d_en:"Vines, flowers, garlands and leaves in soft detail."},
 s:{p:4,img:"stars_cover",ar:"نجوم وبلاطات هندسية (١٧)",en:"Stars and Tiles (17)",
    d_ar:"سبعة عشر نمطاً من البلاطات الإسلامية المتكررة.",d_en:"Seventeen repeating Islamic tile patterns."},
 p:{p:4,img:"planner_cover",ar:"مخطط الدراسة والامتحانات (١١ صفحة)",en:"Study and Exam Planner (11 pages)",
    d_ar:"جدول أسبوعي، عدّ تنازلي للامتحانات، متابعة المواد، سجل مذاكرة ودرجات. PDF للطباعة.",d_en:"Weekly timetable, exam countdown, subject tracker, study log and grades. Printable PDF."},
 c:{p:4,img:"cv_cover",ar:"قوالب السيرة الذاتية (٨ قوالب Word)",en:"Editable CV Templates (8 Word designs)",
    d_ar:"أربعة تصاميم بالعربية وأربعة بالإنجليزية. ملف Word قابل للتعديل (وليس PDF).",d_en:"Four designs in English and four in Arabic. Editable Word file (not a PDF)."},
 e:{p:4,img:"learn_cover",ar:"كتاب التعلّم الممتع للأطفال (٤٤ صفحة)",en:"Fun Learning Book for Kids (44 pages)",
    d_ar:"الحروف العربية الثمانية والعشرون، الأعداد، الأشكال، وتتبّع الخطوط وشهادة إنجاز.",d_en:"All 28 Arabic letters, numbers, shapes, line tracing and a certificate."},
 t:{p:3,img:"tracker_cover",ar:"متتبع الصلوات والعادات (٦ صفحات)",en:"Prayer and Habit Tracker (6 pages)",
    d_ar:"متابعة الصلوات، العادات، ختمة القرآن، عدّاد التسبيح وخطة أسبوعية.",d_en:"Prayer, habit and Quran khatma trackers, a dhikr counter and a weekly plan."}
};
var root=document.documentElement;
function iq(u){return (Math.round(u*IQD_RATE/250)*250).toLocaleString("en-US")}
function L(){return root.getAttribute("data-lang")==="en"?"en":"ar"}
function sp(a,e){return '<span data-l="ar">'+a+'</span><span data-l="en">'+e+'</span>'}
var g=document.getElementById("packs"), h="";
["m","a","f","s"].forEach(function(k){var x=P[k];
 h+='<article class="pk"><div class="book"><img class="cover" width="520" height="673" loading="lazy" alt="" src="assets/'+x.img+'.jpg?v=3"></div>'
  +'<h3>'+sp(x.ar,x.en)+'</h3><p>'+sp(x.d_ar,x.d_en)+'</p>'
  +'<div class="bar"><div class="price">$'+x.p+'</div><button type="button" data-pick="'+k+'">'+sp("أضف للطلب","Add to order")+'</button></div></article>'});
g.innerHTML=h;
var tg2=document.getElementById("tools"); h="";
["p","c","e","t"].forEach(function(k){var x=P[k];
 h+='<article class="pk"><div class="book"><img class="cover" width="520" height="673" loading="lazy" alt="" src="assets/'+x.img+'.jpg?v=1"></div>'
  +'<h3>'+sp(x.ar,x.en)+'</h3><p>'+sp(x.d_ar,x.d_en)+'</p>'
  +'<div class="bar"><div class="price">$'+x.p+'</div><button type="button" data-pick="'+k+'">'+sp("أضف للطلب","Add to order")+'</button></div></article>'});
tg2.innerHTML=h;
document.querySelectorAll(".price").forEach(function(p){
 var m=(p.firstChild&&p.firstChild.textContent||"").match(/\$(\d+)/); if(!m)return;
 var e=document.createElement("em"); e.className="iqd"; e.innerHTML='<span data-l="ar">≈ '+iq(+m[1])+' د.ع</span><span data-l="en">≈ '+iq(+m[1])+' IQD</span>';
 p.insertBefore(e,p.querySelector("small")||null)});
var list=document.getElementById("items"); h="";
["i","k","m","a","f","s","p","c","e","t"].forEach(function(k){
 h+='<label class="item"><input type="checkbox" value="'+k+'" id="c_'+k+'"><img alt="" loading="lazy" src="assets/'+P[k].img+'.jpg?v=3"><span class="n" data-name="'+k+'"></span><span class="p">$'+P[k].p+'</span></label>'});
list.innerHTML=h;
var boxes=[].slice.call(list.querySelectorAll("input")), msg=document.getElementById("msg"),
    totalEl=document.getElementById("total"), saveEl=document.getElementById("saving"), tg=document.getElementById("tg"), st=document.getElementById("state"),
    bar=document.getElementById("cartbar"), cartn=document.getElementById("cartn"), cartt=document.getElementById("cartt");
function sizeVal(){var r=document.querySelector('input[name="size"]:checked');return r?r.value:"A4"}
function calc(){
 var sel=boxes.filter(function(b){return b.checked}).map(function(b){return b.value});
 var sum=sel.reduce(function(a,k){return a+P[k].p},0), total=sum, deal="";
 var books=sel.indexOf("i")>-1&&sel.indexOf("k")>-1;
 var packs=["m","a","f","s"].every(function(k){return sel.indexOf(k)>-1});
 if(books){total-=2;deal+=(L()==="ar"?"خصم الدفترين":"Two-books deal")}
 if(packs){total-=2;deal+=(deal?" + ":"")+(L()==="ar"?"خصم الحزم الأربع":"Four-packs deal")}
 return {sel:sel,total:total,saved:sum-total,deal:deal};
}
function text(c){
 var l=L(), lines=c.sel.map(function(k){return "- "+P[k][l]+" ("+P[k].p+" USD)"}).join("\n");
 if(!c.sel.length) lines=l==="ar"?"(اختر دفتراً من القائمة)":"(pick a book from the list)";
 return l==="ar"
  ?"السلام عليكم، أريد شراء نسخ PDF إلكترونية:\n"+lines+"\nالحجم: "+sizeVal()+"\nالمجموع: "+c.total+" USD\nأعلم أنها ملفات رقمية فقط بدون طباعة أو شحن."
  :"Hello, I'd like to buy these PDF copies:\n"+lines+"\nSize: "+sizeVal()+"\nTotal: "+c.total+" USD\nI understand these are digital files only, with no printing or shipping.";
}
function refresh(){
 var c=calc(), t=text(c);
 totalEl.textContent="$"+c.total; var ti=document.getElementById("totaliqd"); ti.textContent=c.total?("≈ "+iq(c.total)+(L()==="ar"?" دينار عراقي":" IQD")):""; msg.textContent=t;
 saveEl.textContent=c.saved?((L()==="ar"?"وفّرت ":"You save ")+"⁦$"+c.saved+"⁩ — "+c.deal):"";
 var sk=sizeVal()==="A4 + Letter"?"both":sizeVal(); tg.href="https://t.me/SmartZaki_Bot?start="+(c.sel.length?"o_"+c.sel.join("-")+"_"+sk:"web");
 [].forEach.call(document.querySelectorAll("[data-name]"),function(n){n.textContent=P[n.getAttribute("data-name")][L()]});
 bar.classList.toggle("on",c.sel.length>0);
 cartn.textContent=c.sel.length+(L()==="ar"?" في الطلب":" in order"); cartt.textContent="$"+c.total;
}
function go(){document.getElementById("order").scrollIntoView({behavior:"smooth"})}
[].forEach.call(document.querySelectorAll("[data-pick]"),function(b){b.addEventListener("click",function(){
 var k=b.getAttribute("data-pick");
 if(k==="b"){document.getElementById("c_i").checked=true;document.getElementById("c_k").checked=true}
 else document.getElementById("c_"+k).checked=true;
 refresh();go()})});
boxes.forEach(function(b){b.addEventListener("change",refresh)});
[].forEach.call(document.querySelectorAll('input[name="size"]'),function(r){r.addEventListener("change",refresh)});
document.getElementById("copy").addEventListener("click",function(){
 var t=text(calc());
 function ok(){st.textContent=L()==="ar"?"تم النسخ. ألصقها في محادثة تيليجرام.":"Copied. Paste it into the Telegram chat."}
 function fb(){var r=document.createRange();r.selectNodeContents(msg);var s=getSelection();s.removeAllRanges();s.addRange(r);st.textContent=L()==="ar"?"حدد النص أعلاه وانسخه.":"Select the text above and copy it."}
 try{navigator.clipboard.writeText(t).then(ok,fb)}catch(e){fb()}
});
// lightbox
var lb=document.getElementById("lb"), lbi=document.getElementById("lbi");
document.addEventListener("click",function(e){
 var z=e.target.closest&&e.target.closest("button.z");
 if(z){lbi.src=z.getAttribute("data-big");lb.classList.add("on");return}
 if(e.target===lb||e.target.id==="lbx"){lb.classList.remove("on")}
});
document.addEventListener("keydown",function(e){if(e.key==="Escape")lb.classList.remove("on")});
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
