const CACHE = 'cj-v1';
const ASSETS = [
  './', './index.html', './styles.css', './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/heart.svg','./icons/gpt.svg','./icons/gemini.svg','./icons/perplexity.svg'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  const { request } = e;
  // network-first para html; cache-first para estáticos
  if (request.mode === 'navigate'){
    e.respondWith(fetch(request).catch(()=>caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(request).then(r=> r || fetch(request)));
  }
});
