((s) => {
  'use strict';
  const SW_VERSION = 1,
    ORIGIN = 'NYC-RR-',
    STATIC_CACHE = `${ORIGIN}static-cache-v${SW_VERSION}`,
    DYNAMIC_CACHE = `${ORIGIN}dynamic-cache-v${SW_VERSION}`,
    CORS_DYNAMIC_CACHE = `${ORIGIN}cors-dynamic-cache-v${SW_VERSION}`,
    RESOURCES_TO_CACHE = [
      '/',
      '/index.html',
      '/restaurant.html',
      '/css/styles.css',
      '/js/main.js',
      '/js/dbhelper.js',
      '/js/index.js',
      '/js/restaurant_info.js',
      '/img/image-placeholder.svg',
      '/404.html',
      '/offline.html',
      /* Unfortunally Service Worker 'fetch' event does not trigger for favicons in Chrome. This bug is still open. https://bugs.chromium.org/p/chromium/issues/detail?id=448427 */
      '/favicon.ico'
  ];

  /**
   * Cache the main assets while installing SW.
   */
  s.addEventListener('install', event => {
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then(cache => {
          return cache.addAll(RESOURCES_TO_CACHE);
        })
        .catch(error => {
          console.log('[SW] Installation failed, error:', error);
        })
    );
  });

  /**
   * Remove outdated caches while a new SW is activating.
   */
  s.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.filter(cacheName => {
              // Caches are shared across the whole origin.
              return (cacheName.startsWith(ORIGIN) && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE);
            }).map(cacheName => {
              return caches.delete(cacheName);
            })
          );
        })
        .then(() => {
          /* Allow the active service worker to set itself as the controller for all clients within its scope. This triggers a "controllerchange" event on navigator.serviceWorker in any clients that become controlled by this service worker. https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim */
          return s.clients.claim();
        })
        .catch(error => {
          console.log('[SW] Activation failed, error:', error);
        })
    );
  });

  /**
   * Cache other resources dynamically with a fallback to the network.
   */
  s.addEventListener('fetch', event => {
    /* The fetch handler serves responses only for same-origin resources. */
    if (event.request.url.startsWith(s.location.origin)) {
      if (event.request.url.indexOf('restaurant.html') > -1) {
        if (event.request.url.search(/id=./) === -1) {
          event.respondWith(
            caches.match('/404.html')
          );
          return;
        }
        event.respondWith(
          caches.match('/restaurant.html')
        );
      } else {
        event.respondWith(
          caches.match(event.request)
            .then(response => {
              if (response) return response;
              return caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  return fetch(event.request)
                    .then(response => {
                      if (response.status === 404) {
                        return caches.match('/404.html');
                      }
                      cache.put(event.request, response.clone())
                        .catch(error => {
                          /* In some cases dynamic caching fails: e.g. it's not possible to cache a resource because a "DOMException: Quota exceeded" error fires. */
                          console.log('[SW] Dynamic caching failed, error', error, event.request.url);
                        });
                      return response;
                    })
                    .catch(error => {
                      console.log('[SW] Fetch request failed, error', error);
                      return caches.match('/offline.html');
                    });
                })
                .catch(error => {
                  console.log('[SW] Opening dynamic cache failed, error', error);
                });
            })
            .catch(error => {
              console.log('[SW] Something failed while matching a request, error', error);
            })
        );
      }
    } else if (event.request.url.startsWith('https://maps.googleapis.com/maps/api/staticmap')) {
      event.respondWith(
        caches.match(event.request).then((response) => {
          if (response) return response;
          /* Opening Devtools triggers "only-if-cached" request which cannot be handled by Service Worker. https://bugs.chromium.org/p/chromium/issues/detail?id=823392 */
          /* This is a workaround: https://github.com/paulirish/caltrainschedule.io/pull/51/commits/82d03d9c4468681421321db571d978d6adea45a7 */
          if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
            return; // Skip the request.
          }
          return caches.open(CORS_DYNAMIC_CACHE).then((cache) => {
            return fetch(event.request).then((response) => {
              cache.put(event.request, response.clone())
                .catch((error) => {
                  /* In some cases dynamic caching fails: e.g. it's not possible to cache a resource because a "DOMException: Quota exceeded" error fires. Resources called through the 'chrome-extension' protocol produce annoying errors too. */
                  if (event.request.mode === 'no-cors' || event.request.url.startsWith('chrome-extension')) {
                    console.log('[SW] Dynamic caching failed, skipped error', error, event.request.url);
                    return; // Skip the error.
                  }
                  caches.delete(CORS_DYNAMIC_CACHE); // Clear the cache.
                  console.log('[SW] Dynamic caching failed, error', error, event.request.url, 'The cache is cleared with CORS resources.');
                });
              return response;
            });
          });
        })
      );
    }
  });

  /**
   * Listen messages from client.
   */
  s.addEventListener('message', function(event) {
    if (event.data.action === 'refresh') {
      event.waitUntil(
        s.skipWaiting() // Activate a new SW that is waiting.
          .then(() => {
            /* After receiving a message from one client, the new SW turns the message to all clients. */
            sendMessageToClients('refreshed');
          })
          .catch(error => {
            console.log('[SW] Something failed while skipping wait, error', error);
          })
      );
    }
    if (event.data.action === 'dismiss') {
      event.waitUntil(
        /* After receiving a message from one client, the current SW turns the message to all clients. */
        sendMessageToClients('dismissed')
      );
    }
  });

  /**
   * Send a message to all clients.
   */
  function sendMessageToClients(message) {
    /* Get a list of SW Client objects, and send a message to everyone. */
    s.clients.matchAll()
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({action: message});
        });
      })
      .catch(error => {
        console.log('[SW] Something failed while sending message to clients, error', error);
      });
  }
})(self);