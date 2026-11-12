/* v16 — Açılış sahnesi: gerçek makine fotoğrafı; bantta Reynas portföyünden kesilmiş gerçek ürünler akar. */
(()=>{
 const canvas=document.querySelector('.beltline');if(!canvas)return;const ctx=canvas.getContext('2d'),stage=canvas.parentElement;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 /* Fotoğraftaki ölçüler (piksel): bandın üst yüzeyi, makinenin ağzı ve yan gövdesi */
 const IW=1672,IH=941,BT=557,BB=597,SLOT=1126,FRAME=554,SIDE=1282,DARK0=1150,DARK1=1272,SQ=.42;
 let W=0,H=0,dpr=1,k=1,m=1,G={},sprites=[],items=[],visible=false,running=false,last=0,order=[],beltShift=0,pending=null;
 const photo=new Image();photo.src='assets/machine.webp';
 const LIST=[['Hangtag','belt/p14-1',150],['Woven','belt/p17-1',150],['Woven','belt/p19-2',150],['Woven','belt/p18-0',140],['Silicone','belt/p22-1',125],['Silicone','belt/p22-0',125],['Metallic','belt/p29-3',150],['Metallic','belt/p28-3',80],['Metallic','belt/p28-1',80],['Leather','pile/p33-2',135],['Leather','pile/p36-0',135],['Jacron','belt/p39-0',140],['Jacron','belt/p39-1',140]];
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const load=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});
 /* Ürün fotoğrafları açık zeminde çekildi; karanlık sahneye uysun diye bir kez tonlanır */
 function bake(img,size){
  const sc=size/Math.max(img.width,img.height),c=document.createElement('canvas'),dark=document.createElement('canvas');c.width=dark.width=img.width;c.height=dark.height=img.height;
  const g=c.getContext('2d');g.drawImage(img,0,0);
  try{const d=g.getImageData(0,0,c.width,c.height),p=d.data,dd=g.createImageData(c.width,c.height),q=dd.data;
   for(let i=0;i<p.length;i+=4){const l=.3*p[i]+.59*p[i+1]+.11*p[i+2];for(let j=0;j<3;j++){const v=(l+(p[i+j]-l)*.9)*.8;p[i+j]=v;q[i+j]=v*.32}q[i+3]=p[i+3]}
   g.putImageData(d,0,0);dark.getContext('2d').putImageData(dd,0,0)}catch{const x=dark.getContext('2d');x.drawImage(img,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,c.width,c.height)}
  return{c,dark,face:img,w:img.width*sc,h:img.height*sc,thick:3}}
 /* ---------- sahne ---------- */
 function layout(){
  const r=stage.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  const mobile=W<1000,kn=W/1180,yb=mobile?H-200*kn:H-Math.max(150,H*.22);
  k=mobile?kn:Math.max(W/IW,yb/BT);m=mobile?Math.min(1.6,1.3*700/W+.3):1;
  const ox=W-IW*k,oy=yb-BT*k;G={ox,oy,top:oy+BT*k,depth:(BB-BT)*k,start:ox+(DARK1+12)*k,speed:58*k*(mobile?1.5:1),gap:46*k*m};
 }
 const X=v=>G.ox+v*k,Y=v=>G.oy+v*k;
 function fadeTop(){if(G.oy<=0)return;const band=(h,x0,x1,mid)=>{const g=ctx.createLinearGradient(0,G.oy,0,G.oy+h);g.addColorStop(0,'#18191a');g.addColorStop(mid,'rgba(24,25,26,.7)');g.addColorStop(1,'rgba(24,25,26,0)');ctx.fillStyle=g;ctx.fillRect(x0,G.oy-1,x1-x0,h+1)};const mx=X(1085);band(330*k,0,mx,.35);band(60*k,mx,W,.3);const g=ctx.createLinearGradient(mx-40*k,0,mx+30*k,0);g.addColorStop(0,'rgba(24,25,26,0)');g.addColorStop(1,'rgba(24,25,26,0)');}
 function backdrop(){
  ctx.fillStyle='#18191a';ctx.fillRect(0,0,W,H);if(!photo.naturalWidth)return;
  const pw=IW*k,ph=IH*k;ctx.drawImage(photo,G.ox,G.oy,pw,ph);
  if(G.oy+ph<H)ctx.drawImage(photo,0,IH-3,IW,3,G.ox,G.oy+ph-1,pw,H-G.oy-ph+1);
  fadeTop();
  if(W>=1000){const g=ctx.createLinearGradient(0,0,W*.6,0);g.addColorStop(0,'rgba(12,12,12,.5)');g.addColorStop(1,'rgba(12,12,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W*.6,G.top-14*k)}
  /* bant akıyormuş hissi: yüzeyde kayan çok hafif ekler */
  ctx.save();ctx.beginPath();ctx.rect(-2,G.top,X(DARK1)+2,G.depth);ctx.clip();const gap=240*k,off=((beltShift%gap)+gap)%gap;ctx.lineWidth=Math.max(1,1.4*k);
  for(let x=X(DARK1)-off;x>-gap;x-=gap){ctx.strokeStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.moveTo(x+4*k,G.top);ctx.lineTo(x,G.top+G.depth);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.06)';ctx.beginPath();ctx.moveTo(x+6*k,G.top);ctx.lineTo(x+2*k,G.top+G.depth);ctx.stroke()}
  ctx.restore();
 }
 const size=it=>k*m*it.scale;
 function itemPos(it){return{x:it.x,y:G.top+G.depth*(.32+.36*it.z)}}
 function drawItems(){
  items.sort((a,b)=>a.z-b.z);
  for(const it of items){const p=itemPos(it),sp=it.sp,z=size(it),rx=sp.w*z*.56,ry=sp.h*z*SQ*.62;ctx.save();ctx.translate(p.x+7*k,p.y+3*k);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(0,0,0,.62)');g.addColorStop(.7,'rgba(0,0,0,.3)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,7);ctx.fill();ctx.restore()}
  for(const it of items){const p=itemPos(it),sp=it.sp,z=size(it),w=sp.w*z,h=sp.h*z;ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,SQ);ctx.rotate(it.a);
   for(let d=sp.thick*k*m;d>0;d-=1)ctx.drawImage(sp.dark,-w/2,-h/2+d/SQ,w,h);ctx.drawImage(sp.c,-w/2,-h/2,w,h);ctx.restore()}
 }
 function machineFront(){
  if(!photo.naturalWidth)return;
  const g=ctx.createLinearGradient(X(DARK0),0,X(DARK1),0);g.addColorStop(0,'rgba(8,8,8,0)');g.addColorStop(1,'rgba(8,8,8,.95)');ctx.fillStyle=g;ctx.fillRect(X(DARK0),Y(500),X(DARK1)-X(DARK0)+1,100*k);
  ctx.save();ctx.beginPath();ctx.rect(X(SLOT),-1,W,Y(FRAME)+1);ctx.rect(X(SIDE),-1,W,H+2);ctx.rect(X(SLOT),Y(BB+1),W,H);ctx.clip();ctx.drawImage(photo,G.ox,G.oy,IW*k,IH*k);fadeTop();ctx.restore();
 }
 function next(){if(!order.length)order=sprites.map((_,i)=>i).sort(()=>Math.random()-.5);return sprites[order.pop()]}
 function make([name,sp],x){return{sp,name,x,z:rnd(.1,.9),a:rnd(-.22,.22),scale:1}}
 function halfW(it){return it.sp.w*size(it)*.5}
 function update(dt){
  beltShift+=G.speed*dt;for(const it of items)it.x-=G.speed*dt;
  items=items.filter(it=>it.x>-halfW(it)-40);
  if(!pending)pending=make(next(),0);pending.x=G.start+halfW(pending);
  const tail=items.reduce((a,it)=>it.x>(a?a.x:-1e9)?it:a,null);
  if(!tail||tail.x+halfW(tail)+G.gap+halfW(pending)<=pending.x){items.push(pending);pending=null}
 }
 function render(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);backdrop();drawItems();machineFront()}
 function frame(now){if(!visible||document.hidden){running=false;return}const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(frame)}
 function wake(){if(sprites.length&&!running&&visible&&!reduce.matches){running=true;last=performance.now();requestAnimationFrame(frame)}}
 function prefill(){items=[];order=[];let x=G.start;while(x>-120*k){const it=make(next(),0);x-=halfW(it);it.x=x;x-=halfW(it)+G.gap;if(it.x<G.start-halfW(it))items.push(it)}}
 function start(imgs){
  sprites=LIST.map(([name,src,sz],i)=>imgs[i]&&[name,bake(imgs[i],sz)]).filter(Boolean);layout();prefill();render();
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;wake()},{threshold:.02}).observe(canvas);document.addEventListener('visibilitychange',wake);
  let tm;addEventListener('resize',()=>{clearTimeout(tm);tm=setTimeout(()=>{const b=stage.getBoundingClientRect();if(Math.abs(b.width-W)>1||Math.abs(b.height-H)>1){layout();prefill();render()}},150)})}

 /* ---------- ürünü banttan alıp inceleme ---------- */
 const groups={Hangtag:'hangtag',Woven:'woven',Leather:'leather',Jacron:'jacron',Silicone:'silicone',Metallic:'metallic'};let held=null;
 function hit(mx,my){for(let i=items.length-1;i>=0;i--){const it=items[i],p=itemPos(it),z=size(it),dx=mx-p.x,dy=(my-p.y)/SQ,c=Math.cos(-it.a),n=Math.sin(-it.a),lx=dx*c-dy*n,ly=dx*n+dy*c;if(it.x<X(SLOT)&&Math.abs(lx)<=it.sp.w*z/2+6&&Math.abs(ly)<=it.sp.h*z/2+6)return it}return null}
 const local=e=>{const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
 canvas.addEventListener('mousemove',e=>{canvas.style.cursor=hit(...local(e))?'pointer':''});
 canvas.addEventListener('click',e=>{if(held)return;const it=hit(...local(e));if(it)pick(it)});
 function flyFrom(it,width){const r=canvas.getBoundingClientRect(),p=itemPos(it),sc=it.sp.w*size(it)/width;return`translate(${r.left+p.x-innerWidth/2}px,${r.top+p.y-innerHeight/2}px) rotate(${it.a}rad) scale(${sc},${sc*SQ})`}
 function pick(it){
  items=items.filter(o=>o!==it);const id=groups[it.name],col=(typeof collections!=='undefined'?collections:[]).find(c=>c[0]===id)||[id,it.name,'',''];
  const width=Math.min(430,innerWidth*.82),fh=width*it.sp.h/it.sp.w,height=Math.min(Math.max(fh,270),330);
  const root=document.createElement('div');root.className='pick';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',it.name);
  root.innerHTML='<div class="pick-mover"><div class="pick-flip" role="button" tabindex="0" aria-pressed="false"><div class="pick-front"></div><div class="pick-back"><strong></strong><em></em><p></p><a class="btn solid" href="#iletisim">Bu koleksiyon hakkında konuşalım ↗</a></div></div><p class="pick-hint">Arkasını görmek için tıklayın</p></div>';
  const mover=root.querySelector('.pick-mover'),flip=root.querySelector('.pick-flip'),front=root.querySelector('.pick-front'),face=document.createElement('canvas');
  face.width=it.sp.face.naturalWidth;face.height=it.sp.face.naturalHeight;face.getContext('2d').drawImage(it.sp.face,0,0);face.style.width=width+'px';face.style.height=fh+'px';front.append(face);
  flip.style.width=width+'px';flip.style.height=height+'px';root.querySelector('strong').textContent=it.name;root.querySelector('em').textContent=col[2];root.querySelector('.pick-back p').textContent=col[3];
  document.body.append(root);held={it,root,mover,flip,width};
  const quick=reduce.matches?0:620;mover.animate([{transform:flyFrom(it,width)},{transform:'none'}],{duration:quick,easing:'cubic-bezier(.2,.8,.2,1)'});requestAnimationFrame(()=>root.classList.add('on'));
  const toggle=()=>{const f=flip.classList.toggle('flipped');flip.setAttribute('aria-pressed',f);root.classList.toggle('turned',f)};
  flip.addEventListener('click',e=>{if(e.target.closest('a'))return;toggle()});flip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
  root.querySelector('a').addEventListener('click',()=>{const sel=document.querySelector('#brief select');if(sel)sel.value=col[1];drop(true)});
  root.addEventListener('click',e=>{if(e.target===root)drop()});flip.classList.add('by-mouse');flip.focus({preventScroll:true});addEventListener('keydown',function k(e){if(e.key==='Tab'){flip.classList.remove('by-mouse');removeEventListener('keydown',k)}});if(!running)render();
 }
 function drop(fast){
  if(!held)return;const {it,root,mover,flip,width}=held;held=null;root.classList.remove('on','turned');flip.classList.remove('flipped');
  const r=canvas.getBoundingClientRect(),m=mover.getBoundingClientRect();it.x=Math.max(halfW(it)+10,Math.min(X(SLOT)-halfW(it)-10,m.left+m.width/2-r.left));it.z=rnd(.2,.8);
  const done=()=>{root.remove();items.push(it);if(!running)render()};
  if(reduce.matches||fast){done();return}
  mover.animate([{transform:'none'},{transform:flyFrom(it,width)}],{duration:480,easing:'cubic-bezier(.5,0,.8,.4)',fill:'forwards'}).onfinish=done;
 }
 addEventListener('keydown',e=>{if(e.key==='Escape'&&held)drop()});
 Promise.all(LIST.map(([,src])=>load('assets/'+src+'.webp'))).then(start);photo.onload=()=>{if(sprites.length){layout();if(!running)render()}};
})();
