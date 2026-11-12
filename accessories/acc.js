/* Reynas Accessories: kaydırmayla ilerleyen kutu filmi + teklif formu */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,small=innerWidth<=860||(navigator.connection&&navigator.connection.saveData);
 /* ---------- ürün filmleri ----------
    Her ürünün kendi kare dizisi var. dir: klasör, n: son karenin numarası (f000…fNNN), step: telefonda kaç karede bir.
    Kareler yoksa bölüm sabitlenmez ve referans fotoğrafı kalır. */
 const FILMS={
  packaging:{dir:'film/',n:144,m:{dir:'film/m/',n:72}},
  bags:{dir:'film/bags/',n:143,step:2},
  canvas:{dir:'film/canvas/',n:143,step:2},
  leather:{dir:'film/leather/',n:143,step:2},
  flexible:{dir:'film/flexible/',n:143,step:2},
  custom:{dir:'film/custom/',n:143,step:2}};
 const TOP=76,films=[];
 function makeFilm(el){
  const base=FILMS[el.dataset.film];if(!base)return;const c=small&&base.m?base.m:base,step=small&&!base.m?(base.step||1):1,count=Math.floor(c.n/step);
  const pin=el.querySelector('.film-pin'),canvas=el.querySelector('.film-canvas'),scenes=[...el.querySelectorAll('.scene')],rail=el.querySelector('.film-rail i'),ctx=canvas.getContext('2d');
  const f={el,frames:new Array(count+1),cur:0,target:0,drawn:null,live:false,loading:false,cw:0,ch:0};
  const src=i=>c.dir+'f'+String(i*step).padStart(3,'0')+'.webp';
  const nearest=i=>{for(let d=0;d<=count;d++){if(f.frames[i-d])return f.frames[i-d];if(f.frames[i+d])return f.frames[i+d]}return null};
  f.size=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);f.cw=canvas.width=Math.round(r.width*dpr);f.ch=canvas.height=Math.round(r.height*dpr);f.drawn=null};
  f.draw=()=>{const im=nearest(Math.round(f.cur));if(!im||f.drawn===im)return;const s=Math.max(f.cw/im.naturalWidth,f.ch/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;ctx.drawImage(im,(f.cw-w)*(small?.5:.68),(f.ch-h)*.5,w,h);f.drawn=im};
  f.progress=()=>{const r=el.getBoundingClientRect(),span=el.offsetHeight-pin.offsetHeight;return span>0?Math.min(1,Math.max(0,(TOP-r.top)/span)):0};
  f.text=p=>{scenes.forEach(s=>s.classList.toggle('on',p>=+s.dataset.a&&p<+s.dataset.b));rail.style.transform='scaleX('+p+')'};
  f.update=()=>{if(!f.live)return false;const p=f.progress();f.target=p*count;f.text(p);return true};
  f.step=()=>{f.cur+=(f.target-f.cur)*.16;if(Math.abs(f.target-f.cur)<.05)f.cur=f.target;f.draw();return f.cur!==f.target};
  const load=i=>new Promise(res=>{if(f.frames[i])return res();const im=new Image();im.decoding='async';im.onload=()=>{f.frames[i]=im;if(Math.abs(i-f.cur)<12){f.drawn=null;f.draw()}res()};im.onerror=res;im.src=src(i)});
  /* yaklaşınca yükle: önce ilk kare (yoksa fotoğrafta kal), sonra kabadan inceye */
  f.wake=async()=>{if(f.loading)return;f.loading=true;await load(0);if(!f.frames[0]){f.loading=false;f.missing=true;return}
   el.classList.add('live');f.live=true;f.size();f.update();f.cur=f.target;f.draw();kick();
   const order=[],seen=new Set([0]);for(const st of[16,8,4,2,1])for(let i=0;i<=count;i+=st)if(!seen.has(i)){seen.add(i);order.push(i)}
   let k=0;const worker=async()=>{while(k<order.length&&f.loading)await load(order[k++])};for(let w=0;w<3;w++)worker()};
  /* uzaklaşınca belleği bırak */
  f.sleep=()=>{if(!f.loading)return;f.loading=false;const keep=f.frames[Math.round(f.cur)]||nearest(Math.round(f.cur));f.frames=new Array(count+1);if(keep)f.frames[Math.round(f.cur)]=keep};
  films.push(f)}
 let fraf=0;function ftick(){fraf=0;let more=false;for(const f of films)if(f.live&&f.step())more=true;if(more)fraf=requestAnimationFrame(ftick)}
 function kick(){for(const f of films)f.update();if(!fraf)fraf=requestAnimationFrame(ftick)}
 if(!reduce){document.querySelectorAll('.film[data-film]').forEach(makeFilm);
  addEventListener('scroll',kick,{passive:true});addEventListener('resize',()=>{for(const f of films)if(f.live){f.size();f.draw()}kick()});
  if('IntersectionObserver' in window){const near=new IntersectionObserver(es=>es.forEach(e=>{const f=films.find(x=>x.el===e.target);if(!f||f.missing)return;e.isIntersecting?f.wake():f.sleep()}),{rootMargin:'150% 0px 150% 0px'});films.forEach(f=>near.observe(f.el))}else films.forEach(f=>f.wake())}

 /* ---------- görsel yuvaları: dosya yoksa yedeğe ya da sakin bir yer tutucuya düş ---------- */
 document.querySelectorAll('img[data-slot]').forEach(im=>{const miss=()=>{if(im.dataset.fallback){const f=im.dataset.fallback;delete im.dataset.fallback;im.src=f}else im.closest('figure').classList.add('missing')};im.addEventListener('error',miss);if(im.complete&&!im.naturalWidth)miss()});

 /* ---------- üstbilgi, açılış ve panel kaydırmaları: tek dinleyici ---------- */
 const hero=document.getElementById('hero'),hpin=hero.querySelector('.ahero-pin'),himgs=[...hero.querySelectorAll('.ahero-media img')],hidx=[...hero.querySelectorAll('.ahero-index li')];
 if(!reduce)hero.classList.add('live');
 let sf=0;
 function frame(){sf=0;const y=scrollY;document.body.classList.toggle('at-top',y<40);
  if(!reduce){const span=hero.offsetHeight-hpin.offsetHeight,p=span>0?Math.min(1,Math.max(0,(y-hero.offsetTop)/span)):0,pos=p*(himgs.length-1),near=Math.round(pos);
   himgs.forEach((im,i)=>{const d=pos-i;im.style.setProperty('--o',Math.max(0,1-Math.abs(d)*1.5).toFixed(3));im.style.setProperty('--k',Math.min(1,Math.max(0,d+.5)).toFixed(3))});hidx.forEach((l,i)=>l.classList.toggle('on',i===near));}}
 addEventListener('scroll',()=>{if(!sf)sf=requestAnimationFrame(frame)},{passive:true});addEventListener('resize',frame);frame();

 /* ---------- malzeme ---------- */
 const tabs=[...document.querySelectorAll('.mat-tabs button')],figs=[...document.querySelectorAll('.mat-stage figure')];
 const pickM=k=>{tabs.forEach(b=>b.setAttribute('aria-selected',b.dataset.m===k));figs.forEach(f=>f.classList.toggle('on',f.dataset.m===k))};
 tabs.forEach((b,i)=>{b.onclick=()=>pickM(b.dataset.m);b.onmouseenter=()=>{if(matchMedia('(hover:hover)').matches)pickM(b.dataset.m)};b.onkeydown=e=>{const d=e.key==='ArrowDown'||e.key==='ArrowRight'?1:e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:0;if(d){e.preventDefault();const n=tabs[(i+d+tabs.length)%tabs.length];n.focus();pickM(n.dataset.m)}}});

 /* ---------- menü ---------- */
 const menu=document.querySelector('.menu'),nav=document.getElementById('nav');
 menu.onclick=()=>{const o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',o)};
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));

 /* ---------- teklif ---------- */
 const form=document.getElementById('quote'),st=document.getElementById('quote-status');
 document.querySelectorAll('[data-kind]').forEach(a=>a.addEventListener('click',()=>{const c=form.querySelector('input[name=kind][value="'+a.dataset.kind+'"]');if(c)c.checked=true}));
 form.onsubmit=async e=>{e.preventDefault();const d=new FormData(form),B=window.ReynasBridge,btn=form.querySelector('button');
  const msg=['Accessories teklif talebi',d.getAll('kind').join(', '),d.get('country'),d.get('message')].filter(Boolean).join(' · ');
  btn.disabled=true;st.textContent='';
  try{const r=B?await B.send({type:'mesaj',name:d.get('name'),company:d.get('name'),email:d.get('email'),qty:Number(d.get('qty'))||null,message:msg}):{ok:false,demo:true};
   st.textContent=r.ok?'Talebiniz bize ulaştı. En kısa sürede dönüş yapacağız.':r.demo?'Teklif bağlantısı henüz kurulmadı. Lütfen telefonla ulaşın.':'Talep gönderilemedi. Lütfen telefonla ulaşın.';if(r.ok)form.reset()}
  catch{st.textContent='Talep gönderilemedi. Lütfen telefonla ulaşın.'}finally{btn.disabled=false}};
})();
