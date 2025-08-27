// PWA service worker — sem GIF — v7
const CACHE = 'ad-chatbot-v7';
const ASSETS = [
'./',
'./index.html?v=7',
'./manifest.json?v=7',
'./icons/icon-192.png',
'./icons/icon-512.png'
];


self.addEventListener('install', (e) => {
self.skipWaiting();
e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});


self.addEventListener('activate', (e) => {
e.waitUntil(
caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE && caches.delete(k))))
);
self.clients.claim();
});


// Network-first p/ HTML; cache-first p/ estáticos
self.addEventListener('fetch', (e) => {
const req = e.request;
const url = new URL(req.url);


if (req.mode === 'navigate' || req.destination === 'document') {
e.respondWith(
fetch(req).then(res => {
const copy = res.clone();
caches.open(CACHE).then(c => c.put('./index.html?v=7', copy));
return res;
}).catch(() => caches.match('./index.html?v=7'))
);
return;
}


if (url.pathname.endsWith('/manifest.json') || url.search.includes('v=7')) {
e.respondWith(
caches.match(req).then(cached =>
cached || fetch(req).then(res => {
const copy = res.clone();
caches.open(CACHE).then(c => c.put(req, copy));
return res;
})
)
);
return;
}


if (url.pathname.includes('/icons/')) {
e.respondWith(
caches.match(req).then(cached =>
cached || fetch(req).then(res => {
const copy = res.clone();
caches.open(CACHE).then(c => c.put(req, copy));
return res;
})
)
);
}
});
