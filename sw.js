const CACHE_NAME = 'dl-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './frases.txt',
  './kb/aprender.txt',
  './kb/treinar.txt',
  './kb/raiox.txt'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.map(k=> k===CACHE_NAME?null:caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(e.request).then(resp => resp || fetch(e.request))
    );
  }
});
