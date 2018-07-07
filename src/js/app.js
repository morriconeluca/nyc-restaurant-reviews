((w, d, n) => {
'use strict';

if (!w.fetch) { // Check fetch API support.
  throw new ClientError(400, 'Fetch API Not Supported');
}

// Create useful alias of native functions.
d.gEBI = d.getElementById;
d.cE = d.createElement;

/**
 * Check IntersectionObserver and IntersectionObserverEntry features support.
 */
if (!(w.IntersectionObserver && w.IntersectionObserverEntry &&
'intersectionRatio' in w.IntersectionObserverEntry.prototype)) {
  // If not supported load polyfill.
  addAsyncScript('js/intersection-observer.js');
} else if (!('isIntersecting' in w.IntersectionObserverEntry.prototype)) {
  /* Minimal polyfill for Edge 15's lack of `isIntersecting`. See: https://github.com/w3c/IntersectionObserver/issues/211 */
  Object.defineProperty(w.IntersectionObserverEntry.prototype,
    'isIntersecting', {
    get: function () {
      return this.intersectionRatio > 0;
    }
  });
}

class ClientError {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}

const port = 1337,
DATABASE_URL = `http://localhost:${port}/restaurants`;

let staticMap,
    map,
    tilesLoaded = false;

/**
 * Catch DOMContentLoaded event even the script is loading asynchronously.
 */
function onReady(callback) {
  d.readyState !== 'loading' ? callback() : d.addEventListener('DOMContentLoaded', function f() {
    callback();
    d.removeEventListener('DOMContentLoaded', f);
  });
}

/**
 * MAIN PROCESS.
 */
fetchRestaurants()
  .then(restaurants => {
    if (w.location.pathname === '/') { // === HOME - index.html ===
      (() => {
        // Some useful variables declarations or initializations.
        let markers = [],
            nSelect,
            cSelect,
            rList;

        onReady(() => {
          // Some useful variables initializations.
          staticMap = d.gEBI('static-map'),
          nSelect = d.gEBI('neighborhoods-select'),
          cSelect = d.gEBI('cuisines-select'),
          rList = d.gEBI('restaurants-list');

          if (n.onLine) { // With Internet connection.
            initStaticMap(() => {
              setStaticMap(getResponsiveStaticMapParameters());
            });
            addListenerToStaticMap();
            addSelectListener();
          } else { // Offline.
            showOfflineAlert();
          }
          addRestaurantsHTML(restaurants);
          lazyLoad();
        });

        function setStaticMap(params) {
          staticMap.style.backgroundImage = `url(https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&zoom=12&size=${params.width}x${params.height}&scale=${params.scale}&format=jpg&key=AIzaSyAxfOOcB40yMKfupF4qyfa4hwvhTclZboA)`;
        }

        /**
         * Initialize Google Maps.
         */
        w.initMap = () => {
          let loc = {
            lat: 40.722216,
            lng: -73.987501
          };

          map = new google.maps.Map(d.gEBI('map'), {
            center: loc,
            zoom: 12,
            scrollwheel: false,
            keyboardShortcuts: false // Disable Google Maps keyboard UI.
          });

          getCurrentRestaurants()
            .then(currentRestaurants => {
              addMarkersAndA11y(currentRestaurants);
            });
        };

        /**
         * Get current restaurants by a cuisine and a neighborhood.
         */
        function getCurrentRestaurants() {
          return new Promise(resolve => {
            const neighborhood = nSelect[nSelect.selectedIndex].value,
                  cuisine = cSelect[cSelect.selectedIndex].value;

            let results = restaurants.slice(0);
            if (cuisine != 'all') { // Filter by cuisine.
              results = results.filter(r => r.cuisine_type === cuisine);
            }
            if (neighborhood != 'all') { // Filter by neighborhood.
              results = results.filter(r => r.neighborhood === neighborhood);
            }
            resolve(results);
          });
        }

        /**
         * Add map markers for current restaurants.
         */
        function addMarkersAndA11y(currentRestaurants) {
          currentRestaurants.forEach(restaurant => {
            // Add marker to the map.
            const marker = mapMarkerForRestaurant(restaurant, map);

            addClickListenerToMarker(marker);

            markers.push(marker);
          });

          initMapA11y(() => {
            addA11yToMarkers(null, currentRestaurants, () => {
              const s = (currentRestaurants.length > 1) ? 's' : '';
              /* Relying on the title attribute is currently discouraged as many user agents do not expose the attribute in an accessible manner as required by w3c specifications. https://www.w3.org/TR/html/dom.html#the-title-attribute */
              /* However, many sources say that <iframe> elements in the document must have a title that is not empty to describe their contents to screen reader users. https://dequeuniversity.com/rules/axe/2.2/frame-title */
              d.querySelector('#map iframe').title = `Map shows ${currentRestaurants.length} restaurant${s}`;
            });
          }, true);
        }

        /**
         * Add event listener on select elements to filter results.
         */
        function addSelectListener() {
          nSelect.addEventListener('change', updateRestaurants);
          cSelect.addEventListener('change', updateRestaurants);

          // Get all neighborhoods from all restaurants.
          let neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);

          // Remove duplicates from neighborhoods.
          neighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);

          // Set neighborhoods HTML.
          neighborhoods.forEach(neighborhood => {
            const option = d.cE('option');
            option.innerHTML = neighborhood;
            option.value = neighborhood;
            nSelect.appendChild(option);
          });

          // Get all cuisines from all restaurants.
          let cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);

          // Remove duplicates from cuisines.
          cuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);

          // Set cuisines HTML.
          cuisines.forEach(cuisine => {
            const option = d.cE('option');
            option.innerHTML = cuisine;
            option.value = cuisine;
            cSelect.appendChild(option);
          });
        }

        /**
         * Update page and map markers with current restaurants.
         */
        function updateRestaurants() {
          getCurrentRestaurants()
            .then(currentRestaurants => {
              // Update markers only if Google Maps was initialized.
              if (map) updateMarkers(currentRestaurants);
              updateRestaurantsHTML(currentRestaurants);
              lazyLoad();
            });
        }

        /**
         * Update restaurants map markers.
         */
        function updateMarkers(currentRestaurants) {
          resetMarkers();
          addMarkersAndA11y(currentRestaurants);
        }

        /**
         * Remove restaurants map markers.
         */
        function resetMarkers() {
          // If offline, markers could be not initialized.
          if (markers.length) {
            /* Remove all map markers. When a DOM Element is removed, its listeners are removed from memory too. */
            markers.forEach(m => m.setMap(null));
            markers = [];
          }
        }

        /**
         * Update current restaurants HTML.
         */
        function updateRestaurantsHTML(currentRestaurants) {
          rList.innerHTML = ''; // Remove all restaurants.

          addRestaurantsHTML(currentRestaurants);
        }

        /**
         * Create all restaurants HTML and add them to the webpage.
         */
        function addRestaurantsHTML(currentRestaurants) {
          const notice = d.gEBI('results-notice');
          if (!currentRestaurants.length) {
            notice.innerHTML = 'No restaurants found';
          } else {
            currentRestaurants.forEach(restaurant => {
              rList.appendChild(fillRestaurantHTML(restaurant));
            });
            let s = (currentRestaurants.length > 1) ? 's' : '';
            notice.innerHTML = `${currentRestaurants.length} restaurant${s} found`;
          }
        }

        /**
         * Create restaurant HTML.
         */
        function fillRestaurantHTML(restaurant) {
          const li = d.cE('li'),
                article = d.cE('article'),
                name = d.cE('h3'),
                neighborhood = d.cE('p'),
                strong = d.cE('strong'),
                address = d.cE('address'),
                addressContent = d.cE('p'),
                more = d.cE('p'),
                button = d.cE('a');

          addImageOfTo(restaurant, article, true);

          name.innerHTML = restaurant.name;

          strong.innerHTML = `${restaurant.neighborhood}`;
          neighborhood.appendChild(strong);

          addressContent.innerHTML = restaurant.address;
          address.appendChild(addressContent);

          button.innerHTML = 'View Details';
          button.href = urlForRestaurant(restaurant);
          button.className = 'button';
          /* Relying on the title attribute is currently discouraged as many user agents do not expose the attribute in an accessible manner as required by w3c specifications. https://www.w3.org/TR/html/dom.html#the-title-attribute */
          /* The only very tiny exception a title attribute will be read by a screen reader is if there's absolutely no link anchor text. https://silktide.com/i-thought-title-text-improved-accessibility-i-was-wrong/ */
          /*  One alternative option could be using aria-labelledby, but in this case it's better using the aria-label attribute instead of title. N.B. The aria-label overrides the link text. */
          button.setAttribute('aria-label', `View Details about ${restaurant.name}`);
          more.appendChild(button);

          article.append(name, neighborhood, address, more);

          li.appendChild(article);
          return li;
        }
      })();
    } else { // === RESTAURANT - restaurant.html ===
      (() => {
        // Get current restaurant from page URL.
        const restaurant = (() => {
          const id = new URL(w.location.href).searchParams.get('id');
          if (!id || !restaurants[id - 1]) return; // Exit from function.
          return restaurants[id - 1];
        })();

        if (!restaurant) {
          throw new ClientError(404, 'File Not Found');
        }

        onReady(() => {
          staticMap = d.gEBI('static-map');

          if (n.onLine) { // With Internet connection.
            initStaticMap(() => {
              setStaticMap(getResponsiveStaticMapParameters());
            });
            addListenerToStaticMap();
          } else { // Offline.
            showOfflineAlert();
          }
          fillBreadcrumb(restaurant);
          fillRestaurantInfoHTML(restaurant);
          lazyLoad();
        });

        function setStaticMap(params) {
          staticMap.style.backgroundImage = `url(https://maps.googleapis.com/maps/api/staticmap?size=${params.width}x${params.height}&scale=${params.scale}&markers=color:red%7C${restaurant.latlng.lat},${restaurant.latlng.lng}&format=jpg&key=AIzaSyAxfOOcB40yMKfupF4qyfa4hwvhTclZboA)`;
        }

        /**
         * Initialize Google Maps, called from HTML.
         */
        w.initMap = () => {
          map = new google.maps.Map(d.gEBI('map'), {
            center: restaurant.latlng,
            zoom: 17,
            scrollwheel: false,
            keyboardShortcuts: false // Disable Google Maps keyboard UI.
          });
          // Add marker to the map.
          const marker = mapMarkerForRestaurant(restaurant, map);

          addClickListenerToMarker(marker);

          initMapA11y(() => {
            addA11yToMarkers(restaurant, null, () => {
              /* Relying on the title attribute is currently discouraged as many user agents do not expose the attribute in an accessible manner as required by w3c specifications. https://www.w3.org/TR/html/dom.html#the-title-attribute */
              /* However, many sources say that <iframe> elements in the document must have a title that is not empty to describe their contents to screen reader users. https://dequeuniversity.com/rules/axe/2.2/frame-title */
              d.querySelector('#map iframe').title = `Map shows ${restaurant.name} location`;
            });
          });
        };

        /**
         * Add restaurant name to the breadcrumb navigation menu.
         */
        function fillBreadcrumb(restaurant) {
          const breadcrumb = d.gEBI('breadcrumb'),
                li = d.cE('li'),
                a = d.cE('a'),
                url = urlForRestaurant(restaurant);

          a.href = url;
          /* Here the title attribute is to avoid, and the link text is enough for accessibility. See above about title. */
          a.setAttribute('aria-current', 'page' );
          a.innerHTML = restaurant.name;

          li.appendChild(a);
          breadcrumb.appendChild(li);
        }

        /**
         * Create restaurant HTML and add it to the webpage.
         */
        function fillRestaurantInfoHTML(restaurant) {
          const card = d.querySelector('#restaurant-container> div'),
                name = d.gEBI('restaurant-name'),
                address = d.gEBI('restaurant-address'),
                cuisine = d.gEBI('restaurant-cuisine'),
                strong = d.cE('strong');

          // Add a more meaningful title to the page for better accessibility.
          d.title = `${restaurant.name} - Restaurant Info and Reviews`;

          addImageOfTo(restaurant, card);

          name.innerHTML = restaurant.name;

          address.innerHTML = restaurant.address;

          strong.innerHTML = `Type of Cuisine: ${restaurant.cuisine_type}`;
          cuisine.appendChild(strong);

          // Fill restaurant operating hours.
          if (restaurant.operating_hours) {
            fillRestaurantHoursHTML(restaurant.operating_hours);
          }

          // Fill restorant reviews.
          fillRestaurantReviewsHTML(restaurant.reviews);
        }

        /**
         * Create restaurant operating hours HTML table and add it to the webpage.
         */
        function fillRestaurantHoursHTML(operatingHours) {
          const hours = d.gEBI('restaurant-hours');
          for (let key in operatingHours) {
            const row = d.cE('tr'),
                  day = d.cE('th'),
                  time = d.cE('td');

            day.innerHTML = key;
            day.scope = 'row';

            time.innerHTML = operatingHours[key];

            row.append(day, time);

            hours.appendChild(row);
          }
        }

        /**
         * Create all reviews HTML and add them to the webpage.
         */
        function fillRestaurantReviewsHTML(reviews) {
          const container = d.gEBI('reviews-container'),
                title = d.cE('h2'),
                ul = d.gEBI('reviews-list');

          title.innerHTML = 'Reviews';
          container.appendChild(title);

          if (!reviews) {
            const noReviews = d.cE('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
          }

          reviews.forEach(review => {
            ul.appendChild(createRestaurantReviewHTML(review));
          });

          container.appendChild(ul);
        }

        /**
         * Create review HTML and add it to the webpage.
         */
        function createRestaurantReviewHTML(review) {
          const li = d.cE('li'),
                article = d.cE('article'),
                header = d.cE('header'),
                heading = d.cE('h3'),
                name = d.cE('span'),
                date = d.cE('time'),
                ratingContainer = d.cE('p'),
                rating = d.cE('abbr'),
                comments = d.cE('p');

          name.innerHTML = review.name;

          date.dateTime = formatDatetime(review.date);
          date.innerHTML = review.date;

          heading.append(name, date);

          header.appendChild(heading);

          /* Ratings are often presented either as a set of images or characters, e.g. "***". For these, the <abbr> element is particularly useful, as such characters are an abbreviation for the precise rating, e.g. <abbr class="rating" title="3.0">***</abbr>. http://microformats.org/wiki/hreview */
          /* Relying on the title attribute is currently discouraged as many user agents do not expose the attribute in an accessible manner as required by w3c specifications. https://www.w3.org/TR/html/dom.html#the-title-attribute */
          /* The only very tiny exception a title attribute will be read by a screen reader is if there's absolutely no link anchor text. https://silktide.com/i-thought-title-text-improved-accessibility-i-was-wrong/ */
          /* The title is an HTML global attribute, so it can be used on any HTML element. The screen readers behaviour is the same for all elements with the title attribute. For these reasons, in this case, the inner text node was left blank. The stars are rendered using ::before and ::after pseudo elements. --> */
          rating.title = `Rating: ${review.rating} of 5`;
          rating.className = `stars-${review.rating}`;
          ratingContainer.appendChild(rating);

          comments.innerHTML = review.comments;

          article.append(header, ratingContainer, comments);

          li.appendChild(article);

          return li;
        }

        /**
         * Get a representation of date string in a machine-readable format.
         */
        function formatDatetime(date) {
          const d = new Date(date),
              year = d.getFullYear();

          let month = (d.getMonth() + 1) + '',
              day = d.getDate() + '';

          if (month.length < 2) month = '0' + month;
          if (day.length < 2) day = '0' + day;

          return [year, month, day].join('-');
        }
      })();
    }
  })
  .catch(error => {
    console.log(error);
  });

// === DATABASE HELPER FUNCTIONS ===

/**
 * Fetch all restaurants with proper error handling.
 */
function fetchRestaurants() {
  // Check if indexedDB is supported.
  if (w.indexedDB) {
    // Open a connection with indexedDB.
    const request = w.indexedDB.open('nyc_rr_data', 1);

    // Create the object store.
    request.onupgradeneeded = event => {
      const db = event.target.result;
      db.createObjectStore('restaurants', {keyPath: 'id'});
    };

    // The fetchRestaurants function must return a Promise.
    return new Promise(resolve => {

      request.onsuccess = event => {
        const db = event.target.result;
        // Open a transaction and obtain a reference to the object store.
        const store = db.transaction(['restaurants'], 'readwrite').objectStore('restaurants');

        resolve(new Promise(resolve => {
          // Use cursors to retrieve all objects in the object store and add them to an array.
          let IDBRestaurants = [];
          store.openCursor().onsuccess = event => {
            let cursor = event.target.result;
            // Check if the object store is empty.
            if (!cursor && !IDBRestaurants.length) {
              // Fetch from the network.
              resolve(fetch(DATABASE_URL)
                .then(response => {
                  if (!response.ok) {
                    throw Error(`Request failed. Returned status of ${response.statusText}`);
                  }
                  return response.json();
                })
                .then(restaurants => {
                  // Open a transaction.
                  const store = db.transaction(['restaurants'], 'readwrite').objectStore('restaurants');
                  // Save data into the object store.
                  restaurants.forEach(restaurant => {
                    store.add(restaurant);
                  });
                  return restaurants;
                })
                .catch(error => {
                  console.log(error);
                }));
            } else if (cursor) { // Check the cursor.
              // Save cursor value in an array.
              IDBRestaurants.push(cursor.value);
              cursor.continue();
            } else {
              // Return all data from indexedDB.
              resolve(IDBRestaurants);
            }
          };
          store.openCursor().onerror = event => {
            // Add a fallback.
            console.log(event.target.error);
            resolve(onlyFetchRestaurants());
          };
        }));
      };
      request.onerror = event=> {
        /* IndexedDB storage in browsers' privacy modes only lasts in-memory until the incognito session is closed (Private Browsing mode for Firefox and Incognito mode for Chrome, but in Firefox this is not implemented yet as of Nov 2015 so you can't use IndexedDB in Firefox Private Browsing at all). https://bugzilla.mozilla.org/show_bug.cgi?id=781982 */
        console.log(event.target.error);
        resolve(onlyFetchRestaurants());
      };
    });
  } else { // If indexedDB is not supported.
    return onlyFetchRestaurants();
  }
}

function onlyFetchRestaurants() {
  return fetch(DATABASE_URL)
      .then(response => {
        if (!response.ok) {
          throw Error(`Request failed. Returned status of ${response.statusText}`);
        }
        return response.json();
      })
      .then(restaurants => {
        return restaurants;
      })
      .catch(error => {
        console.log(error);
      });
}

/**
 * Map marker for a restaurant.
 */
function mapMarkerForRestaurant(restaurant, map) {
  const marker = new google.maps.Marker({
    position: restaurant.latlng,
    title: `${restaurant.name} ${restaurant.neighborhood}`,
    url: urlForRestaurant(restaurant),
    map: map,
    animation: google.maps.Animation.DROP
  });
  return marker;
}

/**
 * Return restaurant page URL.
 */
function urlForRestaurant(restaurant) {
  return (`/restaurant.html?id=${restaurant.id}`);
}

/**
 * Return restaurant image URL.
 */
function imageUrlForRestaurant(restaurant, width) {
  return `/img/${restaurant.photograph}-${width}w.jpg`;
}

/**
 * Return restaurant image srcset.
 */
function formatSrcset(restaurant) {
  let srcsetStr = [];
  for (let w = 3; w < 9; w++) {
    srcsetStr.push(`${imageUrlForRestaurant(restaurant, w*100)} ${w*100}w`);
  }
  return srcsetStr.join(', ');
}

// === COMMON FUNCTIONS ===

function addAsyncScript(src) {
  const script = d.cE('script');
  script.src = src;
  script.setAttribute('async', '');
  d.head.appendChild(script);
}

/**
 * Initialize Google Maps static API.
 */
function initStaticMap(callback) {
  let doit = setTimeout(callback);

  // Reboot Google Maps static API on window resize end.
  w.addEventListener('resize', () => {
    clearTimeout(doit);
    doit = setTimeout(callback, 60);
  });
}

/**
 * Get parameters to make responsive the free Google Maps static API.
 */
function getResponsiveStaticMapParameters() {
  let width = staticMap.clientWidth,
      height = staticMap.clientHeight;

  /* The free Google Maps static API returns 640x640 maximum image resolution, and 1280x1280 with scale 2. */
  const scale = width > 640 || height > 640 ? 2 : 1,
  aspectRatio = width > height ? +(width/height).toFixed(6) : +(height/width).toFixed(6);
  if (width > height) {
    width = width > 640 ? 640 : width;
    height = Math.round(width/aspectRatio);
  } else {
    height = height > 640 ? 640 : height;
    width = Math.round(height/aspectRatio);
  }

  return {
    width,
    height,
    scale
  };
}

/**
 * Add event listeners to static map for loading dynamic map API.
 */
function addListenerToStaticMap() {
  staticMap.style.cursor = 'pointer';

  addListenerTo(staticMap, (moveFocus) => {
    if (!n.onLine) { // Check if offline.
      showOfflineAlert('x');
    } else {
      loadMap();
      swapMap(moveFocus);
    }
  }, true);
}

/**
 * Add listeners to an element for tracking click and keydown events.
 */
function addListenerTo(element, callback, remove) {
  // Remove both event listeners.
  const removeListeners = () => {
    element.removeEventListener('click', doit);
    element.removeEventListener('keydown', f);
  };

  // Function fire on click event.
  const doit = (event, moveFocus) => {
    event.preventDefault();
    event.stopPropagation();
    callback(moveFocus);
    if (remove) removeListeners();
  };

  // Function fire on keydown event.
  const f = event => {
    if (event.keyCode === 13) {
      doit(event, true);
    }
  };

  // Add both event listeners.
  element.addEventListener('click', doit);
  element.addEventListener('keydown', f);
}

/**
 * Show an alert to inform map is not available offline.
 */
function showOfflineAlert(button) {
  const offlineAlert = d.cE('div'),
        paragraphAlert = d.cE('p');

  offlineAlert.id = 'offline-alert';
  offlineAlert.setAttribute('role', 'alert');
  paragraphAlert.innerHTML = '⚠ You are offline, map is not available.';
  offlineAlert.appendChild(paragraphAlert);

  if (button) { // Add close button if requested.
    const p = d.cE('p'),
          close = d.cE('button');

    close.type = 'button';
    close.innerHTML = 'CLOSE';
    p.appendChild(close);
    offlineAlert.appendChild(p);

    addListenerTo(close, () => {
      offlineAlert.remove();
      staticMap.removeAttribute('class');
      addListenerToStaticMap();
    });
  }

  staticMap.className = 'offline';
  staticMap.appendChild(offlineAlert);
  staticMap.style.cursor = 'default';
}

/**
 * Load dynamic map API asynchronously from HTML.
 */
function loadMap() {
  addAsyncScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyAxfOOcB40yMKfupF4qyfa4hwvhTclZboA&libraries=places&callback=initMap');
}

function swapMap(moveFocus) {
  d.gEBI('map').style.display = 'block';
  staticMap.removeAttribute('tabindex');
  staticMap.removeAttribute('role');
  staticMap.removeAttribute('aria-label');
  if (moveFocus) {
    setTimeout(() => {
      d.querySelector('#map div[tabindex="0"]').focus();
    }, 1000);
  }
}

/**
 * Add click listener to marker.
 */
function addClickListenerToMarker(marker) {
  marker.addListener('click', () => {
    w.location.href = marker.url;
  });
}

function initMapA11y(callback, isIndex) {
  // Create an overlay object for assign an id to markerLayer.
  const overlay = new google.maps.OverlayView();
  overlay.draw = function () {
    this.getPanes().markerLayer.id='markerLayer';
  };
  overlay.setMap(map);

  if (!tilesLoaded) {
    // This event fires when the visible tiles have finished loading.
    const listenerTiles = map.addListener('tilesloaded', () => {
      callback();
      addA11yToMap(isIndex);
      tilesLoaded = true;
      google.maps.event.removeListener(listenerTiles);
    });
  } else {
    callback();
  }
}

/**
 * Make markers focusable.
 */
function addA11yToMarkers(restaurant, currentRestaurants, callback) {
  setTimeout(() => {
    // Markers are coded with area tags.
    const areas = d.querySelectorAll('[id^="gmimap"]> area'),
    /* Seems impossible to style marker directly, but to any marker corresponds an img tag and the order is the same. */
          layers = d.querySelectorAll('#markerLayer img');

    for (let i = 0; i < areas.length; i++) {
      areas[i].tabIndex = 0;
      areas[i].addEventListener('focus', () => {
        layers[i].classList.add('focused');
      });
      areas[i].addEventListener('blur', () => {
        layers[i].classList.remove('focused');
      });

      // Google Maps allows only click event on markers.
      areas[i].addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
          restaurant = restaurant || currentRestaurants[i];
          w.location.href = urlForRestaurant(restaurant);
        }
      });
    }
    callback();
  }, 150);
}

/**
 * Fix some accessibility issues with Google Maps API.
 */
function addA11yToMap(isIndex) {
  const skipMap = d.cE('a'),
        mapLabel = d.cE('h2'),
        divWithTabindex = d.querySelector('#map div[tabindex="0"]'),
        mapDOMElement = d.gEBI('map');

  // Add a skip map link.
  skipMap.className = 'skip-link button';
  skipMap.href = isIndex ? '#filter-options' : '#restaurant-container';
  skipMap.innerHTML = 'Skip the map';
  staticMap.insertBefore(skipMap, staticMap.firstChild);

  // Add a map label.
  mapLabel.id = 'map-label';
  mapLabel.className = 'sr-only';
  mapLabel.innerHTML = 'Google Maps Widget: shows restaurants location';
  staticMap.insertBefore(mapLabel, staticMap.firstChild);

  // Add aria-lebelledBy to the div focusable with tab.
  divWithTabindex.setAttribute('aria-labelledby', 'map-label');

  // Highlight when map DOM element is onfocus.
  divWithTabindex.addEventListener('focus', () => {
    mapDOMElement.classList.add('focused');
  });

  // Remove highlight when map DOM element is onblur.
  divWithTabindex.addEventListener('blur', () => {
    mapDOMElement.classList.remove('focused');
  });

  /* Enable Google Maps keyboard UI, when map DOM element or any of his children is onfocus. */
  mapDOMElement.addEventListener('focus', () => {
    map.setOptions({keyboardShortcuts: true});
  }, true);

  /* Disable Google Maps keyboard UI, when map DOM element or any of his children is onblur. */
  mapDOMElement.addEventListener('blur', () => {
    map.setOptions({keyboardShortcuts: false});
  }, true);
}

/**
 * Add restaurant image HTML.
 */
function addImageOfTo(restaurant, parent, isIndex) {
  const image = d.cE('img');
  image.className = 'restaurant-img';

  /* Adding alternative text for images is the first principle of web accessibility. [...] Every image must have an alt attribute. This is a requirement of HTML standard (with perhaps a few exceptions in HTML5). Images without an alt attribute are likely inaccessible. In some cases, images may be given an empty or null alt attribute (e.g., alt=""). https://webaim.org/techniques/alttext/ */
  image.alt = restaurant.photoDescription || (isIndex ? `The ${restaurant.cuisine_type} Restaurant ${restaurant.name}` : `The Restaurant ${restaurant.name} in ${restaurant.neighborhood}`);

  // Add just a transparent space with right ratio as placeholder.
  image.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"></svg>';

  if (!restaurant.photograph) { // Check if there is not a photo.
    image.src = '/img/image-fallback.svg';
    parent.insertBefore(image, parent.firstChild);
  } else {
    const picture = d.cE('picture'),
          jpg = d.cE('source'),
          webp = d.cE('source');

    jpg.dataset.srcset = formatSrcset(restaurant);
    webp.dataset.srcset = jpg.dataset.srcset.replace(/w.jpg/g, 'w.webp');

    jpg.sizes = `(min-width: 1366px) calc((1366px - ${isIndex ? '5rem) / 4' : '4rem) / 3'}), (min-width: 1080px) calc((100vw - 4rem) / 3), (min-width: 700px) calc((100vw - 3rem) / 2), calc(100vw - 2rem)`;
    webp.sizes = jpg.sizes;


    image.dataset.src = imageUrlForRestaurant(restaurant, 800);
    image.classList.add('lazy');

    // Remove source tag for webp images if they are not supported.
    image.onerror = () => {webp.remove();};

    picture.append(webp, jpg, image);

    parent.insertBefore(picture, parent.firstChild);
  }
}

/**
 * Lazy load images of restaurants.
 */
function lazyLoad() {
  const lazyImages = [].slice.call(d.querySelectorAll('.lazy'));

  if (!lazyImages) return; // Exit from function if there are not .lazy images.

  let observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { // Check if the image is visible.
        const image = entry.target,
              webp = image.parentElement.children[0],
              jpg = image.parentElement.children[1];

        webp.srcset = webp.dataset.srcset;
        jpg.srcset = jpg.dataset.srcset;
        image.src = image.dataset.src;

        // Make the image visible.
        image.style.opacity = 1;

        webp.removeAttribute('data-srcset');
        jpg.removeAttribute('data-srcset');
        image.removeAttribute('data-src');

        // Remove observer from image.
        observer.unobserve(image);
      }
    });
  });

  // Attach observer to images.
  lazyImages.forEach(image => {
    observer.observe(image);
  });
}
})(window, document, navigator);