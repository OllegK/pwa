const CACHE_STATIC_NAME = 'static-v14';
const CACHE_DYNAMIC_NAME = 'dynamic-v8';
const STATIC_FILES = [
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
];

// const trimCache = (cacheName, maxItems) => {
//   caches.open(cacheName).then(cache => {
//     cache.keys().then(keys => {
//       console.log(keys, keys.length);
//       if (keys.length > maxItems) {
//         console.log('deleted');
//         cache.delete(keys[0]).then(trimCache(cacheName, maxItems))
//       }
//     })
//   })
// }

self.addEventListener('install', (event) => {
  console.log('[SW] installed.....................', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then((cache) => {
        console.log('[SW] precaching app shell');
        cache.addAll(STATIC_FILES);
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

// const isInArray = (string, array) => array.map(el => self.location.origin + el).includes(string);

// const isInCache = (requestURL, cacheArr) => cacheArr.some(url => url === requestURL.replace(self.origin, ''));

const isInArray = (string, array) => {
  let cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    console.log('matched ', string, cachePath);
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('fetch', (event) => {

  // console.log('[SW] fetching...', event);
  const url = 'http://pwagram-950b3.firebaseio.com/posts.json';

  if (event.request.url.indexOf(url) > -1) {
    console.log('1st', event.request.url);
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then( (cache) => {
          return fetch(event.request)
            .then( (res) => {
              // trimCache(CACHE_DYNAMIC_NAME, 3);
              cache.put(event.request.url, res.clone());
              return res;
            });
        })

      // caches.open(CACHE_DYNAMIC_NAME)
      //   .then(cache => {
      //     fetch(event.request).then(res => {
      //       trimCache(CACHE_DYNAMIC_NAME, 3); // should be await / async ? not as we deleting from the beginning
      //       cache.put(event.request.url, res.clone());
      //       return res;
      //     })
      //   })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    console.log('2nd', event.request.url);
    event.respondWith(
      caches.match(event.request).then(response => response)
    );
  } else {
    console.log('3rd', event.request.url);
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((res) => {
              // trimCache(CACHE_DYNAMIC_NAME, 3); // should be await / async ? not as we deleting from the beginning
              caches.open(CACHE_DYNAMIC_NAME).then(cache => cache.put(event.request.url, res));
              return res.clone();
            })
            .catch((err) => {
              console.log(err);
              return caches.open(CACHE_STATIC_NAME).then(cache => {
                if (event.request.headers.get('accept').includes('text/html')) {
                  return cache.match('/offline.html');
                }
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
