const CACHE = 'trading-companion-v0.3.1';
const ASSETS = [
  './',
  './index.html',
  './trade.html',
  './journal.html',
  './stats.html',
  './checklist.html',
  './manifest.json',
  './assets/app-icon.svg',
  './assets/icons.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './css/style.css',
  './css/dashboard.css',
  './css/wizard.css',
  './css/journal.css',
  './css/stats.css',
  './js/app.js',
  './js/storage.js',
  './js/media.js',
  './js/logic.js',
  './js/dashboard.js',
  './js/trade.js',
  './js/journal.js',
  './js/stats.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE && (
            key.startsWith('trade-checklist-') ||
            key.startsWith('trading-companion-')
          ))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
