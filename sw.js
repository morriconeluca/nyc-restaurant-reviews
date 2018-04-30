const SW_VERSION = 1,
  ORIGIN = 'NYC-RR-',
  STATIC_CACHE = `${ORIGIN}static-cache-v${SW_VERSION}`,
  DYNAMIC_CACHE = `${ORIGIN}dynamic-cache-v${SW_VERSION}`,
  RESOURCE_TO_CACHE = [
    '/',
    'index.html',
    'restaurant.html',
    '/css/normalize.css',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(RESOURCE_TO_CACHE);
    }).catch((error) => {
      console.log('[SW] Installation failed, error:', error);
    })
  );
});

/**
 * Remove outdated caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          // Caches are shared across the whole origin.
          return (cacheName.startsWith(ORIGIN) && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE);
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).catch((error) => {
      console.log('[SW] Activation failed, error:', error);
    })
  );
});

/**
 * Cache falling back to the network.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      /* Opening Devtools triggers "only-if-cached" request which cannot be handled by Service Worker. https://bugs.chromium.org/p/chromium/issues/detail?id=823392 */
      /* This is a workaround: https://github.com/paulirish/caltrainschedule.io/pull/51/commits/82d03d9c4468681421321db571d978d6adea45a7 */
      if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
        return; // Skip the request.
      }
      return caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(event.request).then((response) => {
          cache.put(event.request, response.clone())
            .catch((error) => {
              /* In some cases dynamic caching fails: e.g. it's not possible to cache every Google maps resources. Some no-cors requests break the code if the error is not handled. Resources called through the 'chrome-extension' protocol produce annoying errors too. */
              if (event.request.mode === 'no-cors' || event.request.url.startsWith('chrome-extension')) {
                return; // Skip the error.
              }
              console.log('[SW] Dynamic caching failed, error', error);
            });
          return response;
        });
      });
    })
  );
});