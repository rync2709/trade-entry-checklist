const CACHE = 'trading-companion-v0.8.3';
const ASSETS = [
  './',
  './index.html',
  './trade.html',
  './journal.html',
  './stats.html',
  './database.html',
  './weekly.html',
  './planner.html',
  './watchlist.html',
  './tools.html',
  './checklist.html',
  './manifest.json',
  './assets/app-icon.svg',
  './assets/icons.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './css/style.css',
  './css/style.css?v=0.8.0',
  './css/dashboard.css?v=0.8.3',
  './css/wizard.css',
  './css/journal.css?v=0.8.2',
  './css/stats.css',
  './css/database.css',
  './css/weekly.css',
  './css/planner.css',
  './css/watchlist.css',
  './css/tools.css?v=0.8.1',
  './js/app.js',
  './js/storage.js',
  './js/storage.js?v=0.8.0',
  './js/storage.js?v=0.8.2',
  './js/storage.js?v=0.8.3',
  './js/media.js',
  './js/logic.js',
  './js/dashboard.js?v=0.8.3',
  './js/trade.js',
  './js/journal.js?v=0.8.2',
  './js/stats.js',
  './js/database.js',
  './js/weekly.js',
  './js/planner.js',
  './js/watchlist.js',
  './js/tools.js?v=0.8.1'
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
