/* Deri etiket yığını: imlecin çevresinden savrulan gerçek ürün kesitleri. */
(()=>{
 const section=document.querySelector('.pile');if(!section)return;
 const canvas=section.querySelector('canvas'),ctx=canvas.getContext('2d');
 const names=['p32-1','p32-2','p33-2','p34-1','p34-3','p36-0','p36-3','p32-0','p35-2'];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let sprites=[],labels=[],W=0,H=0,dpr=1,size=150,radius=190,visible=false,running=false,ready=false;
 const pointer={x:-9999,y:-9999,active:false,last:0};
 function rand(seed){let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647}
 function makeSprite(img){const scale=size/img.width,w=Math.round(img.width*scale),h=Math.round(img.height*scale),pad=Math.round(size*.14),c=document.createElement('canvas');c.width=(w+pad*2)*dpr;c.height=(h+pad*2)*dpr;const g=c.getContext('2d');g.scale(dpr,dpr);g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=pad*.7;g.shadowOffsetY=pad*.3;g.drawImage(img,pad,pad,w,h);return{c,w:w+pad*2,h:h+pad*2}}
 function build(){
  const r=section.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=W*dpr;canvas.height=H*dpr;
  size=Math.max(104,Math.min(178,W/8));radius=Math.max(150,Math.min(230,W*.2));
  sprites=sprites.map(s=>makeSprite(s.img)).map((s,i)=>({...s,img:sprites[i].img}));
  const random=rand(20261111),step=size*.4,cols=Math.ceil(W/step)+2,rows=Math.ceil(H/step)+2;labels=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const hx=(x-.5)*step+(random()-.5)*step*.7,hy=(y-.5)*step+(random()-.5)*step*.7;labels.push({hx,hy,x:hx,y:hy,vx:0,vy:0,rot:(random()-.5)*2.6,spin:(random()-.5)*1.6,a:0,va:0,s:sprites[Math.floor(random()*sprites.length)],z:random()})}
  labels.sort((a,b)=>a.z-b.z);
 }
 function step(){
  let moving=false;const px=pointer.x,py=pointer.y,R=radius*.62,cx=W*.5,cy=H*.5,RX=Math.min(W*.36,560),RY=Math.min(H*.36,300),open=pointer.active;
  for(const l of labels){
   let tx=l.hx,ty=l.hy;
   if(open){
    const ex=(l.hx-cx)/RX,ey=(l.hy-cy)/RY,e=Math.hypot(ex,ey);
    if(e<1.12){const k=(1.12-e)/(e||1)+.16/(e||1);tx+=ex*RX*k;ty+=ey*RY*k}
    const dx=tx-px,dy=ty-py,d=Math.hypot(dx,dy);
    if(d<R){const push=(R-d)*.9,n=d||1;tx+=dx/n*push;ty+=dy/n*push}
   }
   l.vx=(l.vx+(tx-l.x)*.07)*.8;l.vy=(l.vy+(ty-l.y)*.07)*.8;l.x+=l.vx;l.y+=l.vy;
   const off=Math.hypot(l.x-l.hx,l.y-l.hy),ta=Math.min(off/size,1.4)*l.spin;l.va=(l.va+(ta-l.a)*.06)*.82;l.a+=l.va;
   if(Math.abs(l.vx)+Math.abs(l.vy)>.02||Math.abs(tx-l.x)+Math.abs(ty-l.y)>.2)moving=true;
  }
  return moving;
 }
 function draw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);for(const l of labels){const s=l.s;ctx.setTransform(dpr,0,0,dpr,l.x*dpr,l.y*dpr);ctx.rotate(l.rot+l.a);ctx.drawImage(s.c,-s.w/2,-s.h/2,s.w,s.h)}}
 function frame(){
  if(!visible||document.hidden){running=false;return}
  const moving=step();draw();
  if(moving)requestAnimationFrame(frame);else running=false;
 }
 function wake(){if(ready&&!running&&visible){running=true;requestAnimationFrame(frame)}}
 function settle(){pointer.active=false;for(const l of labels){l.x=l.hx;l.y=l.hy;l.vx=l.vy=l.a=l.va=0}draw()}
 function place(e){const r=canvas.getBoundingClientRect(),t=e.touches?e.touches[0]:e;pointer.x=t.clientX-r.left;pointer.y=t.clientY-r.top;pointer.active=true;section.classList.add('pile-open');wake()}
 function release(){pointer.active=false;pointer.x=pointer.y=-9999;section.classList.remove('pile-open');wake()}
 section.addEventListener('mousemove',place);section.addEventListener('mouseleave',release);
 section.addEventListener('touchstart',place,{passive:true});section.addEventListener('touchmove',place,{passive:true});
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(!visible&&pointer.active&&matchMedia('(hover:none)').matches)release();wake()},{threshold:.05}).observe(section);
 document.addEventListener('visibilitychange',wake);reduce.addEventListener('change',()=>{if(ready){settle();wake()}});
 let timer;addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>{if(ready&&Math.abs(section.getBoundingClientRect().width-W)>1){build();settle();wake()}},160)});
 Promise.all(names.map(n=>new Promise(res=>{const img=new Image;img.onload=()=>res(img);img.onerror=()=>res(null);img.src=`assets/pile/${n}.webp`}))).then(imgs=>{
  imgs=imgs.filter(Boolean);if(!imgs.length){section.classList.add('pile-static');return}
  sprites=imgs.map(img=>({img}));build();ready=true;section.classList.add('pile-ready');settle();wake();
 });
})();
