/* v13 — Üretim animasyonları: her uygulama kendi makinesiyle çalışır. window.reynasFx = {produce, stop, on} */
(()=>{
 const $=id=>document.getElementById(id),q=s=>document.querySelector(s);
 const press=q('.press'),canvas=$('label-canvas'),fx=q('.fx'),gauges=q('.gauges'),stateEl=$('hall-state');if(!fx)return;
 const fc=fx.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,on=false,toolBefore='';
 const clamp=v=>Math.max(0,Math.min(1,v)),seg=(t,a,b)=>clamp((t-a)/(b-a)),eo=t=>1-Math.pow(1-t,3),eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 const copy=()=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;c.getContext('2d').drawImage(canvas,0,0);return c};
 const kinds={screen:'screen',print:'print',tram:'print',enamel:'print',laser:'laser',foilGold:'foil',foilSilver:'foil',emboss:'press',deboss:'press',molded:'press',weave:'weave'};
 const durations={screen:3200,print:3000,laser:3600,foil:3800,press:2600,weave:3400};
 function stop(){if(!on)return;cancelAnimationFrame(raf);on=false;fc.setTransform(1,0,0,1,0,0);fc.clearRect(0,0,fx.width,fx.height);fx.style.display='none';canvas.style.visibility='';gauges.classList.remove('busy');stateEl.textContent='Hat hazır';if(toolBefore)$('tool-name').textContent=toolBefore}
 function produce(){
  if(reduce.matches||!window.reynasRedraw||!canvas.offsetWidth)return;stop();
  const tech=$('technique').value,kind=kinds[tech]||'print',art=canvas.classList.contains('artwork-editable');
  const final=copy();let blank=null;if(!art){window.reynasBlank=true;window.reynasRedraw();blank=copy();window.reynasBlank=false;window.reynasRedraw()}
  const pr=press.getBoundingClientRect(),cr=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  fx.width=Math.round(pr.width*dpr);fx.height=Math.round(pr.height*dpr);fx.style.display='block';canvas.style.visibility='hidden';
  const S={r:{x:cr.left-pr.left,y:cr.top-pr.top,w:cr.width,h:cr.height},final,blank,ink:$('foreground').value,hot:tech==='deboss'&&$('material').value==='leather',gold:tech!=='foilSilver',W:pr.width,H:pr.height};
  const dur=durations[kind],start=performance.now();on=true;
  toolBefore=q('.rail button.on span')?.textContent||'';$('tool-name').textContent=$('technique').selectedOptions[0]?.textContent||'';
  const cy=$('cycle');cy.textContent=String(Number(cy.textContent)+1).padStart(4,'0');gauges.classList.add('busy');stateEl.textContent='Hat çalışıyor';
  (function frame(now){if(!on)return;const t=clamp((now-start)/dur);fc.setTransform(dpr,0,0,dpr,0,0);fc.clearRect(0,0,S.W,S.H);fc.save();fc.beginPath();fc.rect(0,43,S.W,S.H-43);fc.clip();draws[kind](fc,t,S);fc.restore();if(t<1)raf=requestAnimationFrame(frame);else stop()})(start);
 }
 function base(c,S,img,dy=0){const r=S.r;if(!img)return;c.save();c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=22;c.shadowOffsetX=8;c.shadowOffsetY=16;c.drawImage(img,r.x,r.y+dy,r.w,r.h);c.restore()}
 function reveal(c,S,x,y,w,h){if(w<=0||h<=0)return;const r=S.r;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(S.final,r.x,r.y,r.w,r.h);c.restore()}
 function onLabel(c,S,fn){const r=S.r;c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();c.globalCompositeOperation='source-atop';fn();c.restore()}
 function steel(c,x,y,w,h){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#4a4c45');g.addColorStop(.5,'#2c2e29');g.addColorStop(1,'#1c1d1a');c.fillStyle=g;c.fillRect(x,y,w,h);c.fillStyle='#f3d829';c.fillRect(x,y+h-4,w,4)}
 function puff(c,x,y,age,size=1){if(age<=0||age>=1)return;c.beginPath();c.arc(x+Math.sin(age*5+x)*6,y-age*70,(7+age*30)*size,0,7);c.fillStyle=`rgba(210,205,195,${.17*(1-age)})`;c.fill()}
 const hash=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x)};
 const draws={
  /* Serigrafi: çerçeve iner, rakle mürekkebi elekten geçirir, çerçeve kalkar */
  screen(c,t,S){const r=S.r,m=30,down=eo(seg(t,0,.2)),up=eio(seg(t,.78,1)),p=eio(seg(t,.24,.72)),F={x:r.x-m,y:r.y-m,w:r.w+m*2,h:r.h+m*2},oy=-(1-down)*46-up*60,a=down*(1-up);
   base(c,S,S.blank);reveal(c,S,r.x,r.y,r.w*p,r.h);
   if(up>0)onLabel(c,S,()=>{const g=c.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);g.addColorStop(.3,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${.22*(1-up)})`);g.addColorStop(.7,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(r.x,r.y,r.w,r.h)});
   if(a<=0)return;c.save();c.globalAlpha=a;c.translate(0,oy);
   c.fillStyle='rgba(243,236,205,.13)';c.fillRect(F.x,F.y,F.w,F.h);c.strokeStyle='rgba(255,255,255,.10)';c.lineWidth=1;c.beginPath();for(let x=F.x;x<F.x+F.w;x+=5){c.moveTo(x,F.y);c.lineTo(x,F.y+F.h)}for(let y=F.y;y<F.y+F.h;y+=5){c.moveTo(F.x,y);c.lineTo(F.x+F.w,y)}c.stroke();
   const sx=F.x+10+p*(F.w-20);c.fillStyle=S.ink;c.globalAlpha=a*.2;c.fillRect(F.x,F.y,sx-F.x,F.h);c.globalAlpha=a;
   c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=18;c.shadowOffsetY=10;c.strokeStyle='#c9c4b6';c.lineWidth=14;c.strokeRect(F.x,F.y,F.w,F.h);c.shadowColor='transparent';c.strokeStyle='#8d897c';c.lineWidth=2;c.strokeRect(F.x-7,F.y-7,F.w+14,F.h+14);
   if(t>.2&&t<.8){c.fillStyle=S.ink;c.beginPath();c.roundRect(sx+5,F.y+10,9,F.h-20,5);c.fill();c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=14;c.shadowOffsetX=-6;c.fillStyle='#1b1b1a';c.fillRect(sx-1,F.y-6,6,F.h+12);const g=c.createLinearGradient(sx-18,0,sx,0);g.addColorStop(0,'#b88b4e');g.addColorStop(1,'#e2bb7c');c.fillStyle=g;c.fillRect(sx-17,F.y-14,16,F.h+28)}
   c.restore()},
  /* Düz baskı: baskı kafası şerit şerit geçer */
  print(c,t,S){const r=S.r,n=Math.max(5,Math.round(r.h/46)),bh=r.h/n,p=seg(t,.05,.93)*n,i=Math.min(n-1,Math.floor(p)),f=p>=n?1:eio(p-i),ltr=i%2===0;
   base(c,S,S.blank);reveal(c,S,r.x,r.y,r.w,bh*i);if(ltr)reveal(c,S,r.x,r.y+bh*i,r.w*f,bh);else reveal(c,S,r.x+r.w*(1-f),r.y+bh*i,r.w*f,bh);
   const a=Math.min(seg(t,0,.05),1-seg(t,.94,1));if(a<=0)return;const hx=ltr?r.x+r.w*f:r.x+r.w*(1-f),ry=r.y+bh*i-12;c.save();c.globalAlpha=a*.55;
   c.fillStyle=S.ink;c.fillRect(hx-2,r.y+bh*i,4,bh);c.globalAlpha=a;
   c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=12;c.shadowOffsetY=8;c.fillStyle='#3a3c37';c.fillRect(r.x-34,ry,r.w+68,8);c.fillStyle='#22231f';c.fillRect(r.x-40,ry-6,10,20);c.fillRect(r.x+r.w+30,ry-6,10,20);
   steel(c,hx-20,ry-10,40,26);c.restore()},
  /* Lazer / yakma: ışın satır satır tarar, iz kor gibi parlar, duman yükselir */
  laser(c,t,S){const r=S.r,n=Math.max(16,Math.round(r.h/8)),rh=r.h/n,at=tt=>{const p=seg(tt,.05,.9)*n,i=Math.min(n-1,Math.floor(p)),f=p>=n?1:p-i,ltr=i%2===0;return{i,f,ltr,x:ltr?r.x+r.w*f:r.x+r.w*(1-f),y:r.y+rh*(i+.5)}},d=at(t);
   base(c,S,S.blank);reveal(c,S,r.x,r.y,r.w,rh*d.i);if(d.ltr)reveal(c,S,r.x,r.y+rh*d.i,r.w*d.f,rh);else reveal(c,S,d.x,r.y+rh*d.i,r.w*d.f,rh);
   const live=t>.05&&t<.9,cool=1-seg(t,.9,1);
   onLabel(c,S,()=>{const y0=Math.max(r.y,d.y-rh*7),g=c.createLinearGradient(0,y0,0,d.y+rh);g.addColorStop(0,'rgba(255,110,20,0)');g.addColorStop(1,`rgba(255,120,24,${.42*cool})`);c.fillStyle=g;c.fillRect(r.x,y0,r.w,d.y+rh-y0)});
   for(let k=0;k<26;k++){const tk=.05+k/26*.85;if(t>tk){const o=at(tk);puff(c,o.x,o.y,(t-tk)/.3)}}
   if(!live)return;const hx=r.x+r.w/2,hy=64;c.save();c.globalCompositeOperation='lighter';
   c.strokeStyle='rgba(255,70,30,.55)';c.lineWidth=2.2;c.shadowColor='#ff3b1f';c.shadowBlur=14;c.beginPath();c.moveTo(hx,hy);c.lineTo(d.x,d.y);c.stroke();
   const g=c.createRadialGradient(d.x,d.y,0,d.x,d.y,22);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(.25,'rgba(255,190,90,.9)');g.addColorStop(1,'rgba(255,80,20,0)');c.fillStyle=g;c.beginPath();c.arc(d.x,d.y,22,0,7);c.fill();
   c.shadowBlur=0;for(let k=0;k<9;k++){const life=(t*46+hash(k))%1,ang=hash(k+d.i*.37)*6.28,dist=6+life*30;c.fillStyle=`rgba(255,${150+hash(k)*90|0},60,${1-life})`;c.beginPath();c.arc(d.x+Math.cos(ang)*dist,d.y+Math.sin(ang)*dist-life*8,(1-life)*2.4,0,7);c.fill()}
   c.restore();c.save();steel(c,hx-26,hy-18,52,24);c.fillStyle='#ff4b2b';c.beginPath();c.arc(hx,hy+6,4,0,7);c.fill();c.restore()},
  /* Varak: folyo serilir, sıcak kalıp basar, folyo soyulur, yüzey parlar */
  foil(c,t,S){const r=S.r,m=16,lay=eo(seg(t,0,.22)),down=eio(seg(t,.25,.4)),up=eio(seg(t,.52,.66)),peel=eio(seg(t,.64,.9)),sh=seg(t,.84,1),x0=r.x-40,L=r.w+80,cols=S.gold?['#7a5417','#f6dd9b','#b88a36','#ffefc0','#8a6220']:['#5d6166','#f4f5f6','#9aa0a5','#ffffff','#6b7075'];
   base(c,S,S.blank);reveal(c,S,r.x,r.y,Math.min(r.w,Math.max(0,x0+peel*L-r.x)),r.h);
   if(sh>0)onLabel(c,S,()=>{const bx=r.x-r.w*.4+sh*r.w*1.8,g=c.createLinearGradient(bx-70,r.y,bx+70,r.y+r.h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,250,225,${.5*Math.sin(Math.PI*sh)})`);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(r.x,r.y,r.w,r.h)});
   const fs=x0+peel*L,fe=x0+lay*L;if(fe>fs&&peel<1){c.save();c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=12;c.shadowOffsetY=6;const g=c.createLinearGradient(x0,r.y,x0+L,r.y+r.h);cols.forEach((col,i)=>g.addColorStop(i/(cols.length-1),col));c.fillStyle=g;c.fillRect(fs,r.y-m,fe-fs,r.h+m*2);c.shadowColor='transparent';
     c.globalAlpha=.16;c.fillStyle='#fff';for(let x=x0;x<fe;x+=34){const a=Math.max(fs,x),w=Math.min(x+12,fe)-a;if(w>0)c.fillRect(a,r.y-m,w,r.h+m*2)}c.globalAlpha=1;
     if(peel>0){const g2=c.createLinearGradient(fs-16,0,fs+10,0);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(.6,cols[1]);g2.addColorStop(1,cols[0]);c.fillStyle=g2;c.fillRect(fs-16,r.y-m-4,26,r.h+m*2+8)}
     const roll=x=>{const g3=c.createLinearGradient(x-9,0,x+9,0);g3.addColorStop(0,'#17181a');g3.addColorStop(.45,'#6a6d66');g3.addColorStop(1,'#1d1e1b');c.fillStyle=g3;c.beginPath();c.roundRect(x-9,r.y-m-12,18,r.h+m*2+24,9);c.fill()};roll(fe);if(peel===0)roll(x0-4);c.restore()}
   const dn=down-up;if(dn>0){const dy=-(1-dn)*(r.h+110),D={x:r.x-m,y:r.y-m+dy,w:r.w+m*2,h:r.h+m*2};c.save();c.fillStyle='#3a3c37';c.fillRect(r.x+r.w/2-26,40,52,Math.max(0,D.y-40));c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=26;c.shadowOffsetY=14;steel(c,D.x,D.y,D.w,D.h);c.shadowColor='transparent';
     const heat=c.createLinearGradient(0,D.y+D.h-26,0,D.y+D.h+18);heat.addColorStop(0,'rgba(255,120,30,0)');heat.addColorStop(.6,`rgba(255,130,40,${.75*dn})`);heat.addColorStop(1,'rgba(255,90,20,0)');c.globalCompositeOperation='lighter';c.fillStyle=heat;c.fillRect(D.x-10,D.y+D.h-26,D.w+20,44);c.restore()}},
  /* Kabartma / çökertme / kalıp: pres iner, basar, kalkar */
  press(c,t,S){const r=S.r,m=18,down=eio(seg(t,.08,.36)),up=eio(seg(t,.58,.86)),dn=down-up,hit=seg(t,.36,.5),shake=t>.36&&t<.5?Math.sin(hit*28)*3*(1-hit):0,done=t>.47;
   base(c,S,done?S.final:(S.blank||null),shake);
   if(S.hot&&t>.58)for(let k=0;k<10;k++)puff(c,r.x+hash(k)*r.w,r.y+hash(k+9)*r.h*.3,(t-.58-k*.012)/.36,1.2);
   if(up>0&&up<1)onLabel(c,S,()=>{c.fillStyle=`rgba(255,255,255,${.12*(1-up)})`;c.fillRect(r.x,r.y,r.w,r.h)});
   if(dn<=0)return;const dy=-(1-dn)*(r.h+120)+shake,D={x:r.x-m,y:r.y-m+dy,w:r.w+m*2,h:r.h+m*2};
   c.save();c.fillStyle='#3a3c37';c.fillRect(r.x+r.w/2-30,40,60,Math.max(0,D.y-40));c.shadowColor='rgba(0,0,0,.7)';c.shadowBlur=28;c.shadowOffsetY=16;steel(c,D.x,D.y,D.w,D.h);c.shadowColor='transparent';
   c.fillStyle='#151614aa';for(const [bx,by] of [[D.x+12,D.y+12],[D.x+D.w-12,D.y+12],[D.x+12,D.y+D.h-16],[D.x+D.w-12,D.y+D.h-16]]){c.beginPath();c.arc(bx,by,4,0,7);c.fill()}
   if(S.hot){const heat=c.createLinearGradient(0,D.y+D.h-24,0,D.y+D.h+16);heat.addColorStop(0,'rgba(255,120,30,0)');heat.addColorStop(.6,`rgba(255,120,30,${.8*dn})`);heat.addColorStop(1,'rgba(255,90,20,0)');c.globalCompositeOperation='lighter';c.fillStyle=heat;c.fillRect(D.x-8,D.y+D.h-24,D.w+16,40)}
   c.restore()},
  /* Dokuma: çözgü iplikleri, mekik ve tarak */
  weave(c,t,S){const r=S.r,p=seg(t,.04,.94),y=r.y+r.h*p,a=Math.min(seg(t,0,.05),1-seg(t,.94,1));
   base(c,S,S.blank);reveal(c,S,r.x,r.y,r.w,r.h*p);if(a<=0)return;c.save();c.globalAlpha=a;
   c.strokeStyle='rgba(243,241,235,.42)';c.lineWidth=1;c.beginPath();for(let x=r.x+3;x<r.x+r.w;x+=6){c.moveTo(x,y);c.lineTo(x,r.y+r.h+26)}c.stroke();
   const s=.5+.5*Math.sin(t*Math.PI*2*11),sx=r.x-10+s*(r.w+20);c.strokeStyle=S.ink;c.lineWidth=1.6;c.beginPath();c.moveTo(r.x-12,y+5);c.lineTo(sx,y+5);c.stroke();
   c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=10;c.shadowOffsetY=6;const g=c.createLinearGradient(r.x-22,0,r.x+r.w+22,0);g.addColorStop(0,'#6f726a');g.addColorStop(.5,'#c9ccc2');g.addColorStop(1,'#6f726a');c.fillStyle=g;c.fillRect(r.x-22,y-5,r.w+44,7);
   c.fillStyle='#d8b06c';c.beginPath();c.moveTo(sx-28,y+5);c.quadraticCurveTo(sx,y-3,sx+28,y+5);c.quadraticCurveTo(sx,y+13,sx-28,y+5);c.fill();c.fillStyle='#7a5a2c';c.fillRect(sx-9,y+3,18,4);c.restore()}
 };
 window.reynasFx={produce,stop,get on(){return on}};
 addEventListener('resize',stop);
})();
