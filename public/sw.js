self.addEventListener('install', (event) => {
	console.log('Service worker installed', event);
});

self.addEventListener('activate', (event) => {
	console.log('Service worker activated', event);
	return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  console.log('serwice worker fetching...', event);
  event.respondWith(fetch(event.request));
});
