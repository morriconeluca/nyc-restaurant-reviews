const SW_VERSION = 2,
  ORIGIN = 'NYC-RR-',
  STATIC_CACHE = `${ORIGIN}static-cache-v${SW_VERSION}`,
  RESOURCE_TO_CACHE = [
    '/',
    'index.html',
    'restaurant.html',
    '/css/normalize.css',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js'
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
 * Removing outdated caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          // Caches are shared across the whole origin.
          return (cacheName.startsWith(ORIGIN) && cacheName !== STATIC_CACHE);
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).catch((error) => {
      console.log('[SW] Activation failed, error:', error);
    })
  );
});

self.addEventListener('fetch', (event) => {

});