// Service Worker - direito.love (GitHub Pages)
// Pré-cache de assets estáticos + BK (.txt) + GIFs thinking

const CACHE_NAME = 'dl-v15';

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

  // Frases aleatórias
  './kb/greetings.txt',
  './kb/choice_ack.txt',
  './kb/thinking.txt',

  // GIFs (pensando) - ajuste esta lista se remover/renomear arquivos
  './icons/thinking1.gif',
  './icons/thinking2.gif',
  './icons/thinking3.gif',
  './icons/thinking4.gif',
  './icons/thinking5.gif',
  './icons/thinking6.gif',
  './icons/thinking7.gif',
  './icons/thinking8.gif',
  './icons/thinking9.gif',
  './icons/thinking10.gif'
];

// Instala e pré-carrega assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
});

// Responde do cache primeiro; se não tiver, busca na rede
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Só intercepta requisições do mesmo domínio
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
