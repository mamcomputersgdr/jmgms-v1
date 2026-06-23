/* ══════════════════════════════════════════
   JMGMS — Service Worker (Offline PWA)
══════════════════════════════════════════ */

const CACHE_NAME = 'jmgms-v1.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/print.css',
  './js/db.js',
  './js/utils.js',
  './js/auth.js',
  './js/seed.js',
  './js/families.js',
  './js/payments.js',
  './js/expenses.js',
  './js/funds.js',
  './js/accounts.js',
  './js/reports.js',
  './js/announcements.js',
  './js/settings.js',
  './js/app.js',
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first strategy
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
