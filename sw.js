/* Lex Liga service worker – cache + notifications */
var CACHE = 'lex-liga-v3';
var ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './css/extras.css',
  './js/supabase-config.js',
  './js/home-app.js',
  './js/announce.js',
  './js/live-extras.js',
  './js/mobile-nav.js',
  './manifest.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match('./index.html');
      });
    })
  );
});

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type === 'NOTIFY' && data.title) {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body || '',
        icon: data.icon || './assets/lexliga_logo_transparent.png',
        badge: data.icon || './assets/lexliga_logo_transparent.png',
        tag: data.tag || 'lex-liga',
        renotify: true,
        vibrate: [120, 60, 120],
        data: { url: data.url || './index.html' }
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url && 'focus' in list[i]) {
          return list[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
