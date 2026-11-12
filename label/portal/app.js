/* Reynas Portal — arayüz */
(()=>{
 const S=window.Store,$=s=>document.querySelector(s);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=n=>Number(n||0).toLocaleString('tr-TR');
 const dstr=d=>d?new Date(d).toLocaleDateString('tr-TR',{day:'numeric',month:'long'}):'—';
 const tstr=d=>new Date(d).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
 const daysLeft=d=>Math.round((new Date(d+'T00:00')-new Date(S.day()+'T00:00'))/864e5);
 const ICON={more:'M5 12h.01M12 12h.01M19 12h.01',samples:'M4 5h7v14H4zM13 5h7v14h-7z',panel:'M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z',jobs:'M9 3h6v2h4v16H5V5h4zm-1 8 3 3 5-6',calendar:'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',stock:'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',customers:'M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8 0a3 3 0 1 0 0-6M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6m2-6c2.8 0 5 2.2 5 5'};
 const mask=p=>`--m:url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'><path d='${p}'/></svg>`)}")`;
 let D={profiles:[],customers:[],orders:[],jobs:[],events:[],stock_items:[],stock_moves:[],requests:[],issues:[],reminders:[],outsourcing:[],samples:[],notes:[]},tab='',query='',jobFilter='acik';
 const person=id=>(D.profiles.find(p=>p.id===id)||{}).full_name||'—';
 const customer=id=>D.customers.find(c=>c.id===id);
 const toast=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2600)};
 async function run(fn,okMsg){try{await fn();D=await S.load();render();if(okMsg)toast(okMsg)}catch(e){toast(e.message||'İşlem yapılamadı')}}

 /* ---- alt sayfa ve form ---- */
 function sheet(title,html){$('#sheet-title').textContent=title;$('#sheet-body').innerHTML=html;$('#sheet').hidden=false;$('.sheet-card').scrollTop=0}
 const closeSheet=()=>{$('#sheet').hidden=true;$('#sheet-body').innerHTML=''};
 $('#sheet-close').onclick=closeSheet;$('#sheet').addEventListener('click',e=>{if(e.target.id==='sheet')closeSheet()});
 function field(f){
  const v=f.value??'';
  if(f.type==='select')return `<label>${esc(f.label)}<select name="${f.name}" ${f.required?'required':''}>${f.options.map(([k,l])=>`<option value="${esc(k)}" ${String(k)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
  if(f.type==='textarea')return `<label>${esc(f.label)}<textarea name="${f.name}">${esc(v)}</textarea></label>`;
  if(f.type==='checks')return `<div><p class="sec">${esc(f.label)}</p><div class="checks">${f.options.map(([k,l])=>`<label><input type="checkbox" name="${f.name}" value="${esc(k)}" ${(v||[]).includes(k)?'checked':''}>${esc(l)}</label>`).join('')}</div></div>`;
  return `<label>${esc(f.label)}<input name="${f.name}" type="${f.type||'text'}" value="${esc(v)}" ${f.required?'required':''} ${f.step?`step="${f.step}"`:''} ${f.type==='number'?'inputmode="decimal" min="0"':''}></label>`;
 }
 function form(title,fields,onSave,extra=''){
  sheet(title,`<form id="f" style="display:grid;gap:12px">${fields.map(field).join('')}<button class="btn solid" type="submit">Kaydet</button></form>${extra}`);
  $('#f').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),o={};
   for(const f of fields){if(f.type==='checks')o[f.name]=fd.getAll(f.name);else if(f.type==='number')o[f.name]=Number(fd.get(f.name)||0);else o[f.name]=String(fd.get(f.name)??'').trim()}
   closeSheet();onSave(o)};
 }
 const staffOptions=()=>D.profiles.map(p=>[p.id,`${p.full_name} · ${S.dept(p.department)}`]);

 /* ---- sekmeler ---- */
 const TITLES={panel:'Panel',jobs:'İşler',calendar:'Takvim',stock:'Stok',customers:'Müşteriler',samples:'Numuneler',outs:'Dış üretim',mine:'Notlarım',more:'Daha'};
 function tabs(){
  const admin=S.isAdmin(),list=admin?['panel','jobs','calendar','stock','more']:['jobs','calendar','stock','samples','more'];
  const all=[...list,'customers','samples','outs','mine'];if(!all.includes(tab))tab=list[0];
  const alerts=admin?approvals().length+openIssues().length+dueOuts().length:0,mineDue=dueReminders().length;
  $('#tabs').innerHTML=list.map(k=>`<button type="button" data-tab="${k}" class="${k===tab||(k==='more'&&!list.includes(tab))?'on':''}"><i style='${mask(ICON[k])}'></i>${k==='jobs'&&!admin?'İşlerim':TITLES[k]}${(k==='panel'&&alerts)||(k==='more'&&mineDue)?`<span class="badge">${k==='panel'?alerts:mineDue}</span>`:''}</button>`).join('');
  $('#tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.tab));
  $('#view-title').textContent=tab==='jobs'&&!admin?'İşlerim':TITLES[tab];
  const p=S.me;$('#me').innerHTML=p.avatar?`<img src="${esc(p.avatar)}" alt="">`:esc((p.full_name||'?').trim()[0].toUpperCase());
  $('#add').hidden=!({jobs:admin,calendar:admin,stock:S.isStock(),customers:S.canAddCustomer(),samples:admin,outs:admin,mine:true}[tab]);
 }
 function go(t){tab=t;query='';render();scrollTo(0,0)}
 function render(){tabs();({panel,jobs,calendar,stock,customers,samples,outs,mine,more})[tab]()}
 $('#add').onclick=()=>({jobs:()=>editJob(),calendar:()=>editEvent(),stock:()=>editItem(),customers:()=>editCustomer(),samples:()=>editSample(),outs:()=>editOut(),mine:()=>addMine()})[tab]();

 /* ---- fotoğraf seçme: küçültüp yükler ---- */
 function pickPhoto(max=1000){return new Promise(res=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=()=>{const f=inp.files[0];if(!f)return res(null);const img=new Image,url=URL.createObjectURL(f);img.onload=async()=>{const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);try{res(await S.upload(c.toDataURL('image/jpeg',.74)))}catch(e){toast(e.message);res(null)}};img.onerror=()=>{toast('Görsel açılamadı');res(null)};img.src=url};inp.click()})}
 const photo=(src,alt)=>src?`<img class="ph" src="${esc(src)}" alt="${esc(alt||'')}" loading="lazy">`:'';

 /* ---- hesaplar ---- */
 const myJobs=()=>S.mine(D.jobs,S.me);
 const approvals=()=>[...D.jobs.filter(j=>j.status==='bitti').map(j=>({t:'job',x:j})),...D.stock_moves.filter(m=>!m.approved).map(m=>({t:'move',x:m})),...D.requests.filter(r=>r.status==='yeni').map(r=>({t:'req',x:r}))];
 const openIssues=()=>D.issues.filter(i=>i.status==='acik');
 const dueOuts=()=>D.outsourcing.filter(o=>o.status==='bekleniyor'&&o.promised_date&&daysLeft(o.promised_date)<=0);
 const dueReminders=()=>D.reminders.filter(r=>r.owner===S.me.id&&!r.done&&new Date(r.due_at)<=new Date());
 const remindersBlock=()=>{const l=dueReminders();return l.length?`<p class="sec">Hatırlatmalar</p>${l.map(r=>`<div class="card go"><h3>${esc(r.text)}</h3><p>${dstr(r.due_at)} ${tstr(r.due_at)}${r.by&&r.by!==r.owner?' · '+esc(person(r.by))+' ekledi':''}</p><div class="row"><button class="btn solid small" data-act="rem-done" data-id="${r.id}">Tamam</button><button class="btn ghost small" data-act="rem-snooze" data-id="${r.id}">Yarın tekrar hatırlat</button></div></div>`).join('')}`:''};
 const lowStock=()=>D.stock_items.filter(i=>i.qty<=i.min_qty);
 const shortFor=j=>S.need(j.kind,j.qty,D.stock_items).filter(n=>!n.ok);
 function visibleCustomers(){
  if(S.isAdmin()||S.canAddCustomer())return D.customers;
  const orderIds=new Set(myJobs().map(j=>j.order_id).filter(Boolean)),ids=new Set(D.orders.filter(o=>orderIds.has(o.id)).map(o=>o.customer_id));
  return D.customers.filter(c=>ids.has(c.id));
 }
 function needBlock(kind,qty){
  const n=S.need(kind,qty,D.stock_items);if(!n.length)return '';
  return `<div class="need">${n.map(x=>`<div class="${x.ok?'good':'bad'}"><span>${esc(x.item.name)}</span><span>${x.ok?'Yeterli':`${num(x.short)} ${esc(x.item.unit)} eksik`}</span></div>`).join('')}</div>`;
 }

 /* ---- PANEL (yönetici) ---- */
 function panel(){
  const ap=approvals(),late=D.jobs.filter(j=>j.status!=='onaylandi'&&j.due_date&&daysLeft(j.due_date)<0),low=lowStock(),today=D.events.filter(e=>e.starts_at.slice(0,10)===S.day()),iss=openIssues(),outs_=dueOuts();
  const tile=(n,l,t,f,al)=>`<button class="tile ${al&&n?'alert':''}" data-go="${t}" data-f="${f||''}"><b>${n}</b><span>${l}</span></button>`;
  $('#screen').innerHTML=`<div class="tiles">${tile(iss.length,'sorun bildirimi','panel','',1)}${tile(ap.length,'onayını bekleyen','panel','',1)}${tile(D.jobs.filter(j=>j.status==='bekliyor'||j.status==='devam').length,'açık iş','jobs','acik')}${tile(late.length,'geciken iş','jobs','geciken',1)}${tile(outs_.length,'dış üretim takibi','outs','',1)}${tile(low.length,'kritik stok','stock','',1)}</div>
   ${iss.length?`<p class="sec">Çalışanlardan gelen sorunlar</p>${iss.map(x=>{const j=D.jobs.find(k=>k.id===x.job_id),it=D.stock_items.find(k=>k.id===x.item_id);return `<div class="card warn"><h3>${esc(it?'Stok: '+it.name:j?j.title:'Sorun')}</h3><p>${esc(x.text)}</p><p>${esc(person(x.by))} · ${dstr(x.at)} ${tstr(x.at)}</p><button class="btn solid small" data-act="iss-ok" data-id="${x.id}">Çözüldü</button></div>`}).join('')}`:''}
   ${outs_.length?`<p class="sec">Takip et</p>${outs_.map(outCard).join('')}`:''}
   ${remindersBlock()}
   <p class="sec">Onayını bekleyenler</p>${ap.length?ap.map(a=>a.t==='job'?`<div class="card go"><h3>${esc(a.x.title)}</h3><p>İş bitti olarak işaretlendi · ${esc(person(a.x.done_by))}</p><div class="row"><button class="btn solid small" data-act="job-ok" data-id="${a.x.id}">Onayla</button><button class="btn ghost small" data-act="job-back" data-id="${a.x.id}">Geri gönder</button></div></div>`
    :a.t==='move'?(()=>{const it=D.stock_items.find(i=>i.id===a.x.item_id)||{};return `<div class="card go"><h3>${esc(S.moveType(a.x.type))}: ${num(a.x.qty)} ${esc(it.unit||'')}</h3><p>${esc(it.name||'')} · ${esc(person(a.x.by))}${a.x.note?' · '+esc(a.x.note):''}</p><div class="row"><button class="btn solid small" data-act="move-ok" data-id="${a.x.id}">Onayla</button><button class="btn ghost small" data-act="move-no" data-id="${a.x.id}">Reddet</button></div></div>`})()
    :`<div class="card go"><h3>${esc(a.x.company||a.x.name)}</h3><p>${a.x.type==='siparis'?'Siteden sipariş':'Siteden mesaj'} · ${esc(a.x.name||'')}${a.x.phone?' · '+esc(a.x.phone):''}${a.x.email?' · '+esc(a.x.email):''}</p>${a.x.qty?`<p>${num(a.x.qty)} adet${a.x.kind?' · '+esc(S.kind(a.x.kind)):''}</p>`:''}<p>${esc(a.x.message||'')}</p>${photo(a.x.image,'Müşterinin tasarımı')}<div class="row">${a.x.type==='siparis'?`<button class="btn solid small" data-act="req-order" data-id="${a.x.id}">Siparişe çevir</button>`:''}<button class="btn ${a.x.type==='siparis'?'ghost':'solid'} small" data-act="req-cal" data-id="${a.x.id}">Takvime ekle</button><button class="btn ghost small" data-act="req-read" data-id="${a.x.id}">Kapat</button></div></div>`).join(''):'<p class="empty">Bekleyen onay yok.</p>'}
   ${low.length?`<p class="sec">Kritik stok</p>${low.map(i=>`<div class="card warn"><h3>${esc(i.name)}</h3><p>${num(i.qty)} ${esc(i.unit)} kaldı · en az ${num(i.min_qty)} olmalı</p></div>`).join('')}`:''}
   <p class="sec">Bugün takvimde</p>${today.length?today.map(eventCard).join(''):'<p class="empty">Bugün için kayıt yok.</p>'}`;
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{if(b.dataset.f)jobFilter=b.dataset.f;if(b.dataset.go!=='panel')go(b.dataset.go)});
 }

 /* ---- İŞLER ---- */
 function jobCard(j){
  const admin=S.isAdmin(),o=D.orders.find(x=>x.id===j.order_id),c=o&&customer(o.customer_id),left=j.due_date?daysLeft(j.due_date):null,short=shortFor(j);
  const cls=j.status==='onaylandi'?'ok':left!==null&&left<0?'warn':j.status==='devam'?'go':'';
  const who=(j.assignees||[]).length?j.assignees.map(person).join(', '):S.kind(j.kind)+' bölümü';
  let actions='';
  if(!admin&&j.status==='bekliyor')actions=`<div class="row"><button class="btn ghost" data-act="job-start" data-id="${j.id}">Başladım</button><button class="btn solid" data-act="job-done" data-id="${j.id}">İş bitti</button></div>`;
  else if(!admin&&j.status==='devam')actions=`<button class="btn solid" data-act="job-done" data-id="${j.id}">İş bitti</button>`;
  else if(admin&&j.status==='bitti')actions=`<div class="row"><button class="btn solid small" data-act="job-ok" data-id="${j.id}">Onayla</button><button class="btn ghost small" data-act="job-back" data-id="${j.id}">Geri gönder</button></div>`;
  const flagged=D.issues.some(x=>x.job_id===j.id&&x.status==='acik');if(!admin&&j.status!=='onaylandi'&&j.status!=='bitti')actions+=`<button class="btn ghost small flag" data-act="job-flag" data-id="${j.id}">Sorun var, yöneticiye bildir</button>`;
  if(admin)return `<button class="card line ${flagged?'warn':cls}" data-open="job" data-id="${j.id}"><span><b>${esc(j.title)}</b><small>${esc(who)}${c?' · '+esc(c.company):''}</small></span><span class="meta">${flagged?'<span class="chip r">Sorun</span>':''}${short.length&&j.status!=='onaylandi'?'<span class="chip r">Malzeme</span>':''}<span class="chip ${j.status==='bitti'?'y':''}">${esc(S.jobStatus(j.status))}</span>${j.due_date?`<span class="chip ${left<0&&j.status!=='onaylandi'?'r':''}">${left<0&&j.status!=='onaylandi'?Math.abs(left)+' gün gecikti':left===0?'Bugün':dstr(j.due_date)}</span>`:''}</span></button>`;
  return `<div class="card ${cls}" ${admin?`data-open="job" data-id="${j.id}"`:''}><h3>${esc(j.title)}</h3><p>${c?esc(c.company)+' · ':''}${o?esc(o.code)+' · ':''}${num(j.qty)} adet</p>${j.note?`<p>${esc(j.note)}</p>`:''}
   <div class="meta"><span class="chip y">${esc(S.kind(j.kind))}</span><span class="chip">${esc(S.jobStatus(j.status))}</span>${j.due_date?`<span class="chip ${left<0?'r':''}">${left<0?Math.abs(left)+' gün gecikti':left===0?'Bugün':dstr(j.due_date)}</span>`:''}${admin?`<span class="chip">${esc(who)}</span>`:''}${short.length&&j.status!=='onaylandi'?'<span class="chip r">Malzeme eksik</span>':''}</div>
   ${admin||S.isStock()?needBlockIf(j):''}${actions}</div>`;
 }
 const needBlockIf=j=>j.status==='onaylandi'?'':needBlock(j.kind,j.qty);
 function jobs(){
  const list=myJobs().slice().sort((x,y)=>String(x.due_date||'9').localeCompare(String(y.due_date||'9')));
  if(!S.isAdmin()){
   const open=list.filter(j=>j.status==='bekliyor'||j.status==='devam'),wait=list.filter(j=>j.status==='bitti'),done=list.filter(j=>j.status==='onaylandi');
   $('#screen').innerHTML=remindersBlock()+(open.length?open.map(jobCard).join(''):'<p class="empty">Şu an size düşen iş yok.</p>')+(wait.length?`<p class="sec">Onay bekleyen</p>${wait.map(jobCard).join('')}`:'')+(done.length?`<p class="sec">Tamamlanan</p>${done.slice(0,10).map(jobCard).join('')}`:'');return}
  const F={acik:['Açık',j=>j.status==='bekliyor'||j.status==='devam'],geciken:['Geciken',j=>j.status!=='onaylandi'&&j.due_date&&daysLeft(j.due_date)<0],onay:['Onay bekleyen',j=>j.status==='bitti'],sorun:['Sorunlu',j=>D.issues.some(x=>x.job_id===j.id&&x.status==='acik')||(j.status!=='onaylandi'&&shortFor(j).length>0)],bitti:['Tamamlanan',j=>j.status==='onaylandi']};
  if(!F[jobFilter])jobFilter='acik';const shown=list.filter(F[jobFilter][1]);
  $('#screen').innerHTML=`<div class="filters">${Object.entries(F).map(([k,[l,f]])=>`<button type="button" class="${k===jobFilter?'on':''}" data-f="${k}">${l} <b>${list.filter(f).length}</b></button>`).join('')}</div>`+(shown.length?shown.map(jobCard).join(''):'<p class="empty">Bu başlıkta iş yok.</p>');
  document.querySelectorAll('.filters button').forEach(b=>b.onclick=()=>{jobFilter=b.dataset.f;jobs()});
 }
 function openJob(j){
  const o=D.orders.find(x=>x.id===j.order_id),c=o&&customer(o.customer_id),iss=D.issues.filter(x=>x.job_id===j.id&&x.status==='acik'),left=j.due_date?daysLeft(j.due_date):null;
  sheet(j.title,`<p>${c?esc(c.company)+' · ':''}${o?esc(o.code)+' · ':''}${num(j.qty)} adet · ${esc(S.kind(j.kind))}</p>${j.note?`<p style="color:var(--mute)">${esc(j.note)}</p>`:''}
   <div class="meta"><span class="chip y">${esc(S.jobStatus(j.status))}</span>${j.due_date?`<span class="chip ${left<0?'r':''}">Termin ${dstr(j.due_date)}</span>`:''}<span class="chip">${(j.assignees||[]).length?j.assignees.map(person).map(esc).join(', '):esc(S.kind(j.kind))+' bölümü'}</span></div>
   ${iss.map(x=>`<div class="card warn"><p><b>Sorun:</b> ${esc(x.text)}</p><p>${esc(person(x.by))} · ${dstr(x.at)}</p><button class="btn solid small" data-iss="${x.id}">Çözüldü</button></div>`).join('')}
   ${j.status==='onaylandi'?'':needBlock(j.kind,j.qty)}
   ${j.status==='bitti'?`<div class="row"><button class="btn solid" data-j="onaylandi">Onayla</button><button class="btn ghost" data-j="devam">Geri gönder</button></div>`:''}
   <div class="row"><button class="btn ghost" id="j-edit">Düzenle / kişi ata</button><button class="btn ghost" id="j-rem">Hatırlatma kur</button></div>`);
  document.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{closeSheet();run(()=>S.save('jobs',{id:j.id,status:b.dataset.j}),b.dataset.j==='onaylandi'?'İş onaylandı':'İş geri gönderildi')});
  document.querySelectorAll('[data-iss]').forEach(b=>b.onclick=()=>{closeSheet();run(()=>S.save('issues',{id:b.dataset.iss,status:'cozuldu'}),'Sorun kapatıldı')});
  $('#j-edit').onclick=()=>editJob(j);$('#j-rem').onclick=()=>editReminder({text:j.title+' kontrol'});
 }
 function editJob(j){
  j=j||{kind:'deri',status:'bekliyor',assignees:[],qty:0,due_date:S.day(7)};
  form(j.id?'İşi düzenle':'Yeni iş',[
   {name:'title',label:'İşin adı',value:j.title,required:true},
   {name:'kind',label:'İş türü',type:'select',options:S.KINDS,value:j.kind},
   {name:'qty',label:'Adet',type:'number',value:j.qty},
   {name:'due_date',label:'Termin',type:'date',value:j.due_date},
   {name:'order_id',label:'Bağlı sipariş',type:'select',options:[['','Siparişe bağlı değil'],...D.orders.map(o=>[o.id,`${o.code} · ${(customer(o.customer_id)||{}).company||''}`])],value:j.order_id||''},
   {name:'assignees',label:'İlgilenecek kişiler (boş bırakılırsa iş türünün bölümüne düşer)',type:'checks',options:staffOptions().filter(([id])=>(D.profiles.find(p=>p.id===id)||{}).role!=='admin'),value:j.assignees},
   {name:'note',label:'Not',type:'textarea',value:j.note}],
   v=>run(()=>S.save('jobs',{...j,...v,order_id:v.order_id||null}),'İş kaydedildi'),
   j.id?`<button class="btn danger" id="del">İşi sil</button>`:'');
  if(j.id)$('#del').onclick=()=>{closeSheet();run(()=>S.remove('jobs',j.id),'İş silindi')};
 }

 /* ---- TAKVİM ---- */
 function eventCard(e){const c=customer(e.customer_id);return `<div class="card ${e.type==='teslim'?'go':''}" ${S.isAdmin()?`data-open="event" data-id="${e.id}"`:''}><h3>${esc(e.title)}</h3><p>${tstr(e.starts_at)}${c?' · '+esc(c.company):''}${e.note?' · '+esc(e.note):''}</p><div class="meta"><span class="chip y">${esc(S.eventType(e.type))}</span>${e.source==='site'?'<span class="chip">Siteden</span>':''}${(e.participants||[]).map(p=>`<span class="chip">${esc(person(p))}</span>`).join('')}</div></div>`}
 function calendar(){
  const mine=D.events.filter(e=>S.isAdmin()||(e.participants||[]).includes(S.me.id)).filter(e=>e.starts_at.slice(0,10)>=S.day()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
  if(!mine.length){$('#screen').innerHTML=`<p class="empty">${S.isAdmin()?'Yaklaşan kayıt yok. Sağ üstteki + ile görüşme ya da etkinlik ekleyin.':'Size atanmış yaklaşan görüşme ya da etkinlik yok.'}</p>`;return}
  let html='',last='';for(const e of mine){const d=e.starts_at.slice(0,10);if(d!==last){last=d;const n=daysLeft(d);html+=`<p class="dayhead">${n===0?'Bugün':n===1?'Yarın':new Date(e.starts_at).toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})}</p>`}html+=eventCard(e)}
  $('#screen').innerHTML=html;
 }
 function editEvent(e,preset){
  e=e||{type:'gorusme',participants:[S.me.id],source:'manuel',starts_at:new Date(Date.now()+864e5).toISOString(),...(preset||{})};
  const local=new Date(new Date(e.starts_at).getTime()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16);
  form(e.id?'Kaydı düzenle':'Takvime ekle',[
   {name:'title',label:'Başlık',value:e.title,required:true},
   {name:'type',label:'Tür',type:'select',options:S.EVENTS,value:e.type},
   {name:'starts_at',label:'Tarih ve saat',type:'datetime-local',value:local,required:true},
   {name:'customer_id',label:'Müşteri',type:'select',options:[['','Müşteri seçilmedi'],...D.customers.map(c=>[c.id,c.company])],value:e.customer_id||''},
   {name:'participants',label:'Katılacak kişiler',type:'checks',options:staffOptions(),value:e.participants},
   {name:'note',label:'Not',type:'textarea',value:e.note}],
   v=>run(async()=>{await S.save('events',{...e,...v,customer_id:v.customer_id||null,starts_at:new Date(v.starts_at).toISOString()});if(preset&&preset._req)await S.save('requests',{id:preset._req,status:'takvimde'})},'Takvime eklendi'),
   e.id?`<button class="btn danger" id="del">Kaydı sil</button>`:'');
  if(e.id)$('#del').onclick=()=>{closeSheet();run(()=>S.remove('events',e.id),'Kayıt silindi')};
 }

 /* ---- STOK ---- */
 function stock(){
  const q=query.toLocaleLowerCase('tr'),list=D.stock_items.filter(i=>!q||[i.name,i.code,i.category,i.location].join(' ').toLocaleLowerCase('tr').includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'tr'));
  $('#screen').innerHTML=`<input class="search" id="q" type="search" placeholder="Stokta ara: ad, kod, raf…" value="${esc(query)}">`+(list.length?list.map(i=>{const low=i.qty<=i.min_qty;return `<button class="card ${low?'warn':''}" data-open="item" data-id="${i.id}"><h3>${esc(i.name)}</h3><p>${esc(i.code)} · Raf ${esc(i.location||'—')}</p><div class="meta"><span class="chip ${low?'r':'g'}">${num(i.qty)} ${esc(i.unit)}</span><span class="chip">En az ${num(i.min_qty)}</span>${(i.kinds||[]).map(k=>`<span class="chip">${esc(S.kind(k))}</span>`).join('')}</div></button>`}).join(''):'<p class="empty">Eşleşen stok kalemi yok.</p>');
  const el=$('#q');el.oninput=()=>{query=el.value;stock();const n=$('#q');n.focus();n.setSelectionRange(query.length,query.length)};
 }
 function openItem(i){
  const moves=D.stock_moves.filter(m=>m.item_id===i.id).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8),can=S.isStock();
  sheet(i.name,`<div class="meta"><span class="chip ${i.qty<=i.min_qty?'r':'g'}">${num(i.qty)} ${esc(i.unit)}</span><span class="chip">En az ${num(i.min_qty)}</span><span class="chip">Raf ${esc(i.location||'—')}</span><span class="chip">${esc(i.code)}</span></div>
   ${can?`<div class="row"><button class="btn solid" data-mv="giris">Giriş</button><button class="btn ghost" data-mv="cikis">Çıkış</button></div><div class="row"><button class="btn ghost" data-mv="sayim">Sayım</button><button class="btn ghost" data-mv="fire">Fire</button></div><button class="btn ghost" id="edit-item">Kalemi düzenle</button>`:''}
   ${S.isAdmin()?'':`<button class="btn ghost flag" id="flag-item">Stok az, yöneticiye bildir</button>`}
   <p class="sec">Son hareketler</p>${moves.length?moves.map(m=>`<div class="card"><p><b>${esc(S.moveType(m.type))}</b> · ${num(m.qty)} ${esc(i.unit)} · ${esc(person(m.by))} · ${dstr(m.at)}${m.approved?'':' · onay bekliyor'}</p>${m.note?`<p>${esc(m.note)}</p>`:''}</div>`).join(''):'<p class="empty">Hareket yok.</p>'}`);
  document.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>moveForm(i,b.dataset.mv));
  if(can)$('#edit-item').onclick=()=>editItem(i);
  if(!S.isAdmin())$('#flag-item').onclick=()=>flagForm({item_id:i.id},`${i.name} azaldı (${num(i.qty)} ${i.unit} kaldı).`);
 }
 function moveForm(i,type){
  form(`${S.moveType(type)}: ${i.name}`,[{name:'qty',label:type==='sayim'?`Sayılan miktar (${i.unit})`:`Miktar (${i.unit})`,type:'number',step:'any',required:true},{name:'note',label:'Not',type:'textarea'}],v=>{
   if(!(v.qty>=0)||(!v.qty&&type!=='sayim'))return toast('Miktar girin');
   const needsOk=(type==='cikis'||type==='fire')&&!S.isAdmin();
   run(async()=>{await S.save('stock_moves',{item_id:i.id,type,qty:v.qty,note:v.note,by:S.me.id,at:S.iso(Date.now()),approved:!needsOk});if(!needsOk)await S.save('stock_items',{id:i.id,qty:applyMove(i.qty,type,v.qty)})},needsOk?'Yönetici onayına gönderildi':'Stok güncellendi');
  });
 }
 const applyMove=(qty,type,n)=>type==='giris'?qty+n:type==='sayim'?n:Math.max(0,qty-n);
 function editItem(i){
  i=i||{category:'deri',unit:'adet',qty:0,min_qty:0,per_unit:1,kinds:[]};
  form(i.id?'Kalemi düzenle':'Yeni stok kalemi',[
   {name:'name',label:'Malzeme adı',value:i.name,required:true},{name:'code',label:'Kod',value:i.code},
   {name:'unit',label:'Birim (adet, m, kg…)',value:i.unit,required:true},
   {name:'qty',label:'Eldeki miktar',type:'number',step:'any',value:i.qty},{name:'min_qty',label:'En az olması gereken',type:'number',step:'any',value:i.min_qty},
   {name:'per_unit',label:'1 adet ürün için harcanan miktar',type:'number',step:'any',value:i.per_unit},
   {name:'kinds',label:'Hangi işlerde kullanılır',type:'checks',options:S.KINDS,value:i.kinds},
   {name:'location',label:'Raf',value:i.location}],
   v=>run(()=>S.save('stock_items',{...i,...v}),'Stok kalemi kaydedildi'));
 }

 /* ---- MÜŞTERİLER ve SİPARİŞLER ---- */
 function customers(){
  const list=visibleCustomers().slice().sort((a,b)=>a.company.localeCompare(b.company,'tr'));
  $('#screen').innerHTML=list.length?list.map(c=>{const os=D.orders.filter(o=>o.customer_id===c.id),open=os.filter(o=>o.status!=='yollandi').length;return `<button class="card" data-open="customer" data-id="${c.id}"><h3>${esc(c.company)}</h3><p>${esc(c.name||'')}${c.city?' · '+esc(c.city):''}</p><div class="meta"><span class="chip">${os.length} sipariş</span>${open?`<span class="chip y">${open} açık</span>`:''}</div></button>`}).join(''):'<p class="empty">Müşteri yok.</p>';
 }
 function openCustomer(c){
  const os=D.orders.filter(o=>o.customer_id===c.id).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))),admin=S.isAdmin();
  sheet(c.company,`<p>${esc(c.name||'')}${c.city?' · '+esc(c.city):''}</p>${c.note?`<p style="color:var(--mute)">${esc(c.note)}</p>`:''}
   <div class="row">${c.phone?`<a class="btn ghost small" href="tel:${esc(c.phone)}">Ara</a>`:''}${c.email?`<a class="btn ghost small" href="mailto:${esc(c.email)}">E-posta</a>`:''}</div>
   ${admin?`<div class="row"><button class="btn solid" id="new-order">Yeni sipariş</button><button class="btn ghost" id="edit-c">Düzenle</button></div>`:''}
   <p class="sec">Siparişler</p>${os.length?os.map(o=>{const at=S.ORDER_FLOW.findIndex(s=>s[0]===o.status);return `<div class="card ${o.status==='yollandi'?'ok':'go'}"><h3>${esc(o.code)} · ${esc(S.kind(o.kind))}</h3><p>${num(o.qty)} adet${o.size?' · '+esc(o.size):''}${o.technique?' · '+esc(o.technique):''} · Termin ${dstr(o.due_date)}</p>
    <div class="flow">${S.ORDER_FLOW.map((s,n)=>`<div class="${n<at?'done':n===at?'done now':''}">${esc(s[1])}</div>`).join('')}</div>
    ${admin&&o.status!=='yollandi'?needBlock(o.kind,o.qty):''}
    ${admin&&at<S.ORDER_FLOW.length-1?`<button class="btn solid small" data-next="${o.id}">${esc(S.ORDER_FLOW[at+1][1])} olarak işaretle</button>`:''}</div>`}).join(''):'<p class="empty">Bu müşterinin siparişi yok.</p>'}`);
  if(admin){$('#new-order').onclick=()=>editOrder(c);$('#edit-c').onclick=()=>editCustomer(c)}
  document.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>{const o=D.orders.find(x=>x.id===b.dataset.next),n=S.ORDER_FLOW.findIndex(s=>s[0]===o.status)+1;closeSheet();run(()=>S.save('orders',{id:o.id,status:S.ORDER_FLOW[n][0]}),S.ORDER_FLOW[n][1])});
 }
 function editCustomer(c){
  c=c||{};
  form(c.id?'Müşteriyi düzenle':'Yeni müşteri',[{name:'company',label:'Firma',value:c.company,required:true},{name:'name',label:'Yetkili kişi',value:c.name},{name:'phone',label:'Telefon',type:'tel',value:c.phone},{name:'email',label:'E-posta',type:'email',value:c.email},{name:'city',label:'Şehir',value:c.city},{name:'note',label:'Not',type:'textarea',value:c.note}],
   v=>run(()=>S.save('customers',{...c,...v}),'Müşteri kaydedildi'));
 }
 function editOrder(c){
  form('Yeni sipariş: '+c.company,[{name:'kind',label:'Ürün türü',type:'select',options:S.KINDS,value:'deri'},{name:'qty',label:'Adet',type:'number',required:true},{name:'size',label:'Ölçü'},{name:'technique',label:'Uygulama'},{name:'due_date',label:'Termin',type:'date',value:S.day(14)},{name:'note',label:'Not',type:'textarea'}],
   v=>run(async()=>{
    const o=await S.save('orders',{...v,customer_id:c.id,code:S.nextCode(D.orders),status:'ulasti'});
    await S.save('jobs',{order_id:o.id,title:`${S.kind(v.kind)} üretimi · ${c.company}`,kind:v.kind,qty:v.qty,due_date:v.due_date,status:'bekliyor',assignees:[],note:v.note});
    const short=S.need(v.kind,v.qty,D.stock_items).filter(n=>!n.ok);
    setTimeout(()=>toast(short.length?`Dikkat: ${short.length} malzemede stok yetersiz`:'Stok bu sipariş için yeterli'),400);
   },'Sipariş açıldı, iş ilgili bölüme düştü'));
 }

 /* ---- SORUN BİLDİR ---- */
 function flagForm(link,preset){form('Yöneticiye bildir',[{name:'text',label:'Sorun nedir?',type:'textarea',value:preset||''}],v=>{if(!v.text)return toast('Kısaca yazın');run(()=>S.save('issues',{job_id:null,item_id:null,...link,text:v.text,by:S.me.id,at:S.iso(Date.now()),status:'acik'}),'Yöneticiye bildirildi')})}

 /* ---- HATIRLATMA ---- */
 const localDT=d=>new Date(new Date(d).getTime()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16);
 function editReminder(r){
  r=r||{};const t=new Date();t.setDate(t.getDate()+1);t.setHours(9,0,0,0);
  form('Hatırlatma',[{name:'text',label:'Ne hatırlatılsın?',value:r.text,required:true},{name:'due_at',label:'Ne zaman?',type:'datetime-local',value:localDT(r.due_at||t),required:true},...(S.isAdmin()?[{name:'owner',label:'Kime?',type:'select',options:staffOptions(),value:r.owner||S.me.id}]:[])],
   v=>run(()=>S.save('reminders',{...r,text:v.text,due_at:new Date(v.due_at).toISOString(),owner:v.owner||S.me.id,by:S.me.id,done:false}),'Hatırlatma kuruldu'));
 }

 /* ---- DIŞ ÜRETİM ---- */
 function outCard(o){const n=daysLeft(o.promised_date),ord=D.orders.find(x=>x.id===o.order_id),wait=o.status==='bekleniyor';
  return `<div class="card ${!wait?'ok':n<=0?'warn':''}" ${S.isAdmin()?`data-open="out" data-id="${o.id}"`:''}><h3>${esc(o.supplier)}</h3><p>${esc(o.what)}${o.qty?' · '+num(o.qty)+' adet':''}${ord?' · '+esc(ord.code):''}</p><p>${wait?(n<0?`${Math.abs(n)} gün önce hazır olacağını söylemişti. Hazır mı?`:n===0?'Bugün hazır olacağını söylemişti. Hazır mı?':`${dstr(o.promised_date)} tarihine söz verdi`):'Teslim alındı'}${o.note?' · '+esc(o.note):''}</p>
   ${wait&&S.isAdmin()?`<div class="row"><button class="btn solid small" data-act="out-ok" data-id="${o.id}">Hazır, teslim aldım</button><button class="btn ghost small" data-act="out-later" data-id="${o.id}">Yeni tarih verdi</button></div>`:''}</div>`}
 function outs(){const l=D.outsourcing.slice().sort((x,y)=>(x.status==='bekleniyor'?0:1)-(y.status==='bekleniyor'?0:1)||String(x.promised_date).localeCompare(String(y.promised_date)));$('#screen').innerHTML=l.length?l.map(outCard).join(''):'<p class="empty">Dışarıda üretilen iş yok. Sağ üstteki + ile ekleyin.</p>'}
 function editOut(o){
  o=o||{status:'bekleniyor',promised_date:S.day(7)};
  form(o.id?'Dış üretimi düzenle':'Dış üretim ekle',[{name:'supplier',label:'Kim yapıyor? (ör. düğmeci)',value:o.supplier,required:true},{name:'what',label:'Ne yapıyor?',value:o.what,required:true},{name:'qty',label:'Adet',type:'number',value:o.qty},{name:'promised_date',label:'Hangi güne söz verdi?',type:'date',value:o.promised_date,required:true},{name:'order_id',label:'Bağlı sipariş',type:'select',options:[['','Siparişe bağlı değil'],...D.orders.map(x=>[x.id,`${x.code} · ${(customer(x.customer_id)||{}).company||''}`])],value:o.order_id||''},{name:'note',label:'Not',type:'textarea',value:o.note}],
   v=>run(()=>S.save('outsourcing',{...o,...v,order_id:v.order_id||null}),'Kaydedildi'),o.id?'<button class="btn danger" id="del">Sil</button>':'');
  if(o.id)$('#del').onclick=()=>{closeSheet();run(()=>S.remove('outsourcing',o.id),'Silindi')};
 }

 /* ---- NUMUNELER ---- */
 const SAMPLE={bekliyor:'Ürün fotoğrafı bekleniyor',kontrol:'Karşılaştırma bekliyor',onaylandi:'Onaylandı',revize:'Revize istendi'};
 const mySamples=()=>S.isAdmin()?D.samples:D.samples.filter(n=>!n.kind||n.kind===S.me.department||(n.assignees||[]).includes(S.me.id));
 function samples(){const l=mySamples();$('#screen').innerHTML=l.length?l.map(n=>`<button class="card ${n.status==='onaylandi'?'ok':n.status==='revize'?'warn':n.status==='kontrol'?'go':''}" data-open="sample" data-id="${n.id}"><h3>${esc(n.title)}</h3><div class="pair small">${n.original?photo(n.original,'Orijinal'):'<span class="ph none">Orijinal yok</span>'}${n.result?photo(n.result,'Çıkan ürün'):'<span class="ph none">Ürün fotoğrafı yok</span>'}</div><div class="meta">${n.kind?`<span class="chip y">${esc(S.kind(n.kind))}</span>`:''}<span class="chip">${SAMPLE[n.status]||''}</span></div></button>`).join(''):`<p class="empty">${S.isAdmin()?'Numune yok. Sağ üstteki + ile orijinal tasarımı yükleyin.':'Size düşen numune yok.'}</p>`}
 function openSample(n){
  const admin=S.isAdmin();
  sheet(n.title,`${n.note?`<p style="color:var(--mute)">${esc(n.note)}</p>`:''}<div class="pair"><figure>${n.original?photo(n.original,'Orijinal tasarım'):'<span class="ph none">Yok</span>'}<figcaption>Orijinal tasarım</figcaption>${admin?'<button class="btn ghost small" data-up="original">Fotoğraf yükle</button>':''}</figure><figure>${n.result?photo(n.result,'Şirketten çıkan ürün'):'<span class="ph none">Yok</span>'}<figcaption>Şirketten çıkan ürün</figcaption><button class="btn ${n.result?'ghost':'solid'} small" data-up="result">Fotoğraf yükle</button></figure></div>
   <div class="meta"><span class="chip y">${SAMPLE[n.status]||''}</span></div>${n.review?`<p><b>Yönetici notu:</b> ${esc(n.review)}</p>`:''}
   ${admin&&n.result?`<div class="row"><button class="btn solid" data-s="onaylandi">Uygun, onayla</button><button class="btn ghost" data-s="revize">Revize iste</button></div>`:''}${admin?'<button class="btn ghost" id="n-edit">Düzenle</button>':''}`);
  document.querySelectorAll('[data-up]').forEach(b=>b.onclick=async()=>{const u=await pickPhoto();if(!u)return;closeSheet();run(()=>S.save('samples',{id:n.id,[b.dataset.up]:u,...(b.dataset.up==='result'?{status:'kontrol',result_by:S.me.id}:{})}),'Fotoğraf yüklendi')});
  document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{if(b.dataset.s==='revize')return form('Revize notu',[{name:'review',label:'Ne düzeltilsin?',type:'textarea'}],v=>run(()=>S.save('samples',{id:n.id,status:'revize',review:v.review}),'Revize istendi'));closeSheet();run(()=>S.save('samples',{id:n.id,status:'onaylandi'}),'Numune onaylandı')});
  if(admin)$('#n-edit').onclick=()=>editSample(n);
 }
 function editSample(n){
  n=n||{status:'bekliyor',kind:'deri',original:'',result:''};
  form(n.id?'Numuneyi düzenle':'Yeni numune',[{name:'title',label:'Numunenin adı',value:n.title,required:true},{name:'kind',label:'Tür (ilgili bölüme düşer)',type:'select',options:S.KINDS,value:n.kind},{name:'order_id',label:'Bağlı sipariş',type:'select',options:[['','Siparişe bağlı değil'],...D.orders.map(x=>[x.id,`${x.code} · ${(customer(x.customer_id)||{}).company||''}`])],value:n.order_id||''},{name:'note',label:'Dikkat edilecekler',type:'textarea',value:n.note}],
   v=>run(async()=>{const row=await S.save('samples',{...n,...v,order_id:v.order_id||null,by:n.by||S.me.id});if(!n.id)setTimeout(()=>{const x=D.samples.find(s=>s.id===row.id);if(x)openSample(x)},300)},n.id?'Kaydedildi':'Numune açıldı, orijinal tasarımı yükleyin'),n.id?'<button class="btn danger" id="del">Sil</button>':'');
  if(n.id)$('#del').onclick=()=>{closeSheet();run(()=>S.remove('samples',n.id),'Silindi')};
 }

 /* ---- NOTLARIM (kişiye özel) ---- */
 function mine(){
  const notes=D.notes.filter(n=>n.owner===S.me.id).sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at))),rems=D.reminders.filter(r=>r.owner===S.me.id&&!r.done).sort((x,y)=>x.due_at.localeCompare(y.due_at));
  $('#screen').innerHTML=`<p class="sec">Hatırlatmalarım</p>${rems.length?rems.map(r=>`<div class="card ${new Date(r.due_at)<=new Date()?'go':''}"><h3>${esc(r.text)}</h3><p>${dstr(r.due_at)} ${tstr(r.due_at)}</p><div class="row"><button class="btn solid small" data-act="rem-done" data-id="${r.id}">Tamam</button><button class="btn ghost small" data-act="rem-snooze" data-id="${r.id}">Bir gün ertele</button></div></div>`).join(''):'<p class="empty">Kurulu hatırlatma yok.</p>'}
   <p class="sec">Notlarım</p>${notes.length?notes.map(n=>`<div class="card"><p style="color:var(--paper);white-space:pre-wrap">${esc(n.text)}</p>${photo(n.image,'Not fotoğrafı')}<p>${dstr(n.created_at)}</p><button class="btn ghost small" data-act="note-del" data-id="${n.id}">Sil</button></div>`).join(''):'<p class="empty">Not yok. Sağ üstteki + ile ekleyin. Notları yalnızca siz görürsünüz.</p>'}`;
 }
 function addMine(){sheet('Ekle','<button class="btn solid" id="a-note">Not yaz</button><button class="btn ghost" id="a-photo">Fotoğraflı not</button><button class="btn ghost" id="a-rem">Hatırlatma kur</button>');
  const note=img=>form('Not',[{name:'text',label:'Not',type:'textarea'}],v=>{if(!v.text&&!img)return;run(()=>S.save('notes',{owner:S.me.id,text:v.text,image:img||''}),'Not kaydedildi')});
  $('#a-note').onclick=()=>note();$('#a-photo').onclick=async()=>{const u=await pickPhoto();if(u)note(u)};$('#a-rem').onclick=()=>editReminder();}

 /* ---- DAHA ---- */
 function more(){const admin=S.isAdmin(),items=[...(admin||visibleCustomers().length||S.canAddCustomer()?[['customers','Müşteriler ve siparişler']]:[]),...(admin?[['samples','Numuneler'],['outs','Dış üretim takibi']]:[]),['mine','Notlarım ve hatırlatmalarım']];
  $('#screen').innerHTML=items.map(([k,l])=>`<button class="card" data-more="${k}"><h3>${l}</h3></button>`).join('');document.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>go(b.dataset.more))}

 /* ---- siteden gelen siparişi siparişe çevir ---- */
 function requestToOrder(r){
  form('Siparişe çevir',[{name:'customer_id',label:'Müşteri',type:'select',options:[['','Yeni müşteri: '+(r.company||r.name||'')],...D.customers.map(c=>[c.id,c.company])],value:''},{name:'kind',label:'Ürün türü',type:'select',options:S.KINDS,value:r.kind||'deri'},{name:'qty',label:'Adet',type:'number',value:r.qty||0},{name:'due_date',label:'Termin',type:'date',value:S.day(14)},{name:'note',label:'Not',type:'textarea',value:r.message}],
   v=>run(async()=>{let cid=v.customer_id;if(!cid)cid=(await S.save('customers',{company:r.company||r.name||'Yeni müşteri',name:r.name||'',email:r.email||'',phone:r.phone||'',city:'',note:'Siteden geldi'})).id;
    const c=D.customers.find(x=>x.id===cid)||{company:r.company||r.name};
    const o=await S.save('orders',{customer_id:cid,code:S.nextCode(D.orders),kind:v.kind,qty:v.qty,size:'',technique:'',due_date:v.due_date,status:'ulasti',note:v.note});
    await S.save('jobs',{order_id:o.id,title:`${S.kind(v.kind)} üretimi · ${c.company}`,kind:v.kind,qty:v.qty,due_date:v.due_date,status:'bekliyor',assignees:[],note:v.note});
    if(r.image)await S.save('samples',{title:`${c.company} · siteden gelen tasarım`,kind:v.kind,order_id:o.id,original:r.image,result:'',status:'bekliyor',note:'',by:S.me.id});
    await S.save('requests',{id:r.id,status:'siparis'})},'Sipariş açıldı; iş ve numune ilgili bölüme düştü'));
 }

 /* ---- AYARLAR ---- */
 function settings(){
  const admin=S.isAdmin();
  sheet('Ayarlar',`<div class="card">${S.me.avatar?`<img class="avatar" src="${esc(S.me.avatar)}" alt="">`:''}<h3>${esc(S.me.full_name)}</h3><p>${esc(S.me.email||'')}</p><div class="meta"><span class="chip y">${admin?'Yönetici':'Çalışan'}</span><span class="chip">${esc(S.dept(S.me.department))}</span></div></div>
   <button class="btn ghost" id="avatar">Profil fotoğrafı yükle</button>
   ${admin?`<p class="sec">Ekip</p>${D.profiles.map(p=>`<button class="card" data-user="${p.id}"><h3>${esc(p.full_name)}</h3><p>${esc(p.email||'')}</p><div class="meta"><span class="chip ${p.role==='admin'?'y':''}">${p.role==='admin'?'Yönetici':'Çalışan'}</span><span class="chip">${esc(S.dept(p.department))}</span>${p.can_add_customers&&p.role!=='admin'?'<span class="chip">Müşteri ekleyebilir</span>':''}</div></button>`).join('')}<p style="color:var(--mute);font-size:13.5px">${S.live?'Yeni kullanıcıyı Supabase panelinden eklersiniz; burada bölümünü ve yetkisini ayarlarsınız.':'Deneme modunda ekip sabittir.'}</p>`:''}
   ${S.live?'':'<button class="btn ghost" id="reset">Deneme verisini sıfırla</button>'}<button class="btn danger" id="out">Çıkış yap</button>`);
  $('#out').onclick=()=>{S.signOut();closeSheet();showLogin()};
  $('#avatar').onclick=async()=>{const u=await pickPhoto(400);if(!u)return;closeSheet();S.me.avatar=u;run(()=>S.save('profiles',{id:S.me.id,avatar:u}),'Profil fotoğrafı güncellendi')};
  if(!S.live)$('#reset').onclick=()=>{S.resetDemo();closeSheet();showLogin()};
  document.querySelectorAll('[data-user]').forEach(b=>b.onclick=()=>{const p=D.profiles.find(x=>x.id===b.dataset.user);
   form(p.full_name,[{name:'full_name',label:'Ad soyad',value:p.full_name,required:true},{name:'role',label:'Yetki',type:'select',options:[['staff','Çalışan'],['admin','Yönetici']],value:p.role},{name:'department',label:'Bölüm',type:'select',options:S.DEPTS,value:p.department},{name:'can_add_customers',label:'Müşteri ekleyebilir mi',type:'select',options:[['false','Hayır'],['true','Evet']],value:String(!!p.can_add_customers)}],
    v=>run(()=>S.save('profiles',{id:p.id,...v,can_add_customers:v.can_add_customers==='true'}),'Kullanıcı güncellendi'))});
 }
 $('#me').onclick=settings;

 /* ---- tıklamalar ---- */
 $('#screen').addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');
  if(a){const id=a.dataset.id,act=a.dataset.act;e.stopPropagation();
   if(act==='job-start')return run(()=>S.save('jobs',{id,status:'devam'}),'İş başladı');
   if(act==='job-done')return run(()=>S.save('jobs',{id,status:'bitti',done_by:S.me.id,done_at:S.iso(Date.now())}),'İş bitti olarak işaretlendi');
   if(act==='job-ok')return run(()=>S.save('jobs',{id,status:'onaylandi'}),'İş onaylandı');
   if(act==='job-back')return run(()=>S.save('jobs',{id,status:'devam'}),'İş geri gönderildi');
   if(act==='move-ok'){const m=D.stock_moves.find(x=>x.id===id),it=D.stock_items.find(x=>x.id===m.item_id);return run(async()=>{await S.save('stock_moves',{id,approved:true});if(it)await S.save('stock_items',{id:it.id,qty:applyMove(it.qty,m.type,m.qty)})},'Stok hareketi onaylandı')}
   if(act==='move-no')return run(()=>S.remove('stock_moves',id),'Stok hareketi reddedildi');
   if(act==='job-flag')return flagForm({job_id:id});
   if(act==='iss-ok')return run(()=>S.save('issues',{id,status:'cozuldu'}),'Sorun kapatıldı');
   if(act==='rem-done')return run(()=>S.save('reminders',{id,done:true}),'Tamamlandı');
   if(act==='rem-snooze'){const t=new Date(Date.now()+864e5);return run(()=>S.save('reminders',{id,due_at:t.toISOString()}),'Yarın tekrar hatırlatılacak')}
   if(act==='out-ok')return run(()=>S.save('outsourcing',{id,status:'teslim'}),'Teslim alındı');
   if(act==='out-later'){const o=D.outsourcing.find(x=>x.id===id);return form('Yeni tarih',[{name:'promised_date',label:'Hangi güne söz verdi?',type:'date',value:S.day(2),required:true}],v=>run(()=>S.save('outsourcing',{id,promised_date:v.promised_date,note:[o.note,`${dstr(o.promised_date)} tarihinde hazır değildi`].filter(Boolean).join(' · ')}),'Yeni tarih kaydedildi'))}
   if(act==='note-del')return run(()=>S.remove('notes',id),'Not silindi');
   if(act==='req-order')return requestToOrder(D.requests.find(x=>x.id===id));
   if(act==='req-read')return run(()=>S.save('requests',{id,status:'okundu'}),'Okundu');
   if(act==='req-cal'){const r=D.requests.find(x=>x.id===id);return editEvent(null,{title:`${r.company||r.name} görüşmesi`,source:'site',note:r.message,_req:id})}
  }
  const o=e.target.closest('[data-open]');if(!o)return;const id=o.dataset.id;
  ({job:()=>openJob(D.jobs.find(x=>x.id===id)),out:()=>editOut(D.outsourcing.find(x=>x.id===id)),sample:()=>openSample(D.samples.find(x=>x.id===id)),event:()=>editEvent(D.events.find(x=>x.id===id)),item:()=>openItem(D.stock_items.find(x=>x.id===id)),customer:()=>openCustomer(D.customers.find(x=>x.id===id))})[o.dataset.open]();
 });

 /* ---- giriş ---- */
 function showLogin(){$('#app').hidden=true;$('#boot').hidden=true;$('#login').hidden=false;$('#demo-note').hidden=S.live;$('#login-error').textContent=''}
 async function enter(){$('#login').hidden=true;$('#boot').hidden=false;try{D=await S.load()}catch(e){toast(e.message)}$('#boot').hidden=true;$('#app').hidden=false;tab='';render()}
 let who='staff';
 document.querySelectorAll('[data-who]').forEach(b=>b.onclick=()=>{who=b.dataset.who;document.querySelectorAll('[data-who]').forEach(x=>x.classList.toggle('on',x===b))});
 document.querySelectorAll('[data-fill]').forEach(b=>b.onclick=()=>{const f=$('#login');f.email.value=b.dataset.fill;f.password.value='1234';document.querySelector(`[data-who="${b.dataset.fill.startsWith('yonetici')?'admin':'staff'}"]`).click()});
 $('#login').onsubmit=async e=>{e.preventDefault();const f=e.target,btn=f.querySelector('.btn');btn.disabled=true;$('#login-error').textContent='';
  try{await S.signIn(f.email.value,f.password.value);
   if(who==='admin'&&!S.isAdmin()){S.signOut();throw new Error('Bu hesap yönetici değil. Çalışan girişini kullanın.')}
   if(who==='staff'&&S.isAdmin()){S.signOut();throw new Error('Bu hesap yönetici hesabı. Yönetici girişini kullanın.')}
   f.password.value='';await enter()}
  catch(err){$('#login-error').textContent=err.message||'Giriş yapılamadı'}finally{btn.disabled=false}};
 (async()=>{let ok=false;try{ok=await S.restore()}catch{}ok?enter():showLogin()})();
 try{if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{})}catch{}
})();
