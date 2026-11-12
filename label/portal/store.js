/* Reynas Portal — veri katmanı. Supabase ayarlıysa oradan, değilse telefonun kendi belleğinden. */
window.Store=(()=>{
 const cfg=window.REYNAS_CONFIG||{},URL_=(cfg.SUPABASE_URL||'').replace(/\/+$/,''),KEY=cfg.SUPABASE_ANON_KEY||'';
 const live=!!(URL_&&KEY),LS='reynas-portal';
 let session=null,me=null;

 const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 const iso=d=>new Date(d).toISOString();
 const day=t=>{const x=new Date();x.setDate(x.getDate()+(t||0));return x.toISOString().slice(0,10)};
 const at=(t,h)=>{const x=new Date();x.setDate(x.getDate()+t);x.setHours(h,0,0,0);return x.toISOString()};
 const read=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
 const writeOk=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};

 /* ---- sabitler ---- */
 const KINDS=[['dokuma','Dokuma'],['deri','Deri'],['jakron','Jakron'],['silikon','Silikon'],['metal','Metal'],['hangtag','Hangtag'],['baski','Baskı']];
 const DEPTS=[...KINDS,['depo','Depo'],['sevkiyat','Sevkiyat'],['satis','Satış']];
 const ORDER_FLOW=[['ulasti','Elimize ulaştı'],['onaylandi','Onaylandı'],['uretimde','Üretime geçildi'],['uretim_bitti','Üretim bitti'],['yollandi','Yollandı']];
 const JOB_STATES=[['bekliyor','Bekliyor'],['devam','Devam ediyor'],['bitti','Bitti, onay bekliyor'],['onaylandi','Onaylandı']];
 const MOVES=[['giris','Giriş'],['cikis','Çıkış'],['sayim','Sayım'],['fire','Fire']];
 const EVENTS=[['gorusme','Görüşme'],['etkinlik','Etkinlik'],['teslim','Teslim']];
 const label=(list,k)=>(list.find(x=>x[0]===k)||[,k])[1];

 /* ---- deneme verisi ---- */
 function seed(){
  const people=[
   {id:'u1',full_name:'Yönetici',email:'yonetici@reynas',role:'admin',department:'satis',can_add_customers:true},
   {id:'u2',full_name:'Deri Ustası',email:'calisan@reynas',role:'staff',department:'deri',can_add_customers:false},
   {id:'u3',full_name:'Depo Sorumlusu',email:'depo@reynas',role:'staff',department:'depo',can_add_customers:false},
   {id:'u4',full_name:'Dokuma Ustası',email:'dokuma@reynas',role:'staff',department:'dokuma',can_add_customers:false}];
  const customers=[
   {id:'c1',company:'Blaque Denim',name:'Mehmet Yıldırım',phone:'+902120000001',email:'mehmet@blaque.example',city:'İstanbul',note:'Deri etiketlerde sıcak baskı tercih ediyor.',created_at:iso(Date.now()-9e9)},
   {id:'c2',company:'House of Brands',name:'Elif Kara',phone:'+902120000002',email:'elif@hob.example',city:'İstanbul',note:'',created_at:iso(Date.now()-7e9)},
   {id:'c3',company:'Shirosan Jeans',name:'Ahmet Demir',phone:'+902320000003',email:'ahmet@shirosan.example',city:'İzmir',note:'Numuneyi kargoyla istiyor.',created_at:iso(Date.now()-3e9)}];
  const orders=[
   {id:'o1',code:'RN-1041',customer_id:'c1',kind:'deri',qty:5000,size:'65 × 45 mm',technique:'Sıcak baskı',due_date:day(9),status:'uretimde',note:'Kenar dikişi kahverengi iplik.',created_at:iso(Date.now()-1e9)},
   {id:'o2',code:'RN-1042',customer_id:'c2',kind:'dokuma',qty:12000,size:'70 × 20 mm',technique:'İplikle dokuma',due_date:day(3),status:'onaylandi',note:'Renk onayı alındı.',created_at:iso(Date.now()-8e8)},
   {id:'o3',code:'RN-1043',customer_id:'c3',kind:'hangtag',qty:3000,size:'60 × 90 mm',technique:'Altın varak',due_date:day(16),status:'ulasti',note:'',created_at:iso(Date.now()-4e8)},
   {id:'o4',code:'RN-1044',customer_id:'c1',kind:'jakron',qty:9000,size:'70 × 50 mm',technique:'Serigrafi',due_date:day(21),status:'ulasti',note:'',created_at:iso(Date.now()-2e8)}];
  const jobs=[
   {id:'j1',order_id:'o1',title:'Deri etiket üretimi',kind:'deri',qty:5000,due_date:day(9),status:'devam',assignees:['u2'],note:'',created_at:iso(Date.now()-1e9)},
   {id:'j2',order_id:'o2',title:'Dokuma etiket üretimi',kind:'dokuma',qty:12000,due_date:day(3),status:'bekliyor',assignees:['u4'],note:'',created_at:iso(Date.now()-8e8)},
   {id:'j3',order_id:null,title:'Fuar için numune seti',kind:'jakron',qty:40,due_date:day(5),status:'bekliyor',assignees:[],note:'Her malzemeden ikişer örnek.',created_at:iso(Date.now()-1e8)}];
  const events=[
   {id:'e1',title:'Blaque Denim görüşmesi',type:'gorusme',starts_at:at(1,11),customer_id:'c1',participants:['u1','u2'],source:'manuel',note:'Yeni sezon deri etiketleri.'},
   {id:'e2',title:'Nova Apparel ön görüşme',type:'gorusme',starts_at:at(3,15),customer_id:null,participants:['u1'],source:'site',note:'Siteden gelen başvuru.'},
   {id:'e3',title:'RN-1042 teslim',type:'teslim',starts_at:at(3,9),customer_id:'c2',participants:['u1','u4'],source:'manuel',note:''}];
  const stock=[
   {id:'s1',code:'DR-100',name:'Dana deri, taba',category:'deri',unit:'dm²',qty:4200,min_qty:1500,per_unit:1.2,kinds:['deri'],location:'A-1'},
   {id:'s2',code:'JK-210',name:'Jakron tabaka 0.8 mm',category:'jakron',unit:'adet',qty:300,min_qty:1000,per_unit:1,kinds:['jakron'],location:'A-3'},
   {id:'s3',code:'IP-050',name:'Polyester iplik, siyah',category:'iplik',unit:'kon',qty:64,min_qty:20,per_unit:0.002,kinds:['dokuma'],location:'B-2'},
   {id:'s4',code:'KG-300',name:'Kraft karton 300 gr',category:'kagit',unit:'tabaka',qty:900,min_qty:400,per_unit:0.08,kinds:['hangtag'],location:'B-5'},
   {id:'s5',code:'FL-ALT',name:'Altın varak folyo',category:'sarf',unit:'m',qty:120,min_qty:150,per_unit:0.01,kinds:['hangtag','deri','jakron'],location:'C-1'},
   {id:'s6',code:'MT-017',name:'Pirinç düğme 17 mm',category:'metal',unit:'adet',qty:7400,min_qty:2000,per_unit:1,kinds:['metal'],location:'C-4'},
   {id:'s7',code:'SL-KAL',name:'Silikon kalıp hammadde',category:'silikon',unit:'kg',qty:38,min_qty:15,per_unit:0.004,kinds:['silikon'],location:'C-6'}];
  const moves=[{id:'m1',item_id:'s1',type:'giris',qty:2000,note:'Tedarikçi teslimatı',by:'u3',at:iso(Date.now()-2e8),approved:true}];
  const requests=[{id:'r1',name:'Deniz Aslan',company:'Nova Apparel',email:'deniz@nova.example',collection:'Deri',message:'5.000 adet deri etiket için fiyat almak istiyoruz.',status:'yeni',created_at:iso(Date.now()-1e8)}];
  const issues=[{id:'i1',job_id:'j2',item_id:null,text:'Siyah iplik bu iş için yetmeyebilir, kontrol edilsin.',by:'u4',at:iso(Date.now()-3e7),status:'acik'}];
  const reminders=[{id:'h1',owner:'u1',text:'Blaque Denim renk onayını ara',due_at:at(0,9),done:false,by:'u1'}];
  const outs=[{id:'d1',supplier:'Düğmeci Ali Usta',what:'Pirinç düğme 17 mm, logo baskılı',qty:8000,order_id:'o1',promised_date:day(0),status:'bekleniyor',note:'Telefonda bugüne söz verdi.'},{id:'d2',supplier:'Kaplamacı',what:'Metal plaka nikel kaplama',qty:2000,order_id:null,promised_date:day(6),status:'bekleniyor',note:''}];
  const samples=[{id:'n1',title:'Blaque deri etiket numunesi',kind:'deri',order_id:'o1',original:'',result:'',status:'bekliyor',note:'Çökertme derinliği belirgin olsun.',by:'u1'}];
  return {profiles:people,customers,orders,jobs,events,stock_items:stock,stock_moves:moves,requests,issues,reminders,outsourcing:outs,samples,notes:[]};
 }
 function db(){let d=read(LS);if(!d||!d.jobs||!d.outsourcing){d=seed();write(LS,d)}
  const inbox=read(LS+'-inbox');if(inbox&&inbox.length){d.requests.unshift(...inbox);write(LS,d);try{localStorage.removeItem(LS+'-inbox')}catch{}}
  return d}

 /* ---- Supabase ---- */
 async function api(path,opts={}){
  const r=await fetch(URL_+path,{...opts,headers:{apikey:KEY,'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.access_token}:{}),...(opts.headers||{})}});
  if(r.status===401&&session&&!opts._retry){await refresh();return api(path,{...opts,_retry:1})}
  const t=await r.text();let b=null;try{b=t?JSON.parse(t):null}catch{b=t}
  if(!r.ok)throw new Error((b&&(b.message||b.error_description||b.error||b.msg))||('Sunucu hatası '+r.status));
  return b;
 }
 const keep=s=>{session=s;write(LS+'-s',s)};
 async function refresh(){const rt=session&&session.refresh_token;if(!rt){session=null;return}
  try{keep(await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{Authorization:''},body:JSON.stringify({refresh_token:rt})}))}
  catch{session=null;try{localStorage.removeItem(LS+'-s')}catch{}}}

 const TABLES=['profiles','customers','orders','jobs','events','stock_items','stock_moves','requests','issues','reminders','outsourcing','samples','notes'];

 const S={
  live,KINDS,DEPTS,ORDER_FLOW,JOB_STATES,MOVES,EVENTS,day,iso,
  kind:k=>label(KINDS,k),dept:k=>label(DEPTS,k),orderStatus:k=>label(ORDER_FLOW,k),
  jobStatus:k=>label(JOB_STATES,k),moveType:k=>label(MOVES,k),eventType:k=>label(EVENTS,k),
  get me(){return me},
  isAdmin:()=>!!me&&me.role==='admin',
  canAddCustomer:()=>!!me&&(me.role==='admin'||me.can_add_customers),
  isStock:()=>!!me&&(me.role==='admin'||me.department==='depo'),

  async restore(){
   if(!live){const id=sessionStorage.getItem(LS+'-u');if(!id)return false;me=db().profiles.find(p=>p.id===id)||null;return !!me}
   session=read(LS+'-s');if(!session)return false;await refresh();if(!session)return false;
   return S.loadMe();
  },
  async loadMe(){
   const id=session.user&&session.user.id;
   const rows=await api('/rest/v1/profiles?id=eq.'+id+'&select=*').catch(()=>[]);
   me=rows[0]||{id,full_name:(session.user.email||'').split('@')[0],email:session.user.email,role:'staff',department:'satis',can_add_customers:false};
   return true;
  },
  async signIn(email,password){
   const mail=String(email||'').trim().toLowerCase();
   if(!live){
    const p=db().profiles.find(x=>x.email.toLowerCase()===mail);
    if(!p||password!=='1234')throw new Error('Deneme modunda şifre 1234. Örnek: yonetici@reynas');
    sessionStorage.setItem(LS+'-u',p.id);me=p;return;
   }
   keep(await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:mail,password})}));
   await S.loadMe();
  },
  signOut(){me=null;session=null;try{localStorage.removeItem(LS+'-s');sessionStorage.removeItem(LS+'-u')}catch{}},

  async load(){
   if(!live)return JSON.parse(JSON.stringify(db()));
   const out={};
   await Promise.all(TABLES.map(async t=>{out[t]=await api('/rest/v1/'+t+'?select=*').catch(()=>[])}));
   return out;
  },
  async save(table,row){
   if(!live){const d=db(),l=d[table]||(d[table]=[]);
    if(row.id){const i=l.findIndex(x=>x.id===row.id);if(i>=0)l[i]={...l[i],...row};else l.push(row)}
    else{row.id=uid();row.created_at=row.created_at||iso(Date.now());l.unshift(row)}
    if(!writeOk(LS,d))throw new Error('Bu telefonun deneme hafızası doldu. Fotoğrafları azaltın.');return row}
   if(row.id){const {id,...rest}=row;return (await api('/rest/v1/'+table+'?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(rest)}))[0]}
   return (await api('/rest/v1/'+table,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)}))[0];
  },
  async remove(table,id){
   if(!live){const d=db();d[table]=(d[table]||[]).filter(x=>x.id!==id);write(LS,d);return}
   await api('/rest/v1/'+table+'?id=eq.'+id,{method:'DELETE'});
  },
  nextCode(orders){const n=orders.map(o=>parseInt(String(o.code||'').replace(/\D/g,''),10)).filter(Number.isFinite);return 'RN-'+((n.length?Math.max(...n):1040)+1)},

  /* Bir iş için malzeme ihtiyacını stoktan hesaplar. Sistem eksiği kendisi söyler. */
  need(kind,qty,items){
   return (items||[]).filter(i=>(i.kinds||[]).includes(kind)).map(i=>{
    const need=Math.ceil((Number(qty)||0)*(Number(i.per_unit)||1)*100)/100;
    return {item:i,need,short:Math.max(0,Math.round((need-i.qty)*100)/100),ok:i.qty>=need};
   });
  },
  mine(jobs,user){
   if(!user)return [];
   if(user.role==='admin')return jobs;
   return jobs.filter(j=>(j.assignees||[]).includes(user.id)||((!j.assignees||!j.assignees.length)&&j.kind===user.department));
  },
  /* Fotoğraf: canlıda Supabase Storage'a yüklenir, denemede küçültülmüş hâli kayıtla birlikte tutulur. */
  async upload(dataUrl){
   if(!live)return dataUrl;
   const blob=await (await fetch(dataUrl)).blob(),path='app/'+uid()+'.jpg';
   const r=await fetch(URL_+'/storage/v1/object/portal/'+path,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'image/jpeg'},body:blob});
   if(!r.ok)throw new Error('Fotoğraf yüklenemedi');
   return URL_+'/storage/v1/object/public/portal/'+path;
  },
  resetDemo(){try{localStorage.removeItem(LS);localStorage.removeItem(LS+'-inbox');sessionStorage.removeItem(LS+'-u')}catch{}}
 };
 return S;
})();
