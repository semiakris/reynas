/* v11 — Reynas Factory: istasyonlar, gantry/pres hareketleri, mm cetvelleri, iş emri. Çizim motoruna (designer.js) dokunmaz. */
(()=>{
 const $=id=>document.getElementById(id),q=s=>document.querySelector(s);
 const machine=q('.machine'),press=q('.press'),stage=q('.canvas-stage'),canvas=$('label-canvas'),gauges=q('.gauges'),stateEl=$('hall-state');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const order=['01','02','03','04','05','ship'],tools={"01":'Yazı',"02":'Logo',"03":'Kesim',"04":'Baskı',"05":'Yerleşim',ship:'Kontrol'};
 let current='01',cycles=0,busyTimer;

 /* İstasyonlar */
 function go(id,animate=true){
  current=id;document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('on',p.dataset.panel===id));
  document.querySelectorAll('.rail button').forEach(b=>{const i=order.indexOf(b.dataset.go),c=order.indexOf(id);b.classList.toggle('on',i===c);b.classList.toggle('done',i<c);b.setAttribute('aria-current',i===c?'step':'false')});
  $('tool-name').textContent=tools[id];$('prev-station').disabled=id===order[0];$('next-station').hidden=id==='ship';
  if(id==='ship')ticket();
  F.stop();if(animate){conveyor();busy('Hat çalışıyor',650)}
 }
 document.querySelectorAll('.rail button').forEach(b=>b.onclick=()=>go(b.dataset.go));
 $('prev-station').onclick=()=>go(order[Math.max(0,order.indexOf(current)-1)]);
 $('next-station').onclick=()=>{go(order[Math.min(order.length-1,order.indexOf(current)+1)]);if(innerWidth<=1000)q('.rail').scrollIntoView({block:'start'})};

 /* Hat durumu */
 function busy(text,ms){cycles++;$('cycle').textContent=String(cycles).padStart(4,'0');gauges.classList.add('busy');stateEl.textContent=text;clearTimeout(busyTimer);busyTimer=setTimeout(()=>{gauges.classList.remove('busy');stateEl.textContent='Hat hazır'},ms)}
 function flag(name,ms){machine.classList.remove(name);void machine.offsetWidth;machine.classList.add(name);setTimeout(()=>machine.classList.remove(name),ms)}
 function conveyor(){if(!reduce.matches)flag('swapping',620)}


 const F=window.reynasFx||{produce(){},stop(){},on:false},swapIds=new Set(['material','shape']);
 document.addEventListener('input',e=>{if(mixing)return;if(e.target.id==='technique')requestAnimationFrame(F.produce);else if(F.on&&e.target.id)F.stop();if(swapIds.has(e.target.id)){conveyor();busy('Hat çalışıyor',650)}},true);
 document.addEventListener('change',e=>{if(e.target.id==='artwork'||e.target.id==='logo'){conveyor();busy('Hat çalışıyor',650)}});
 /* Karıştır: hazır kurallardan seçilmiş uyumlu kombinasyonlar. Yazı ve logo korunur. */
 const mixes=[
  {material:'leather',shape:'rounded',background:'#8a4f2b',foreground:'#2a1a12',technique:'deboss',font:'serif'},
  {material:'hangtag',shape:'rectangle',background:'#171715',foreground:'#d7b56a',technique:'foilGold',font:'Cormorant Garamond'},
  {material:'woven',shape:'rectangle',background:'#191a17',foreground:'#eee9dd',technique:'weave',font:'sans'},
  {material:'jacron',shape:'rectangle',background:'#bc9360',foreground:'#33261a',technique:'tram',font:'Oswald'},
  {material:'silicone',shape:'rounded',background:'#f3d829',foreground:'#171715',technique:'molded',font:'sans'},
  {material:'metallic',shape:'rounded',background:'#b9b4a8',foreground:'#1f1f1c',technique:'laser',font:'mono'},
  {material:'hangtag',shape:'rectangle',background:'#eee6d5',foreground:'#7a1f1f',technique:'emboss',font:'serif'},
  {material:'leather',shape:'rectangle',background:'#1f2a24',foreground:'#d8c9a3',technique:'foilGold',font:'Lora'},
  {material:'woven',shape:'rectangle',background:'#7a1f1f',foreground:'#f3ead7',technique:'weave',font:'serif'},
  {material:'jacron',shape:'rounded',background:'#d9c4a0',foreground:'#171715',technique:'screen',font:'sans'}];
 const mixFields=['material','shape','width','height','background','foreground','technique','font','text-size'];let mixIndex=Math.floor(Math.random()*mixes.length),before=null,mixing=false;
 const fire=el=>el.dispatchEvent(new Event('input',{bubbles:true}));
 async function applyMix(v){mixing=true;$('material').value=v.material;fire($('material'));for(const id of mixFields){if(id==='material'||id==='font'||v[id]===undefined)continue;$(id).value=v[id];fire($(id))}try{await window.labelFontPicker.choose(v.font)}catch{}mixing=false;queue()}
 $('shuffle').onclick=async()=>{if(mixing)return;F.stop();if(canvas.classList.contains('artwork-editable'))$('remove-artwork').click();before=Object.fromEntries(mixFields.map(id=>[id,$(id).value]));mixIndex=(mixIndex+1)%mixes.length;conveyor();busy('Hat çalışıyor',800);q('.shuffle-btn').classList.remove('spin');void q('.shuffle-btn').offsetWidth;q('.shuffle-btn').classList.add('spin');await applyMix(mixes[mixIndex]);$('shuffle-undo').hidden=false;setTimeout(F.produce,650)};
 $('shuffle-undo').onclick=async()=>{if(!before||mixing)return;conveyor();busy('Hat çalışıyor',800);await applyMix(before);before=null;$('shuffle-undo').hidden=true};
 $('download').addEventListener('click',()=>{F.stop();busy('Çıktı alınıyor',1000);if(!reduce.matches){flag('pressing',420);flag('printing',1000)}});
 $('download-brief').addEventListener('click',()=>{busy('Çıktı alınıyor',700);if(!reduce.matches)flag('printing',700)});

 /* mm cetvelleri */
 const rx=q('.ruler-x'),ry=q('.ruler-y');
 function rulers(){
  const art=canvas.classList.contains('artwork-editable'),w=Number($('width').value),circle=$('shape').value==='circle',h=circle?w:Number($('height').value);
  if(art||!w||!h||!canvas.offsetWidth){rx.hidden=ry.hidden=true;return}rx.hidden=ry.hidden=false;
  const cw=canvas.offsetWidth,ch=canvas.offsetHeight,l=canvas.offsetLeft,tp=canvas.offsetTop;
  Object.assign(rx.style,{left:l+'px',top:tp-22+'px',width:cw+'px'});rx.style.setProperty('--mm',cw/w+'px');rx.firstElementChild.textContent=w+' mm';
  Object.assign(ry.style,{left:l-22+'px',top:tp+'px',height:ch+'px'});ry.style.setProperty('--mm',ch/h+'px');ry.firstElementChild.textContent=h+' mm';
 }
 let raf;const queue=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{rulers();if(current==='ship')ticket()})};
 document.addEventListener('input',queue);document.addEventListener('change',queue);document.addEventListener('click',()=>setTimeout(queue,60));document.addEventListener('fontpreviewchange',queue);addEventListener('resize',queue);
 new MutationObserver(queue).observe(canvas,{attributes:true,attributeFilter:['width','height','class']});

 /* İş emri */
 const job='RN-'+new Date().toISOString().slice(2,10).replace(/-/g,'')+'-'+String(Math.floor(Math.random()*9000)+1000);$('job-no').textContent=job;
 function ticket(){
  const rows=[['Malzeme',$('material').selectedOptions[0].textContent],['Ölçü',$('dimension').textContent],['Uygulama',$('technique').selectedOptions[0]?.textContent||''],['Marka adı',$('brand-name').value||'—'],['Yazı karakteri',window.labelFontPicker?.name||''],['Renkler',null]];
  const dl=$('ticket-rows');dl.replaceChildren();
  for(const [k,v] of rows){const d=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;if(v===null){for(const id of ['background','foreground']){const c=document.createElement('span');c.className='guide-chip';c.style.backgroundColor=$(id).value;dd.append(c)}}else{const span=document.createElement('span');span.className=k==='Marka adı'?'notranslate':'';span.textContent=v;dd.append(span)}d.append(dt,dd);dl.append(d)}
 }
 new MutationObserver(()=>{if(current==='ship')ticket()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

 /* Siteden sipariş: tasarım görseli ve seçimler portala gider */
 const of=$('order-form');if(of)of.onsubmit=async e=>{e.preventDefault();const st=$('order-status'),B=window.ReynasBridge,d=new FormData(of),btn=of.querySelector('button');
  if(!window.labelFontPicker.ready&&!canvas.classList.contains('artwork-editable')){st.textContent='Font yüklenemedi; önizlemede geçici sistem fontu gösteriliyor. Yeniden deneyin veya başka font seçin. PNG indirmek için fontun yüklenmesi gerekir.';return}
  F.stop();const c=document.createElement('canvas'),k=Math.min(1,1000/Math.max(canvas.width,canvas.height));c.width=Math.round(canvas.width*k)+60;c.height=Math.round(canvas.height*k)+60;const g=c.getContext('2d');g.fillStyle='#eae5da';g.fillRect(0,0,c.width,c.height);g.drawImage(canvas,30,30,c.width-60,c.height-60);
  const kinds={hangtag:'hangtag',woven:'dokuma',silicone:'silikon',metallic:'metal',leather:'deri',jacron:'jakron'},spec=[$('material').selectedOptions[0].textContent,$('dimension').textContent,$('technique').selectedOptions[0]?.textContent,window.labelFontPicker.name,$('brand-name').value,d.get('note')].filter(Boolean).join(' · ');
  btn.disabled=true;st.textContent='';
  try{const r=B?await B.send({type:'siparis',name:d.get('name'),company:d.get('name'),email:d.get('email'),phone:d.get('phone'),qty:Number(d.get('qty'))||0,kind:kinds[$('material').value],message:spec},c.toDataURL('image/jpeg',.85)):{ok:false};
   if(r.ok){st.textContent='Siparişiniz bize ulaştı. En kısa sürede dönüş yapacağız.';of.reset()}else if(r.demo){st.textContent='Sipariş bağlantısı henüz kurulmadı. Tasarımınızı indirip bizimle paylaşabilirsiniz.'}else st.textContent='Sipariş gönderilemedi. Lütfen telefonla ulaşın.'}
  catch{st.textContent='Sipariş gönderilemedi. Lütfen telefonla ulaşın.'}finally{btn.disabled=false}};
 const menu=q('.menu'),nav=q('#nav');if(menu)menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)};
 $('replay').onclick=F.produce;go('01',false);queue();setTimeout(()=>{if(!F.on)F.produce()},900);
})();
