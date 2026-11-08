(function(){
var a=document.getElementById("aud"),s=document.getElementById("audio");if(!a||!s||!window.fetch)return;
var f="assets/audio/echo_sample.mp3";
fetch(f,{method:"HEAD"}).then(function(r){if(r.ok){a.src=f;s.hidden=false}}).catch(function(){});
})();
(function(){var d=document.getElementById("guidefold");if(d&&window.matchMedia("(min-width:861px)").matches)d.open=true})();
