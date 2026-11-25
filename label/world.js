/* İstanbul merkezli uzaklık haritası + sosyal bağlantılar */
(()=>{
 const SOCIAL={linkedin:''}; /* LinkedIn sayfasının adresi buraya yazılınca bağlantı görünür */
 document.querySelectorAll('[data-social]').forEach(a=>{const u=SOCIAL[a.dataset.social];if(u){a.href=u;a.hidden=false}});

 const radar=document.querySelector('.radar');if(!radar)return;
 const IST=[41.01,28.98],R=6371,rad=x=>x*Math.PI/180;
 const C=[['BG','eu',42.70,23.32],['GR','eu',37.98,23.73],['NL','eu',52.37,4.90],['NO','eu',59.91,10.75],['IT','eu',45.46,9.19],['ES','eu',40.42,-3.70],['DK','eu',55.68,12.57],['FR','eu',48.86,2.35],
  ['CN','as',31.23,121.47],['HK','as',22.32,114.17],['PK','as',24.86,67.00],['BD','as',23.81,90.41],['UZ','as',41.30,69.24],['RU','as',55.76,37.62],['IN','as',28.61,77.21],
  ['EG','af',30.04,31.24],['MU','af',-20.16,57.50],['MA','af',33.57,-7.59],['MG','af',-18.88,47.51],['US','am',40.71,-74.00],['MX','am',19.43,-99.13]];
 /* ziyaretçinin saat diliminden yaklaşık konumu */
 const TZ={'Europe/Istanbul':['İstanbul',41.01,28.98],'Europe/London':['London',51.51,-.13],'Europe/Paris':['Paris',48.86,2.35],'Europe/Berlin':['Berlin',52.52,13.40],'Europe/Madrid':['Madrid',40.42,-3.70],'Europe/Rome':['Roma',41.90,12.50],'Europe/Amsterdam':['Amsterdam',52.37,4.90],'Europe/Brussels':['Bruxelles',50.85,4.35],'Europe/Vienna':['Wien',48.21,16.37],'Europe/Zurich':['Zürich',47.38,8.54],'Europe/Stockholm':['Stockholm',59.33,18.07],'Europe/Oslo':['Oslo',59.91,10.75],'Europe/Copenhagen':['København',55.68,12.57],'Europe/Helsinki':['Helsinki',60.17,24.94],'Europe/Warsaw':['Warszawa',52.23,21.01],'Europe/Prague':['Praha',50.08,14.44],'Europe/Budapest':['Budapest',47.50,19.04],'Europe/Bucharest':['București',44.43,26.10],'Europe/Sofia':['Sofia',42.70,23.32],'Europe/Athens':['Athens',37.98,23.73],'Europe/Lisbon':['Lisboa',38.72,-9.14],'Europe/Dublin':['Dublin',53.35,-6.26],'Europe/Moscow':['Moskva',55.76,37.62],'Europe/Kyiv':['Kyiv',50.45,30.52],'Asia/Dubai':['Dubai',25.20,55.27],'Asia/Riyadh':['Riyadh',24.71,46.68],'Asia/Tehran':['Tehran',35.69,51.39],'Asia/Karachi':['Karachi',24.86,67.00],'Asia/Kolkata':['Delhi',28.61,77.21],'Asia/Calcutta':['Delhi',28.61,77.21],'Asia/Dhaka':['Dhaka',23.81,90.41],'Asia/Tashkent':['Tashkent',41.30,69.24],'Asia/Bangkok':['Bangkok',13.76,100.50],'Asia/Ho_Chi_Minh':['Ho Chi Minh',10.82,106.63],'Asia/Singapore':['Singapore',1.35,103.82],'Asia/Jakarta':['Jakarta',-6.21,106.85],'Asia/Hong_Kong':['Hong Kong',22.32,114.17],'Asia/Shanghai':['Shanghai',31.23,121.47],'Asia/Seoul':['Seoul',37.57,126.98],'Asia/Tokyo':['Tokyo',35.68,139.69],'Australia/Sydney':['Sydney',-33.87,151.21],'Australia/Melbourne':['Melbourne',-37.81,144.96],'Africa/Cairo':['Cairo',30.04,31.24],'Africa/Casablanca':['Casablanca',33.57,-7.59],'Africa/Tunis':['Tunis',36.81,10.18],'Africa/Lagos':['Lagos',6.52,3.38],'Africa/Johannesburg':['Johannesburg',-26.20,28.05],'Africa/Nairobi':['Nairobi',-1.29,36.82],'Indian/Mauritius':['Port Louis',-20.16,57.50],'Indian/Antananarivo':['Antananarivo',-18.88,47.51],'America/New_York':['New York',40.71,-74.00],'America/Toronto':['Toronto',43.65,-79.38],'America/Chicago':['Chicago',41.88,-87.63],'America/Denver':['Denver',39.74,-104.99],'America/Los_Angeles':['Los Angeles',34.05,-118.24],'America/Mexico_City':['Ciudad de México',19.43,-99.13],'America/Bogota':['Bogotá',4.71,-74.07],'America/Lima':['Lima',-12.05,-77.04],'America/Sao_Paulo':['São Paulo',-23.55,-46.63],'America/Argentina/Buenos_Aires':['Buenos Aires',-34.60,-58.38]};
 const geo=(la,lo)=>{const p1=rad(IST[0]),p2=rad(la),dl=rad(lo-IST[1]),a=Math.sin((p2-p1)/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2,d=2*R*Math.asin(Math.sqrt(a)),b=Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl));return[d,b]};
 const S=800,M=S/2,RMAX=350,scale=d=>RMAX*Math.pow(Math.min(d,12500)/12500,.52),xy=(d,b)=>[M+scale(d)*Math.sin(b),M-scale(d)*Math.cos(b)];
 const lang=()=>document.documentElement.lang||'tr',nf=()=>new Intl.NumberFormat(lang());
 const names=()=>{try{return new Intl.DisplayNames([lang()],{type:'region'})}catch{return{of:c=>c}}};
 let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch{}
 const me=TZ[tz]&&tz!=='Europe/Istanbul'?TZ[tz]:null;
 function draw(){
  const dn=names(),f=nf();let s=`<svg viewBox="0 0 ${S} ${S}" aria-hidden="true">`;
  for(const km of[1000,2500,5000,10000]){const r=scale(km);s+=`<circle class="ring" cx="${M}" cy="${M}" r="${r.toFixed(1)}"/><text class="ringl" x="${M+4}" y="${(M-r-5).toFixed(1)}">${f.format(km)} km</text>`}
  C.forEach(([code,reg,la,lo],i)=>{const[d,b]=geo(la,lo),[x,y]=xy(d,b),len=scale(d).toFixed(1),right=code==='MG'?false:x>=M,tx=x+(right?9:-9);
   s+=`<g class="c" data-r="${reg}"><line class="ray" style="--len:${len};transition-delay:${i*45}ms" x1="${M}" y1="${M}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/><circle class="pt" style="transition-delay:${500+i*45}ms" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/><text class="lb" style="transition-delay:${500+i*45}ms" x="${tx.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="${right?'start':'end'}">${scale(d)<95?code:dn.of(code)}</text></g>`});
  if(me){const[d,b]=geo(me[1],me[2]),[x,y]=xy(d,b),right=x>=M;s+=`<g class="me"><line class="ray" x1="${M}" y1="${M}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/><circle class="pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6"/><circle class="pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" style="fill:none;stroke:#f3f1eb;stroke-width:1"/></g>`}
  s+=`<circle class="hub" cx="${M}" cy="${M}" r="9"/><text class="hubl" x="${M+16}" y="${M+30}">İSTANBUL</text></svg>`;radar.innerHTML=s;
  document.querySelectorAll('.regions [data-c]').forEach(p=>p.textContent=p.dataset.c.split(' ').map(c=>dn.of(c)).sort((a,b)=>a.localeCompare(b,lang())).join(' · '));
  const you=document.querySelector('.globe .you');if(me&&you){const[d]=geo(me[1],me[2]);you.hidden=false;you.querySelector('[data-you-city]').textContent=me[0];you.querySelector('[data-you-km]').textContent=f.format(Math.round(d/10)*10)+' km'}
 }
 draw();
 const tick=()=>{const t=document.querySelector('[data-you-time]');if(t)try{t.textContent=new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}).format(new Date)}catch{}};tick();setInterval(tick,30000);
 new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 if('IntersectionObserver' in window)new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){radar.classList.add('on');o.disconnect()}},{threshold:.3}).observe(radar);else radar.classList.add('on');
 document.querySelectorAll('.regions li').forEach(li=>{li.onmouseenter=li.onfocus=()=>radar.dataset.hot=li.dataset.r;li.onmouseleave=li.onblur=()=>delete radar.dataset.hot;li.tabIndex=0});
})();
