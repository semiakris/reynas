/* Müşteri hesabı: Supabase kimlik doğrulaması. Ayar yoksa dürüstçe bağlı olmadığını söyler. */
(()=>{
 const cfg=window.REYNAS_CONFIG||{},URL_=(cfg.SUPABASE_URL||'').replace(/\/+$/,''),KEY=cfg.SUPABASE_ANON_KEY||'',live=!!(URL_&&KEY),K='reynas-musteri';
 const $=s=>document.querySelector(s),out=$('#acct-out'),inn=$('#acct-in'),fin=$('#f-in'),fup=$('#f-up');
 const menu=$('.menu'),nav=$('#nav');if(menu)menu.onclick=()=>{const o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',o)};
 document.querySelectorAll('.acct-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.acct-tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));fin.hidden=b.dataset.tab!=='in';fup.hidden=b.dataset.tab!=='up'});
 const say=(f,t,ok)=>{const m=f.querySelector('.msg');m.textContent=t;m.classList.toggle('ok',!!ok)};
 const T={off:'Müşteri girişi henüz açılmadı. Lütfen bizimle iletişime geçin.',bad:'E-posta ya da şifre hatalı.',used:'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.',fail:'İşlem tamamlanamadı. Lütfen tekrar deneyin.',mail:'Hesabınız oluşturuldu. E-postanıza gelen bağlantıyla onaylayın.'};
 function show(){let s=null;try{s=JSON.parse(localStorage.getItem(K)||'null')}catch{}
  if(s&&s.email){out.hidden=true;inn.hidden=false;inn.querySelector('[data-acct-name]').textContent=s.name||s.email;inn.querySelector('[data-acct-company]').textContent=s.company||''}else{out.hidden=false;inn.hidden=true}}
 const keep=(j,extra)=>{const u=j.user||{},m=u.user_metadata||{};localStorage.setItem(K,JSON.stringify({email:u.email,name:m.name||(extra&&extra.name)||'',company:m.company||(extra&&extra.company)||'',token:j.access_token||''}));show()};
 async function call(path,body){const r=await fetch(URL_+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});let j={};try{j=await r.json()}catch{}return{ok:r.ok,j}}
 fin.onsubmit=async e=>{e.preventDefault();if(!live)return say(fin,T.off);const d=new FormData(fin),b=fin.querySelector('button');b.disabled=true;say(fin,'');
  try{const{ok,j}=await call('/auth/v1/token?grant_type=password',{email:d.get('email'),password:d.get('password')});ok&&j.access_token?keep(j):say(fin,T.bad)}catch{say(fin,T.fail)}finally{b.disabled=false}};
 fup.onsubmit=async e=>{e.preventDefault();if(!live)return say(fup,T.off);const d=new FormData(fup),b=fup.querySelector('button'),extra={name:d.get('name'),company:d.get('company')};b.disabled=true;say(fup,'');
  try{const{ok,j}=await call('/auth/v1/signup',{email:d.get('email'),password:d.get('password'),data:{...extra,kind:'customer'}});
   if(ok&&j.access_token)keep(j,extra);else if(ok)say(fup,T.mail,true);else say(fup,/registered|exists/i.test(JSON.stringify(j))?T.used:T.fail)}catch{say(fup,T.fail)}finally{b.disabled=false}};
 $('#acct-exit').onclick=()=>{localStorage.removeItem(K);show()};
 const tm=$('time[data-zone]');if(tm){const tick=()=>{try{tm.textContent=new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit',timeZone:tm.dataset.zone}).format(new Date())}catch{}};tick();setInterval(tick,30000)}
 show();
})();
