const CACHE_NAME = 'dl-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',

  // BK prompts
  './kb/aprender.txt',
  './kb/treinar.txt',
  './kb/raiox.txt',

  // Frases aleatórias (20 linhas cada)
  './kb/greetings.txt',
  './kb/choice_ack.txt',
  './kb/thinking.txt',

  // Mídia usada no chat
  './icons/thinking.gif'
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
