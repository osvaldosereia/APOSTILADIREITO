const CACHE_NAME = 'dl-hotfix-999';

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

  // GIFs thinking (10 opções)
  './icons/thinking1.gif',
  './icons/thinking2.gif',
  './icons/thinking3.gif',
  './icons/thinking6.gif',
  './icons/thinking7.gif',
  './icons/thinking8.gif',
  './icons/thinking10.gif'
];

// Instala o SW e faz o pré-cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
});

// Ativa o SW e limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k === CACHE_NAME ? null : caches.delete(k)))
    ))
  );
});

// Intercepta fetch e serve do cache ou rede
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(resp => resp || fetch(e.request))
    );
  }
});
