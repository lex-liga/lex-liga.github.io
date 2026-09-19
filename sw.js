/* Lex Liga service worker – app shell + notifications */

var CACHE = 'lex-liga-v5';

var ASSETS = [
  './',
  './index.html',
  './futsal.html',
  './badminton.html',
  './fixtures.html',
  './teams.html',
  './gallery.html',

  './css/styles.css',
  './css/extras.css',

  './js/supabase-config.js',
  './js/home-app.js',
  './js/app.js',
  './js/badminton-app.js',
  './js/badminton-rules.js',
  './js/fixtures-app.js',
  './js/teams-data.js',
  './js/announce.js',
  './js/live-extras.js',
  './js/mobile-nav.js',
  './js/pwa-register.js',

  './manifest.json',

  './assets/lexliga_logo_transparent.png',
  './assets/badminton-hero.png',
  './assets/badminton-player.svg',
  './assets/bm-logo.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return cache.addAll(ASSETS).catch(function (err) {
          console.warn(
            'Some assets could not be cached:',
            err
          );
        });
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .catch(function () {
        return caches.match(event.request, {
          ignoreSearch: true
        }).then(function (response) {
          return response || caches.match('./index.html');
        });
      })
  );
});

self.addEventListener('message', function (event) {
  var data = event.data || {};

  if (data.type === 'NOTIFY' && data.title) {
    event.waitUntil(
      self.registration.showNotification(
        data.title,
        {
          body: data.body || '',
          icon:
            data.icon ||
            './assets/lexliga_logo_transparent.png',
          badge:
            data.icon ||
            './assets/lexliga_logo_transparent.png',
          tag:
            data.tag ||
            'lex-liga',
          renotify: true,
          vibrate: [120, 60, 120],
          data: {
            url:
              data.url ||
              './index.html'
          }
        }
      )
    );
  }
});

self.addEventListener(
  'notificationclick',
  function (event) {
    event.notification.close();

    var url =
      (
        event.notification.data &&
        event.notification.data.url
      ) ||
      './index.html';

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function (list) {

        for (var i = 0; i < list.length; i++) {
          if (
            list[i].url &&
            'focus' in list[i]
          ) {
            return list[i].focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
);
