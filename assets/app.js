(function(){
var IQD_RATE=1500; // approximate dollar rate in Iraqi dinar; keep equal to USD_IQD in the bot config
var P={
 y:{p:3.33,img:"python_cover",ar:"تعلّم بايثون من الصفر (٥٣ صفحة)",en:"Learn Python from Scratch (53 pages)",
    d_ar:"كتاب شرح مفصّل لتعلّم بايثون للمبتدئين بلهجة بسيطة: تثبيت وأول برنامج، ثم الأساسيات خطوة خطوة بأمثلة وتمارين. نسخة PDF بحجم A4 للقراءة على الجوال والحاسوب أو الطباعة.",d_en:"A detailed book for beginners to learn Python in a simple, friendly style: setup and your first program, then the fundamentals step by step with examples and exercises. An A4 PDF for phone, computer or print.",
    inc_ar:["٥٣ صفحة بغلاف ملوّن", "شرح من التثبيت وأول برنامج حتى المواضيع المتقدمة", "أمثلة كاملة وتمارين بنهاية الفصول", "ملف واحد بحجم A4 يُقرأ على الجوال أو يُطبع"],inc_en:["53 pages with a color cover", "From setup and your first program to advanced topics", "Complete examples and exercises at chapter ends", "One A4 file to read on your phone or print"]},
 j:{p:3.33,img:"java_cover",ar:"تعلّم Java من الصفر (٦٢ صفحة)",en:"Learn Java from Scratch (62 pages)",
    d_ar:"كتاب شرح مفصّل لتعلّم Java للمبتدئين بلهجة بسيطة: تثبيت وأول برنامج، ثم الأساسيات خطوة خطوة بأمثلة وتمارين. نسخة PDF بحجم A4 للقراءة على الجوال والحاسوب أو الطباعة.",d_en:"A detailed book for beginners to learn Java in a simple, friendly style: setup and your first program, then the fundamentals step by step with examples and exercises. An A4 PDF for phone, computer or print.",
    inc_ar:["٦٢ صفحة بغلاف ملوّن", "شرح من التثبيت وأول برنامج حتى المواضيع المتقدمة", "أمثلة كاملة وتمارين بنهاية الفصول", "ملف واحد بحجم A4 يُقرأ على الجوال أو يُطبع"],inc_en:["62 pages with a color cover", "From setup and your first program to advanced topics", "Complete examples and exercises at chapter ends", "One A4 file to read on your phone or print"]},
 v:{p:3.33,img:"js_cover",ar:"تعلّم JavaScript من الصفر (٤٧ صفحة)",en:"Learn JavaScript from Scratch (47 pages)",
    d_ar:"كتاب شرح مفصّل لتعلّم JavaScript للمبتدئين بلهجة بسيطة: تثبيت وأول برنامج، ثم الأساسيات خطوة خطوة بأمثلة وتمارين. نسخة PDF بحجم A4 للقراءة على الجوال والحاسوب أو الطباعة.",d_en:"A detailed book for beginners to learn JavaScript in a simple, friendly style: setup and your first program, then the fundamentals step by step with examples and exercises. An A4 PDF for phone, computer or print.",
    inc_ar:["٤٧ صفحة بغلاف ملوّن", "شرح من التثبيت وأول برنامج حتى المواضيع المتقدمة", "أمثلة كاملة وتمارين بنهاية الفصول", "ملف واحد بحجم A4 يُقرأ على الجوال أو يُطبع"],inc_en:["47 pages with a color cover", "From setup and your first program to advanced topics", "Complete examples and exercises at chapter ends", "One A4 file to read on your phone or print"]},
 x:{p:3.33,img:"cpp_cover",ar:"تعلّم C++ من الصفر (٩٣ صفحة)",en:"Learn C++ from Scratch (93 pages)",
    d_ar:"كتاب شرح مفصّل لتعلّم C++ للمبتدئين بلهجة بسيطة: تثبيت وأول برنامج، ثم الأساسيات خطوة خطوة بأمثلة وتمارين. نسخة PDF بحجم A4 للقراءة على الجوال والحاسوب أو الطباعة.",d_en:"A detailed book for beginners to learn C++ in a simple, friendly style: setup and your first program, then the fundamentals step by step with examples and exercises. An A4 PDF for phone, computer or print.",
    inc_ar:["٩٣ صفحة بغلاف ملوّن", "شرح من التثبيت وأول برنامج حتى المواضيع المتقدمة", "أمثلة كاملة وتمارين بنهاية الفصول", "ملف واحد بحجم A4 يُقرأ على الجوال أو يُطبع"],inc_en:["93 pages with a color cover", "From setup and your first program to advanced topics", "Complete examples and exercises at chapter ends", "One A4 file to read on your phone or print"]},
 r:{p:6.67,img:"mirrors_cover",ar:"المرايا الثلاث (رواية، ١٦ فصلاً)",en:"The Three Mirrors (novel, 16 chapters)",
    d_ar:"رواية نفسية غامضة: رهام مرمّمة مرايا ترث بيتًا مغلقًا بشرط غريب: أربعون يومًا لترميم ثلاث مرايا، وكل مرآة تكشف طبقة من ماضٍ دُفن. نسخة PDF بحجم كتاب للقراءة على الجوال أو الطباعة.",d_en:"A psychological mystery: Riham, a mirror restorer, inherits a sealed house on one strange condition: forty days to restore three mirrors, each revealing a layer of a buried past. A book-size PDF for reading on your phone or printing.",
    inc_ar:["١٦ فصلاً (١٠٩ صفحات)","غلاف ملوّن وفهرس للفصول","ملف واحد بحجم كتاب A5 يناسب الجوال والطباعة","عيّنة مجانية: الفصلان الأولان"],inc_en:["16 chapters (109 pages)","Color cover and a chapter index","One book-size A5 file for phone or print","Free sample: the first two chapters"]},
 n:{p:6.67,img:"novel_cover",ar:"مدينة الأصداء (رواية، ١٦ فصلاً)",en:"Echo City (novel, 16 chapters)",
    d_ar:"رواية خيالية: سدرة منظّفة أصداء تنصت إلى جدران مدينة رنين وتكتشف سرّ أمها. نسخة PDF بحجم كتاب للقراءة على الجوال أو الطباعة.",d_en:"A fantasy novel: Sidra, an echo cleaner, listens to the walls of the city of Rannin and uncovers her mother's secret. A book-size PDF for reading on your phone or printing.",
    inc_ar:["١٦ فصلاً (حوالي ١٢٠ صفحة)","غلاف ملوّن وفهرس للفصول","ملف واحد بحجم كتاب A5 يناسب الجوال والطباعة","عيّنة مجانية: الفصلان الأولان"],inc_en:["16 chapters (about 120 pages)","Color cover and a chapter index","One book-size A5 file for phone or print","Free sample: the first two chapters"]},
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
    d_ar:"جدول أسبوعي، عدّ تنازلي للامتحانات، متابعة المواد، سجل مذاكرة ودرجات. PDF للطباعة.",d_en:"Weekly timetable, exam countdown, subject tracker, study log and grades. Printable PDF.",
    inc_ar:["جدول أسبوعي بالساعات (٨ صباحاً إلى ٧ مساءً)", "جدول الامتحانات مع عدّ تنازلي ٣٠ يوماً", "أهداف الفصل وجدول المواد", "مخطط الأسبوع وأولوياته", "متابعة مادة بخمسة عشر فصلاً (قراءة، تلخيص، حل أسئلة، مراجعة)", "سجل مذاكرة يومي بجلسات تركيز", "مراجعة الأسبوع بمخطط ساعات", "جدول المراجعة المتباعدة (يوم ٣ و٧ و١٤ و٣٠)", "متابعة الدرجات والمعدل", "صفحة ملاحظات وشبكة نقطية"],inc_en:["Weekly timetable by the hour (8 AM to 7 PM)", "Exam schedule with a 30-day countdown", "Semester goals and subject list", "Weekly planner with priorities", "Subject tracker with 15 chapters (read, summarize, practice, review)", "Daily study log with focus sessions", "Weekly review with an hours chart", "Spaced revision schedule (day 3, 7, 14, 30)", "Grades and GPA tracker", "A notes page and a dot grid"]},
 c:{p:4,img:"cv_cover",ar:"قوالب السيرة الذاتية (٨ قوالب Word)",en:"Editable CV Templates (8 Word designs)",
    d_ar:"أربعة تصاميم بالعربية وأربعة بالإنجليزية. ملف Word قابل للتعديل (وليس PDF).",d_en:"Four designs in English and four in Arabic. Editable Word file (not a PDF).",
    inc_ar:["ثمانية قوالب: أربعة تصاميم (كلاسيكي، عصري بشريط جانبي، بسيط، ترويسة ذهبية)", "كل تصميم بنسخة عربية (من اليمين لليسار) وأخرى إنجليزية", "صفحة تعليمات قصيرة لاستخدام القوالب", "ملف Word واحد بحجم A4 وآخر بحجم Letter"],inc_en:["Eight templates: four designs (Classic, Modern with a sidebar, Minimal, Gold header)", "Every design in Arabic (right to left) and in English", "A short instruction page", "One Word file in A4 and another in US Letter"]},
 e:{p:4,img:"learn_cover",ar:"كتاب التعلّم الممتع للأطفال (٤٤ صفحة)",en:"Fun Learning Book for Kids (44 pages)",
    d_ar:"الحروف العربية الثمانية والعشرون، الأعداد، الأشكال، وتتبّع الخطوط وشهادة إنجاز.",d_en:"All 28 Arabic letters, numbers, shapes, line tracing and a certificate.",
    inc_ar:["الحروف العربية الثمانية والعشرون، لكل حرف صفحة: أشكاله الأربعة، تتبّع الخط، وكلمة مع صورتها", "الأعداد من ١ إلى ١٠ مع العدّ والكتابة", "ثمانية أشكال هندسية للتتبّع والرسم", "صفحتان لخطوط التحضير للكتابة", "لوّن حسب الاسم، وعدّ واكتب (صفحتان)", "شهادة إنجاز وصفحة تعليمات للأهل"],inc_en:["All 28 Arabic letters, one page each: four forms, line tracing and an example word with a picture", "Numbers 1 to 10 with counting and writing", "Eight geometric shapes to trace and draw", "Two pre-writing line pages", "Color by name, and count and write (two pages)", "A certificate and a short guide for parents"]},
 t:{p:3,img:"tracker_cover",ar:"متتبع الصلوات والعادات (٦ صفحات)",en:"Prayer and Habit Tracker (6 pages)",
    d_ar:"متابعة الصلوات، العادات، ختمة القرآن، عدّاد التسبيح وخطة أسبوعية.",d_en:"Prayer, habit and Quran khatma trackers, a dhikr counter and a weekly plan.",
    inc_ar:["متابعة الصلوات الشهرية: الخمس مع الوتر والضحى والأذكار والقرآن", "متابعة العادات: اثنتا عشرة عادة على مدى ٣١ يوماً", "متابعة ختمة القرآن: الأجزاء الثلاثون بثمانية أرباع لكل جزء", "عدّاد التسبيح: ٣٣ لكل ذكر", "خطة أسبوعية للعبادة والأعمال الصالحة", "صفحة يومية للصلاة والمهام والعادات والشكر"],inc_en:["Monthly prayer tracker: the five prayers plus Witr, Duha, Adhkar and Quran", "Habit tracker: twelve habits across 31 days", "Quran khatma tracker: 30 juz with 8 quarters each", "Dhikr counter: 33 for each phrase", "A weekly plan for worship and good deeds", "A daily page for prayer, tasks, habits and gratitude"]}
};

var X={
 i:{cat:["color"],d_ar:"دفتر تلوين للكبار: ٤٠ تصميماً مفصلاً من النجوم والمندالا الهندسية والمساجد والقباب والمآذن والفوانيس والزخارف النباتية.",d_en:"A coloring book for adults: 40 detailed designs of geometric stars and mandalas, mosques, domes, minarets, lanterns and floral ornament.",
  inc_ar:["٤٢ صفحة بغلاف ملوّن وصفحة ترخيص","خطوط واضحة للأقلام الملونة والفلوماستر","من التصاميم السهلة إلى الدقيقة جداً","حجما A4 وLetter"],inc_en:["42 pages with a color cover and a license page","Clean line work for pencils and markers","From easy designs to very intricate ones","Both A4 and Letter sizes"],
  th:["i1","i2","i3","i4"],big:["big_i1","big_i2","big_i3","big_i4"],tag_ar:"للكبار",tag_en:"Adults",pair:"k"},
 k:{cat:["color","kids"],d_ar:"٢٠ مشهداً طبيعياً بسيطاً بخطوط عريضة: تلال وجبال وبحر وصحراء وقوس قزح وغابة.",d_en:"20 simple nature scenes with thick lines: hills, mountains, sea, desert, rainbow and forest.",
  inc_ar:["٢٢ صفحة بغلاف ملوّن وصفحة ترخيص","خطوط سميكة تناسب أيدي الأطفال الصغيرة","مشاهد هادئة تنمّي التركيز والإبداع","حجما A4 وLetter"],inc_en:["22 pages with a color cover and a license page","Thick lines made for little hands","Calm scenes that build focus and creativity","Both A4 and Letter sizes"],
  th:["k1","k2","k3","k4"],big:["big_k1","big_k2","big_k3","big_k4"],tag_ar:"للأطفال",tag_en:"Kids",pair:"i"},
 m:{cat:["color"],inc_ar:["١٠ مندالا دائرية","من البسيط إلى الدقيق","حجما A4 وLetter"],inc_en:["10 round mandalas","From simple to intricate","Both A4 and Letter sizes"],th:["mandala_1","mandala_2","mandala_3"],tag_ar:"حزمة",tag_en:"Pack",packs:1},
 a:{cat:["color"],inc_ar:["٨ تصاميم: قباب ومآذن ومحراب","أقواس وفوانيس ونوافذ وبوابات","حجما A4 وLetter"],inc_en:["8 designs: domes, minarets and a mihrab","Arches, lanterns, windows and gates","Both A4 and Letter sizes"],th:["mosques_1","mosques_2","mosques_3"],tag_ar:"حزمة",tag_en:"Pack",packs:1},
 f:{cat:["color"],inc_ar:["٦ تصاميم نباتية","أغصان وزهور وأكاليل وأوراق","حجما A4 وLetter"],inc_en:["6 floral designs","Vines, flowers, garlands and leaves","Both A4 and Letter sizes"],th:["floral_1","floral_2","floral_3"],tag_ar:"حزمة",tag_en:"Pack",packs:1},
 s:{cat:["color"],inc_ar:["١٧ نمطاً من البلاطات المتكررة","نجوم هندسية بأحجام متدرجة","حجما A4 وLetter"],inc_en:["17 repeating tile patterns","Geometric stars in graded sizes","Both A4 and Letter sizes"],th:["stars_1","stars_2","stars_3"],tag_ar:"حزمة",tag_en:"Pack",packs:1},
 n:{cat:["novel"],tag_ar:"رواية",tag_en:"Novel"},
 r:{cat:["novel"],tag_ar:"رواية",tag_en:"Novel"},
 p:{cat:["study"],tag_ar:"دراسة",tag_en:"Study"},
 c:{cat:["work"],tag_ar:"عمل",tag_en:"Work"},
 e:{cat:["kids"],tag_ar:"للأطفال",tag_en:"Kids"},
 t:{cat:["faith"],tag_ar:"إيمان وعادات",tag_en:"Faith and habits"},
 y:{cat:["code"],tag_ar:"برمجة",tag_en:"Code",th:["y1","y2","y3"],big:["big_y1","big_y2","big_y3"]},
 j:{cat:["code"],tag_ar:"برمجة",tag_en:"Code",th:["j1","j2","j3"],big:["big_j1","big_j2","big_j3"]},
 v:{cat:["code"],tag_ar:"برمجة",tag_en:"Code",th:["v1","v2","v3"],big:["big_v1","big_v2","big_v3"]},
 x:{cat:["code"],tag_ar:"برمجة",tag_en:"Code",th:["x1","x2","x3"],big:["big_x1","big_x2","big_x3"]}
};
Object.keys(X).forEach(function(k){for(var f in X[k]){if(P[k][f]===undefined)P[k][f]=X[k][f]}});
var root=document.documentElement;
function iq(u){return (Math.round(u*IQD_RATE/250)*250).toLocaleString("en-US")}
function L(){return root.getAttribute("data-lang")==="en"?"en":"ar"}
function sp(a,e){return '<span data-l="ar">'+a+'</span><span data-l="en">'+e+'</span>'}
var h="";
var list=document.getElementById("items"); h="";
["n","r","i","k","m","a","f","s","p","c","e","t","y","j","v","x"].forEach(function(k){
 h+='<label class="item"><input type="checkbox" value="'+k+'" id="c_'+k+'"><img alt="" loading="lazy" src="assets/'+P[k].img+'.jpg?v=4"><span class="n" data-name="'+k+'"></span><span class="p">$'+P[k].p+'</span></label>'});
list.innerHTML=h;
var boxes=[].slice.call(list.querySelectorAll("input")), msg=document.getElementById("msg"),
    totalEl=document.getElementById("total"), saveEl=document.getElementById("saving"), tg=document.getElementById("tg"), st=document.getElementById("state"),
    bar=document.getElementById("cartbar"), cartn=document.getElementById("cartn"), cartt=document.getElementById("cartt");
function sizeVal(){var r=document.querySelector('input[name="size"]:checked');return r?r.value:"A4"}
function calc(){
 var sel=boxes.filter(function(b){return b.checked}).map(function(b){return b.value});
 var sum=Math.round(sel.reduce(function(a,k){return a+P[k].p},0)*100)/100, total=sum, deal="";
 var books=sel.indexOf("i")>-1&&sel.indexOf("k")>-1;
 var packs=["m","a","f","s"].every(function(k){return sel.indexOf(k)>-1});
 if(books){total-=2;deal+=(L()==="ar"?"خصم الدفترين":"Two-books deal")}
 if(packs){total-=2;deal+=(deal?" + ":"")+(L()==="ar"?"خصم الحزم الأربع":"Four-packs deal")}
 total=Math.round(total*100)/100; return {sel:sel,total:total,saved:Math.round((sum-total)*100)/100,deal:deal};
}
function text(c){
 var l=L(), onlyN=c.sel.length>0&&c.sel.every(function(k){return "nryjvx".indexOf(k)>-1}), szAr=onlyN?"":"\nالحجم: "+sizeVal(), szEn=onlyN?"":"\nSize: "+sizeVal(), lines=c.sel.map(function(k){return "- "+P[k][l]+" ("+P[k].p+" USD)"}).join("\n");
 if(!c.sel.length) lines=l==="ar"?"(اختر دفتراً من القائمة)":"(pick a book from the list)";
 return l==="ar"
  ?"السلام عليكم، أريد شراء نسخ PDF إلكترونية:\n"+lines+szAr+"\nالمجموع: "+c.total+" USD\nأعلم أنها ملفات رقمية فقط بدون طباعة أو شحن."
  :"Hello, I'd like to buy these PDF copies:\n"+lines+szEn+"\nTotal: "+c.total+" USD\nI understand these are digital files only, with no printing or shipping.";
}
function refresh(){
 var c=calc(), t=text(c);
 totalEl.textContent="$"+c.total; var ti=document.getElementById("totaliqd"); ti.textContent=c.total?("≈ "+iq(c.total)+(L()==="ar"?" دينار عراقي":" IQD")):""; msg.textContent=t;
 saveEl.textContent=c.saved?((L()==="ar"?"وفّرت ":"You save ")+"⁦$"+c.saved+"⁩ — "+c.deal):"";
 var sk=sizeVal()==="A4 + Letter"?"both":sizeVal(); tg.href="https://t.me/SmartZaki_Bot?start="+(c.sel.length?"o_"+c.sel.join("-")+"_"+sk:"web");
 [].forEach.call(document.querySelectorAll("[data-name]"),function(n){n.textContent=P[n.getAttribute("data-name")][L()]});
 bar.classList.toggle("on",c.sel.length>0);
 cartn.textContent=c.sel.length+(L()==="ar"?" في الطلب":" in order"); cartt.textContent="$"+c.total;
 renderCart(c); syncShop(c);
}
function go(){var any=document.querySelector("#items input:checked"),b=document.getElementById("tg");
 if(any&&b){b.scrollIntoView({behavior:"smooth",block:"center"});b.classList.remove("pulse");void b.offsetWidth;b.classList.add("pulse");setTimeout(function(){b.classList.remove("pulse")},2600)}
 else document.getElementById("order").scrollIntoView({behavior:"smooth"})}
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

/* ---------- collection explorer ---------- */
var SLUG={"n": "echo-city-novel", "r": "three-mirrors-novel", "i": "islamic-patterns-coloring-book", "k": "nature-colors-kids-coloring-book", "m": "geometric-mandala-coloring-book", "a": "mosques-islamic-architecture-coloring-book", "f": "floral-patterns-coloring-book", "s": "geometric-stars-tiles-coloring-book", "p": "study-and-exam-planner", "c": "cv-templates-word", "e": "kids-fun-learning-book", "t": "prayer-and-habit-tracker", "y": "learn-python-arabic-book", "j": "learn-java-arabic-book", "v": "learn-javascript-arabic-book", "x": "learn-cpp-arabic-book"};
var ORDER=["n","r","i","k","m","a","f","s","p","c","e","t","y","j","v","x"], CATS=[["all","الكل","All"],["novel","رواية","Novel"],["color","كتب تلوين","Coloring"],["kids","للأطفال","Kids"],["study","دراسة","Study"],["work","عمل","Work"],["faith","إيمان","Faith"],["code","برمجة","Code"],["saved","♥ المحفوظة","♥ Saved"]];
var curK="p", curCat="all", curQ="", RV=[], SAVED=[];
try{var _s=JSON.parse(localStorage.getItem("saved")||"[]");if(Array.isArray(_s))SAVED=_s.filter(function(k){return typeof k==="string"&&P[k]})}catch(e){}
function persistSaved(){try{localStorage.setItem("saved",JSON.stringify(SAVED))}catch(e){}}
function isSaved(k){return SAVED.indexOf(k)>-1}
function inCat(k){return curCat==="all"||(curCat==="saved"?isSaved(k):P[k].cat.indexOf(curCat)>-1)}
function inQ(k){if(!curQ)return true;var x=P[k],h=(x.ar+" "+x.en+" "+x.tag_ar+" "+x.tag_en+" "+x.d_ar+" "+x.d_en).toLowerCase();return curQ.toLowerCase().split(/\s+/).every(function(w){return h.indexOf(w)>-1})}

var chipsEl=document.getElementById("chips"), slist=document.getElementById("slist"), sdet=document.getElementById("sdetail");
function isOn(k){var b=document.getElementById("c_"+k);return !!(b&&b.checked)}
function setOn(k,v){var b=document.getElementById("c_"+k);if(b&&b.checked!==v){b.checked=v;b.dispatchEvent(new Event("change",{bubbles:true}))}}
function toast(a,e){var t=document.getElementById("toast");t.innerHTML=sp(a,e);t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove("on")},2200)}
function renderChips(){
 chipsEl.innerHTML=CATS.map(function(c){var n=c[0]==="saved"&&SAVED.length?' ('+SAVED.length+')':'';return '<button type="button" data-cat="'+c[0]+'" aria-pressed="'+(c[0]===curCat)+'">'+sp(c[1]+n,c[2]+n)+'</button>'}).join("");
}
function renderList(){
 var keys=ORDER.filter(function(k){return inCat(k)&&inQ(k)});
 if(keys.indexOf(curK)<0&&keys.length)curK=keys[0];
 var cnt=document.getElementById("qcount");if(cnt)cnt.innerHTML=curQ||curCat!=="all"?sp(keys.length+" نتيجة",keys.length+(keys.length===1?" result":" results")):"";
 if(!keys.length){slist.innerHTML='<p class="empty">'+(curCat==="saved"&&!curQ?sp("لم تحفظ أي منتج بعد. اضغط ♡ في صفحة المنتج لحفظه.","Nothing saved yet. Tap ♡ on a product to save it."):sp("لا توجد نتائج. جرّب كلمة أخرى.","No results. Try another word."))+'</p>';return}
 slist.innerHTML=keys.map(function(k){var x=P[k];
  return '<button type="button" class="srow'+(isOn(k)?' has':'')+'" role="option" data-k="'+k+'" aria-selected="'+(k===curK)+'"><img alt="" loading="lazy" src="assets/'+x.img+'.jpg?v=4"><span class="nm">'+sp(x.ar,x.en)+'</span><span class="pr">$'+x.p+'</span><span class="in" aria-hidden="true">✓</span></button>'}).join("")
  +(curCat==="saved"&&keys.length?'<button type="button" class="sec2 addsaved" data-addsaved="1">'+sp("أضف كل المحفوظات إلى الطلب","Add all saved to my order")+'</button>':"");
}
function dealHtml(k){
 var x=P[k];
 if(x.pair) return '<div class="dealnote"><span>'+sp("الدفتران معاً <bdi dir=\"ltr\">$9</bdi> بدل <bdi dir=\"ltr\">$11</bdi>","Both books <bdi>$9</bdi> instead of <bdi>$11</bdi>")+'</span><button type="button" class="sec2" data-addboth="i,k">'+sp("أضف الدفترين","Add both")+'</button></div>';
 if(x.packs) return '<div class="dealnote"><span>'+sp("الحزم الأربع معاً <bdi dir=\"ltr\">$10</bdi> بدل <bdi dir=\"ltr\">$12</bdi>","All four packs <bdi>$10</bdi> instead of <bdi>$12</bdi>")+'</span><button type="button" class="sec2" data-addboth="m,a,f,s">'+sp("أضف الحزم الأربع","Add all four")+'</button></div>';
 return "";
}
function renderDetail(anim){
 var k=curK,x=P[k],on=isOn(k),th="";
 if(x.th){th='<div class="thumbs'+(x.th.length===3?' three':'')+'">'+x.th.map(function(t,i){var big=x.big?x.big[i]:t;return '<button class="z" type="button" data-big="assets/'+big+'.jpg" aria-label="preview '+(i+1)+'"><img alt="" loading="lazy" src="assets/'+t+'.jpg"></button>'}).join("")+'<p class="hint">'+sp("اضغط على أي صفحة لتكبيرها","Tap a page to enlarge")+'</p></div>'}
 var iqd='<em class="iqd">'+sp("≈ "+iq(x.p)+" د.ع","≈ "+iq(x.p)+" IQD")+'</em>';
 sdet.innerHTML='<div><div class="book"><img class="cover" width="520" height="673" alt="" src="assets/'+x.img+'.jpg?v=4"></div></div>'
  +'<div><span class="tag i">'+sp(x.tag_ar,x.tag_en)+'</span><h3>'+sp(x.ar,x.en)+'</h3>'+rvLine(k)+'<p class="desc">'+sp(x.d_ar,x.d_en)+'</p>'
  +'<ul class="chk">'+x.inc_ar.map(function(t,i){return '<li>'+sp(t,x.inc_en[i])+'</li>'}).join("")+'</ul>'
  +'<div class="buy"><div class="price">$'+x.p+iqd+'</div></div>'
  +'<div class="sact"><button type="button" class="add'+(on?' on':'')+'" data-add="'+k+'">'+(on?sp("✓ في طلبك (إزالة)","✓ In your order (remove)"):sp("أضف للطلب","Add to order"))+'</button><button type="button" class="share" data-save="'+k+'" aria-pressed="'+isSaved(k)+'">'+(isSaved(k)?sp("♥ محفوظ (إزالة)","♥ Saved (remove)"):sp("♡ احفظ للاحقاً","♡ Save for later"))+'</button><button type="button" class="share" data-share="'+k+'">'+sp("شارك المنتج","Share product")+'</button><a class="share" href="books/'+SLUG[k]+'.html">'+sp("صفحة المنتج","Product page")+'</a>'+(x.cat.indexOf("code")>-1?'<a class="share" href="#code">'+sp("جرّب الكود الآن","Try coding now")+'</a>':"")+''+(k==="n"?'<a class="share" href="samples/Echo-City-Free-Sample.pdf" target="_blank" rel="noopener">'+sp("عيّنة مجانية (الفصلان الأولان)","Free sample (first 2 chapters)")+'</a>':(k==="r"?'<a class="share" href="samples/Mirrors-Three-Free-Sample.pdf" target="_blank" rel="noopener">'+sp("عيّنة مجانية (الفصلان الأولان)","Free sample (first 2 chapters)")+'</a>':""))+'</div>'
  +dealHtml(k)+'</div>'+th;
 if(anim){sdet.classList.remove("swap");void sdet.offsetWidth;sdet.classList.add("swap")}
}
function selectKey(k,scroll){
 if(!P[k])return; curK=k;
 if(!inCat(k)||!inQ(k)){curCat="all";curQ="";var qi=document.getElementById("q");if(qi)qi.value="";renderChips()}
 renderList();renderDetail(true);
 try{history.replaceState(null,"","#shop-"+k)}catch(e){}
 if(scroll)sdet.scrollIntoView({behavior:"smooth",block:"start"});
}
function syncShop(){
 if(!slist)return;
 [].forEach.call(slist.querySelectorAll(".srow"),function(r){r.classList.toggle("has",isOn(r.getAttribute("data-k")))});
 renderDetail(false);
}
chipsEl.addEventListener("click",function(e){var b=e.target.closest("button[data-cat]");if(!b)return;curCat=b.getAttribute("data-cat");renderChips();renderList();renderDetail(true)});
slist.addEventListener("click",function(e){var as=e.target.closest("[data-addsaved]");if(as){var n=0;SAVED.forEach(function(k){if(!isOn(k)){setOn(k,true);n++}});toast(n?"أُضيفت المحفوظات إلى طلبك":"كلها في طلبك مسبقاً",n?"Saved items added to your order":"All already in your order");return}var b=e.target.closest(".srow");if(!b)return;selectKey(b.getAttribute("data-k"),window.innerWidth<=900)});
sdet.addEventListener("click",function(e){
 var a=e.target.closest("[data-add]");
 if(a){var k=a.getAttribute("data-add"),v=!isOn(k);setOn(k,v);toast(v?"أُضيف إلى طلبك":"أُزيل من طلبك",v?"Added to your order":"Removed from your order");return}
 var d=e.target.closest("[data-addboth]");
 if(d){var ks=d.getAttribute("data-addboth").split(","),all=ks.every(isOn);ks.forEach(function(k){setOn(k,!all)});toast(all?"أُزيل من طلبك":"أُضيف مع الخصم",all?"Removed from your order":"Added with the discount");return}
 var sv=e.target.closest("[data-save]");
 if(sv){var sk=sv.getAttribute("data-save"),i=SAVED.indexOf(sk);if(i>-1)SAVED.splice(i,1);else SAVED.push(sk);persistSaved();renderChips();renderList();renderDetail(false);toast(i>-1?"أُزيل من المحفوظات":"حُفظ في المحفوظات",i>-1?"Removed from saved":"Saved for later");return}
 var s2=e.target.closest("[data-share]");
 if(s2){var sk2=s2.getAttribute("data-share"),url=location.origin+location.pathname+"#shop-"+sk2;
  if(navigator.share){navigator.share({title:P[sk2].ar,text:P[sk2].ar+" - "+P[sk2].en,url:url}).catch(function(){});return}
  try{navigator.clipboard.writeText(url).then(function(){toast("تم نسخ الرابط","Link copied")},function(){toast(url,url)})}catch(er){toast(url,url)}}
});
function openFromHash(scroll){var m=/^#shop-([a-z])$/.exec(location.hash);if(m&&P[m[1]]){selectKey(m[1],scroll)}}
window.addEventListener("hashchange",function(){openFromHash(true)});
renderChips();renderList();renderDetail(false);
(function(){var q=document.getElementById("q"),t;if(!q)return;
 function ph(){q.placeholder=L()==="en"?"Search books, e.g. python, novel, planner":"ابحث: بايثون، رواية، مخطط…"}
 ph();document.getElementById("lang").addEventListener("click",function(){setTimeout(ph,0)});
 q.addEventListener("input",function(){clearTimeout(t);t=setTimeout(function(){curQ=q.value.trim().slice(0,60);renderList();renderDetail(true)},120)});
 q.addEventListener("keydown",function(e){if(e.key==="Escape"){q.value="";curQ="";renderList();renderDetail(true)}});
})();
[].forEach.call(document.querySelectorAll("[data-pp]"),function(n){var k=n.getAttribute("data-pp");if(P[k]){n.dir="ltr";n.textContent="$"+P[k].p+" \u00b7 \u2248 "+iq(P[k].p)+" IQD"}});
/* ---------- customer reviews (verified buyers, moderated; data in assets/reviews.json) ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function stars(n){var s="";for(var i=1;i<=5;i++)s+=i<=n?"★":"☆";return s}
function rvOf(k){return RV.filter(function(r){return r.p&&r.p.indexOf(k)>-1})}
function rvStat(k){var a=rvOf(k);if(!a.length)return null;var s=0;a.forEach(function(r){s+=r.r});return {n:a.length,avg:Math.round(s/a.length*10)/10}}
function rvLine(k){var s=rvStat(k),lk='<a class="rvlink" href="https://t.me/SmartZaki_Bot?start=rv_'+k+'" target="_blank" rel="noopener">'+sp("اكتب تقييمك","Write a review")+'</a>';return '<div class="rvline">'+(s?'<span class="rvs">'+stars(Math.round(s.avg))+'</span> <b>'+s.avg+'</b> <small>('+s.n+')</small> ':'')+lk+'</div>'}
function rvCard(r){
 var names=(r.p||[]).filter(function(k){return P[k]}).map(function(k){return sp(esc(P[k].ar),esc(P[k].en))}).join(" · ");
 return '<article class="rvc"><div class="rvs" aria-label="'+(+r.r)+'/5">'+stars(+r.r)+'</div>'+(r.text?'<p>'+esc(r.text)+'</p>':'')+'<div class="rvm"><b>'+esc(r.name)+'</b>'+(r.v?' <span class="rvbadge">'+sp("\u2713 مشترٍ موثّق","\u2713 Verified buyer")+'</span>':'')+' · <bdi>'+esc(r.date||"")+'</bdi>'+(names?'<br><small>'+names+'</small>':'')+'</div></article>'}
function renderReviews(){
 var sec=document.getElementById("reviews"),box=document.getElementById("rv");if(!sec||!box)return;sec.hidden=false;
 var note='<p class="rvnote">'+sp("يمكنك كتابة تقييمك عبر البوت، وتظهر الآراء هنا بعد المراجعة. شارة «مشترٍ موثّق» تعني أن صاحب الرأي اشترى المنتج فعلاً.","You can write a review through the bot, and reviews appear here after moderation. The “Verified buyer” badge means the reviewer actually bought the product.")+'</p><p class="rvnote"><a class="rvlink big" href="https://t.me/SmartZaki_Bot?start=review" target="_blank" rel="noopener">'+sp("اكتب تقييمك","Write a review")+'</a>'+'</p>';
 if(!RV.length){box.innerHTML='<p class="rvnote">'+sp("لا توجد تقييمات بعد.","No reviews yet.")+'</p>'+note;return}
 var sum=0;RV.forEach(function(r){sum+=+r.r});var avg=Math.round(sum/RV.length*10)/10;
 box.innerHTML='<div class="rvtop"><b>'+avg+'</b> <span class="rvs">'+stars(Math.round(avg))+'</span> <small>('+RV.length+')</small></div><div class="rvgrid">'+RV.slice(0,12).map(rvCard).join("")+'</div>'+note;
}
try{fetch("assets/reviews.json?t="+Date.now()).then(function(r){return r.ok?r.json():{reviews:[]}}).then(function(d){RV=((d&&d.reviews)||[]).filter(function(r){return r&&typeof r==="object"}).map(function(r){return {id:r.id,p:Array.isArray(r.p)?r.p.filter(function(k){return P[k]}):[],r:Math.max(0,Math.min(5,Math.round(+r.r)||0)),name:String(r.name||"").slice(0,40),text:String(r.text||"").slice(0,400),v:r.v?1:0,date:String(r.date||"").slice(0,10)}}).filter(function(r){return r.r>=1&&r.p.length});renderReviews();renderDetail(false)}).catch(function(){renderReviews()})}catch(e){renderReviews()}


/* ---------- mini cart ---------- */
var cpanel=document.getElementById("cartpanel"), cpill=document.getElementById("cartpill"), clist=document.getElementById("cartlist");
function renderCart(c){
 clist.innerHTML=c.sel.map(function(k){var x=P[k];return '<li><img alt="" src="assets/'+x.img+'.jpg?v=4"><span class="nm">'+sp(x.ar,x.en)+'</span><span class="pr">$'+x.p+'</span><button type="button" data-rm="'+k+'" aria-label="remove">✕</button></li>'}).join("");
 if(!c.sel.length){cpanel.hidden=true;cpill.setAttribute("aria-expanded","false")}
}
cpill.addEventListener("click",function(){var o=cpanel.hidden;cpanel.hidden=!o;cpill.setAttribute("aria-expanded",String(o))});
document.getElementById("cartx").addEventListener("click",function(){cpanel.hidden=true;cpill.setAttribute("aria-expanded","false")});
document.getElementById("cartgo").addEventListener("click",function(e){e.preventDefault();cpanel.hidden=true;cpill.setAttribute("aria-expanded","false");go()});
[].forEach.call(document.querySelectorAll('a.btn[href="#order"]'),function(a){if(a.id!=="cartgo")a.addEventListener("click",function(e){if(document.querySelector("#items input:checked")){e.preventDefault();go()}})});
clist.addEventListener("click",function(e){var b=e.target.closest("[data-rm]");if(b)setOn(b.getAttribute("data-rm"),false)});

/* ---------- theme, progress, active nav ---------- */
var tb=document.getElementById("theme");
function dark(){var t=root.getAttribute("data-theme");return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches}
try{var th=localStorage.getItem("theme");if(th==="dark"||th==="light")root.setAttribute("data-theme",th)}catch(e){}
tb.addEventListener("click",function(){var n=dark()?"light":"dark";root.setAttribute("data-theme",n);try{localStorage.setItem("theme",n)}catch(e){}});
var prog=document.getElementById("prog");
function onScroll(){var h=document.documentElement.scrollHeight-innerHeight;prog.style.setProperty("--p",(h>0?Math.min(100,scrollY/h*100):0)+"%")}
addEventListener("scroll",onScroll,{passive:true});onScroll();
if("IntersectionObserver" in window){
 var navs=[].slice.call(document.querySelectorAll("a.nav")), map={};
 navs.forEach(function(a){map[a.getAttribute("href").slice(1)]=a});
 var io2=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){navs.forEach(function(a){a.classList.remove("on")});var a=map[en.target.id];if(a)a.classList.add("on")}})},{rootMargin:"-45% 0px -50% 0px"});
 Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(el)io2.observe(el)});
}
var saved="ar"; try{saved=localStorage.getItem("lang")||"ar"}catch(e){}
setLang(saved==="en"?"en":"ar");
(function(){var cart=[];try{cart=JSON.parse(localStorage.getItem("cart")||"[]")}catch(e){}
 if(Array.isArray(cart))cart.forEach(function(k){if(typeof k==="string"&&P[k])setOn(k,true)});
 function save(){try{localStorage.setItem("cart",JSON.stringify([].map.call(document.querySelectorAll("#items input:checked"),function(x){return x.id.slice(2)})))}catch(e){}}
 var items=document.getElementById("items");if(items)items.addEventListener("change",save);
 var m=/[?&]add=([a-z])(?:&|$)/.exec(location.search),r=/^#shop-([a-z])$/.exec(location.hash),k=m?m[1]:(r&&/\/books\//.test(document.referrer)?r[1]:null);
 if(k&&P[k]){setOn(k,true);try{history.replaceState(null,"",location.pathname+"#order")}catch(e){}setTimeout(function(){go();toast("أُضيف إلى طلبك","Added to your order")},400)}
 save()})();
openFromHash(false);
})();
