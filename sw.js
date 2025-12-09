// Service Worker для Remont Pro
const CACHE_NAME = 'remont-pro-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Установка
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Активация
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', event => {
  // Только GET запросы
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // 1. Из кэша
        if (cached) return cached;
        
        // 2. Из сети
        return fetch(event.request)
          .then(response => {
            // Кэшируем только успешные ответы
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // 3. Fallback для HTML
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('Оффлайн');
          });
      })
  );
});
