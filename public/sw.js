const CACHE_STATIC_NAME = 'static-v10';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';

self.addEventListener('install', (event) => {
  console.log('[SW] installed.....................', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then((cache) => {
        console.log('[SW] precaching app shell');
        cache.addAll([
          '/',
          '/index.html',
          '/offline.html',
          '/src/js/app.js',
          '/src/js/feed.js',
          '/src/js/promise.js',
          '/src/js/fetch.js',
          '/src/js/material.min.js',
          '/src/css/app.css',
          '/src/css/feed.css',
          '/src/images/main-image.jpg',
          'https://fonts.googleapis.com/css?family=Roboto:400,700',
          'https://fonts.googleapis.com/icon?family=Material+Icons',
          'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'

        ]);
      }))
});

self.addEventListener('activate', (event) => {
  console.log('[SW] activated', event);
  event.waitUntil(
    caches.keys().then(keys => {
      Promise.all(keys.map(key => {
        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
          console.log('[SW] removing old cached', key);
          return caches.delete(key);
        }
      }));
    }));
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {

  // console.log('[SW] fetching...', event);
  const url = 'https://httpbin.org/get';

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then(cache => {
          fetch(event.request).then(res => {
            cache.put(event.request.url, res.clone());
            return res;
          })
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((res) => {
              caches.open(CACHE_DYNAMIC_NAME).then(cache => cache.put(event.request.url, res));
              return res.clone();
            })
            .catch((err) => {
              console.log(err);
              return caches.open(CACHE_STATIC_NAME).then(cache => {
                return cache.match('/offline.html');
              });
            });
        })
    )
  }

});

// self.addEventListener('fetch', (event) => {
//   console.log('[SW] fetching...', event);
//   event.respondWith(
//     caches.match(event.request)
//       .then(response => {
//         if (response) {
//           return response;
//         }
//         return fetch(event.request)
//           .then((res) => {
//             caches.open(CACHE_DYNAMIC_NAME).then(cache => cache.put(event.request.url, res));
//             return res.clone();
//           })
//           .catch((err) => {
//             console.log(err);
//             return caches.open(CACHE_STATIC_NAME).then(cache => cache.match('/offline.html'));
//           });
//       })
//   );
// });

// self.addEventListener('fetch', (event) => {
//   console.log('[SW] fetching...', event);
//   event.respondWith(
//     fetch(event.request)
//       .then((res) => {
//         caches.open(CACHE_DYNAMIC_NAME).then(cache => cache.put(event.request.url, res));
//         return res.clone();
//       })
//       .catch(err => caches.match(event.request)));
// });
