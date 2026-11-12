/* Web sitesi ile portal arasındaki köprü. Site formları ve stüdyodaki sipariş buradan portala düşer. */
window.ReynasBridge=(()=>{
 const cfg=window.REYNAS_CONFIG||{},URL_=(cfg.SUPABASE_URL||'').replace(/\/+$/,''),KEY=cfg.SUPABASE_ANON_KEY||'',live=!!(URL_&&KEY);
 const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 async function send(req,imageDataUrl){
  const row={type:'mesaj',status:'yeni',...req};
  if(!live){ /* bağlantı kurulmamışsa yalnızca aynı cihazdaki deneme portalına düşer */
   try{const k='reynas-portal-inbox',l=JSON.parse(localStorage.getItem(k)||'[]');l.unshift({...row,id:uid(),image:imageDataUrl||'',created_at:new Date().toISOString()});localStorage.setItem(k,JSON.stringify(l))}catch{}
   return {ok:false,demo:true};
  }
  const h={apikey:KEY,Authorization:'Bearer '+KEY};
  if(imageDataUrl){try{const blob=await (await fetch(imageDataUrl)).blob(),path='site/'+uid()+'.jpg',r=await fetch(URL_+'/storage/v1/object/portal/'+path,{method:'POST',headers:{...h,'Content-Type':'image/jpeg'},body:blob});if(r.ok)row.image=URL_+'/storage/v1/object/public/portal/'+path}catch{}}
  const r=await fetch(URL_+'/rest/v1/requests',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify(row)});
  return {ok:r.ok};
 }
 return {live,send};
})();
