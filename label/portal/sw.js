/* Çevrimdışı çalışma: uygulama kabuğu önbellekte tutulur, veriler her zaman ağdan gelir. */
const CACHE='reynas-portal-v3';
const SHELL=['./','index.html','app.css','app.js','store.js','config.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/logo.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin)return;           // veri istekleri önbelleğe girmez
 e.respondWith(caches.match(e.request).then(hit=>{
  const net=fetch(e.request).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res}).catch(()=>hit);
  return hit||net;
 }));
});
