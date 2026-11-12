const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const motionItems=[...document.querySelectorAll('.motion-strip')].map(section=>({section,video:section.querySelector('video'),button:section.querySelector('button'),manualPaused:false,visible:false}));
function loadClip(item){if(!item.video.getAttribute('src')){item.video.src=innerWidth<=600?item.video.dataset.mobile:item.video.dataset.desktop;item.video.load()}}
function setButton(item,playing){item.button.textContent=playing?'Ⅱ':'▶';item.button.setAttribute('aria-label',playing?'Animasyonu duraklat':'Animasyonu oynat');item.button.setAttribute('aria-pressed',String(playing))}
async function playClip(item){loadClip(item);try{await item.video.play();setButton(item,true)}catch{setButton(item,false)}}
function sync(item){if(item.visible&&!document.hidden&&!reduceMotion.matches&&!item.manualPaused)playClip(item);else{item.video.pause();setButton(item,false)}}
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{const item=motionItems.find(i=>i.section===e.target);item.visible=e.isIntersecting;sync(item)})},{threshold:.15});
motionItems.forEach(item=>{observer.observe(item.section);item.button.onclick=()=>{if(item.video.paused){item.manualPaused=false;playClip(item)}else{item.manualPaused=true;item.video.pause();setButton(item,false)}};item.video.addEventListener('error',()=>{setButton(item,false);item.button.hidden=true})});
reduceMotion.addEventListener('change',()=>motionItems.forEach(sync));document.addEventListener('visibilitychange',()=>motionItems.forEach(sync));
