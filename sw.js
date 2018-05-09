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
    '/js/restaurant_info.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(RESOURCE_TO_CACHE);
      })
      .catch((error) => {
        console.log('[SW] Installation failed, error:', error);
      })
  );
});

/**
 * Remove outdated caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => {
            // Caches are shared across the whole origin.
            return (cacheName.startsWith(ORIGIN) && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE);
          }).map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        /* Allow the active service worker to set itself as the controller for all clients within its scope. This triggers a "controllerchange" event on navigator.serviceWorker in any clients that become controlled by this service worker. https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim */
        return self.clients.claim();
      })
      .catch((error) => {
        console.log('[SW] Activation failed, error:', error);
      })
  );
});

/**
 * Cache falling back to the network.
 */
self.addEventListener('fetch', (event) => {
  /* The fetch handler serves responses only for same-origin resources and skip requests for 'restaurant.html' to avoid duplicates in cache. */
  if (event.request.url.startsWith(self.location.origin)
  && (event.request.url.indexOf('restaurant.html') === -1)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) return response;
          return caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              return fetch(event.request)
                .then((response) => {
                  cache.put(event.request, response.clone())
                    .catch((error) => {
                      /* In some cases dynamic caching fails: e.g. it's not possible to cache a resource because a "DOMException: Quota exceeded" error fires. */
                      console.log('[SW] Dynamic caching failed, error', error, event.request.url);
                    });
                  return response;
                })
                .catch((error) => {
                  console.log('[SW] Fetch request failed, error', error);
                });
            })
            .catch((error) => {
              console.log('[SW] Opening dynamic cache failed, error', error);
            });
        })
        .catch((error) => {
          console.log('[SW] Something failed while matching a request, error', error);
        })
    );
  }
});