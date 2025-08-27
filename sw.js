const CACHE_NAME = 'dl-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './frases.txt',
  './kb/meta.json',
  './kb/prompts/aprender.json',
  './kb/prompts/treinar.json',
  './kb/prompts/raiox.json',
  './kb/snippets/civil.json'
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
