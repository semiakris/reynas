/* v11 — ana sayfa: koleksiyon panelleri, galeri, menü, proje özeti, dikiş açılışı */
const collectionCovers={leather:'p36-3.webp',jacron:'p41-0.webp'};
const cards=document.querySelector('#cards'),gallery=document.querySelector('#gallery'),zoom=document.querySelector('#zoom'),select=document.querySelector('#brief select');
collections.forEach(([id,name,title,desc,pages],i)=>{
 const card=document.createElement('button');card.type='button';card.className='panel'+(i===0?' is-open':'');
 const img=new Image;img.src=`assets/${collectionCovers[id]||`p${pages[0]}-0.webp`}`;img.loading='lazy';img.alt=`${name} koleksiyonundan ürün örneği`;
 const text=document.createElement('span');text.className='panel-text';const h=document.createElement('strong');h.textContent=name;const t=document.createElement('em');t.textContent=title;const d=document.createElement('span');d.textContent=desc;text.append(h,t,d);
 card.append(img,text);card.onclick=()=>openCollection(id);
 const open=()=>{cards.querySelectorAll('.is-open').forEach(c=>c.classList.remove('is-open'));card.classList.add('is-open')};card.addEventListener('pointerenter',open);card.addEventListener('focus',open);
 cards.append(card);select.add(new Option(name,name));
});
function openCollection(id){const c=collections.find(c=>c[0]===id);document.querySelector('#gallery-title').textContent=c[1];document.querySelector('#gallery-description').textContent=c[3];const grid=document.querySelector('.gallery-grid');grid.replaceChildren();for(const p of c[4])for(let n=0;n<4;n++){const b=document.createElement('button'),img=new Image;b.type='button';img.src=`assets/p${p}-${n}.webp`;img.alt=`${c[1]} ürün örneği ${p}-${n+1}`;img.loading='lazy';img.onerror=()=>b.remove();b.append(img);b.onclick=()=>{zoom.querySelector('img').src=img.src;zoom.querySelector('img').alt=img.alt;zoom.showModal()};grid.append(b)}document.querySelector('#inquiry').onclick=()=>{select.value=c[1];gallery.close()};gallery.showModal()}
document.querySelectorAll('#gallery,#zoom').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close()})});
const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');
menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open);menu.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç')};
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));
document.querySelector('#brief').onsubmit=e=>{e.preventDefault();const d=new FormData(e.target);const B=window.ReynasBridge,req={type:'mesaj',name:d.get('name'),company:d.get('name'),email:d.get('email'),message:[d.get('collection'),d.get('message')].filter(Boolean).join(' · ')};if(B&&B.live){B.send(req).then(r=>{document.querySelector('#status').textContent=r.ok?'Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.':'Mesaj gönderilemedi. Lütfen telefonla ulaşın.'}).catch(()=>{document.querySelector('#status').textContent='Mesaj gönderilemedi. Lütfen telefonla ulaşın.'});return}if(B)B.send(req);const text=`REYNAS / PROJE ÖZETİ\n\nAd / Firma: ${d.get('name')}\nE-posta: ${d.get('email')}\nKoleksiyon: ${d.get('collection')||'Belirtilmedi'}\n\n${d.get('message')}\n\nReynas iletişim: +90 553 245 70 60`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='reynas-proje-ozeti.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);document.querySelector('#status').textContent='Proje özetiniz indirildi. Bilgileriniz herhangi bir sunucuya gönderilmedi.'};
requestAnimationFrame(()=>document.body.classList.add('ready'));
addEventListener('scroll',()=>document.querySelector('.top').classList.toggle('scrolled',scrollY>40),{passive:true});

/* Dikiş: sayfa kaydıkça üst kenarda bir dikiş ilerler. */
(()=>{const seam=document.querySelector('.seam i');let ticking=false;function set(){ticking=false;const max=document.documentElement.scrollHeight-innerHeight;const p=max>0?Math.min(1,scrollY/max):0;seam.style.width=p*100+'%';seam.classList.toggle('on',p>.004)}addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(set)}},{passive:true});addEventListener('resize',set);set()})();
/* Şehir saatleri */
(()=>{const items=[...document.querySelectorAll('time[data-zone]')];function tick(){const now=new Date;for(const t of items){try{t.textContent=new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:t.dataset.zone}).format(now)}catch{t.textContent=''}}}tick();setInterval(tick,20000)})();
