/* Initialize saved language and direction before rendering. */
(function(){var r=document.documentElement,l="ar";try{l=localStorage.getItem("lang")||"ar"}catch(e){}l=l==="en"?"en":"ar";r.setAttribute("data-lang",l);r.lang=l;r.dir=l==="ar"?"rtl":"ltr"})();
