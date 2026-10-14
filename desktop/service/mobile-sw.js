/* Cache the application shell only. Chats, images, reports and API replies never enter this cache. */
const CACHE = 'mrmak-mobile-shell-0.5';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.add('/mobile/'))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mrmak-mobile-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !(url.pathname === '/mobile/' || url.pathname.startsWith('/assets/'))) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(async () => (await caches.match(event.request)) || Response.error()));
});
