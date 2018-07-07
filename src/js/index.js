'use strict';

((w, d, n) => {

  if (!w.fetch) {
    console.log('Fetch API not supported');
    return;
  }

  let map,
    markers = [],
    tilesLoaded = false;

  /**
   * Initialize Google map, called from HTML.
   */
  w.initMap = () => {
    if(!n.onLine) return;
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    map = new google.maps.Map(d.getElementById('map'), {
      center: loc,
      zoom: 12,
      scrollwheel: false,
      keyboardShortcuts: false // Disable Google Maps keyboard UI.
    });
    updateRestaurants();
    initMapAccessibility();
  };

  /**
   * Fetch neighborhoods and cuisines as soon as the page is loaded.
   */
  onReady(() => {
    initStaticMap();
    addSelectListener();
    fetchNeighborhoods();
    fetchCuisines();
    updateRestaurants();
    if (!n.onLine) { // Check if offline.
      fillMapOfflineAlert();
    }
  });

  /**
   * Catch DOMContentLoaded event even the script is loading asynchronously.
   */
  function onReady(callback) {
    d.readyState !== 'loading' ? callback() : d.addEventListener('DOMContentLoaded', function ifDOMLoaded() {
      callback();
      d.removeEventListener('DOMContentLoaded', ifDOMLoaded);
    });
  }

  /**
   * Initialize and make responsive Google maps static API.
   */
  function initResponsiveFreeStaticMap() {
    const staticMap = d.getElementById('static-map');
    let w = staticMap.clientWidth,
      h = staticMap.clientHeight;
    /* The free Google maps static API returns 640x640 maximum image resolution, and 1280x1280 with scale 2. */
    const scale = w > 640 || h > 640 ? 2 : 1,
    aspectRatio = w > h ? +(w/h).toFixed(6) : +(h/w).toFixed(6);
    if (w > h) {
      w = w > 640 ? 640 : w;
      h = Math.round(w/aspectRatio);
    } else {
      h = h > 640 ? 640 : h;
      w = Math.round(h/aspectRatio);
    }
    staticMap.style.backgroundImage = `url(https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&zoom=12&size=${w}x${h}&scale=${scale}&format=jpg&key=AIzaSyAxfOOcB40yMKfupF4qyfa4hwvhTclZboA)`;
  }

  function swapMapListener() {
    const staticMap = d.getElementById('static-map');
    staticMap.addEventListener('click', function fun() {
      loadMap();
      swapMap();
      staticMap.removeEventListener('click', fun);
    });

    staticMap.addEventListener('keydown', function fun(e) {
      if (e.keyCode === 13) {
        loadMap();
        swapMap();
        staticMap.removeEventListener('keydown', fun);
      }
    });

    function loadMap() {
      const script = d.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAxfOOcB40yMKfupF4qyfa4hwvhTclZboA&libraries=places&callback=initMap';
      script.setAttribute('async', '');
      d.getElementsByTagName('head')[0].appendChild(script);
    }

    function swapMap() {
      d.getElementById('map').style.display = 'block';
      staticMap.removeAttribute('tabindex');
      staticMap.removeAttribute('role');
      staticMap.removeAttribute('aria-label');
      setTimeout(() => {
        d.querySelector('#map div[tabindex="0"]').focus();
      }, 1000);
    }
  }

  function initStaticMap() {
    swapMapListener();
    initResponsiveFreeStaticMap();
    // Reboot Google maps static API on window resize.
    w.addEventListener('resize', () => {
      requestAnimationFrame(initResponsiveFreeStaticMap);
    });
  }

  /**
   * Set map offline alert.
   */
  function fillMapOfflineAlert() {
    const staticMap = d.getElementById('static-map');
    const mapOfflineAlert = d.createElement('p');
    mapOfflineAlert.setAttribute('role', 'alert');
    mapOfflineAlert.innerHTML = '⚠ You are offline, map is not available.';
    staticMap.classList.add('offline');
    staticMap.appendChild(mapOfflineAlert);
  }

  /**
   * Add event listener on select elements to filter results.
   */
  function addSelectListener() {
    const nSelect = d.getElementById('neighborhoods-select');
    const cSelect = d.getElementById('cuisines-select');
    nSelect.addEventListener('change', updateRestaurants);
    cSelect.addEventListener('change', updateRestaurants);
  }

  /**
   * Fetch all neighborhoods and set their HTML with proper error handling.
   */
  function fetchNeighborhoods() {
    DBHelper.fetchNeighborhoods()
      .then(fillNeighborhoodsHTML)
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Set neighborhoods HTML.
   */
  function fillNeighborhoodsHTML(neighborhoods) {
    const select = d.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
      const option = d.createElement('option');
      option.innerHTML = neighborhood;
      option.value = neighborhood;
      select.appendChild(option);
    });
  }

  /**
   * Fetch all cuisines and set their HTML with proper error handling.
   */
  function fetchCuisines() {
    DBHelper.fetchCuisines()
      .then(fillCuisinesHTML)
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * Set cuisines HTML.
   */
  function fillCuisinesHTML(cuisines) {
    const select = d.getElementById('cuisines-select');
    cuisines.forEach(cuisine => {
      const option = d.createElement('option');
      option.innerHTML = cuisine;
      option.value = cuisine;
      select.appendChild(option);
    });
  }

  /**
   * Fix some accessibility issue with Google map.
   */
  function initMapAccessibility() {
    // This event fires when the visible tiles have finished loading.
    const listenerTiles = map.addListener('tilesloaded', () => {
      const mapContainer = d.getElementById('map-container');

      // Add a skip map link.
      const skipMap = d.createElement('a');
      skipMap.className = 'skip-link button';
      skipMap.href = '#filter-options';
      skipMap.innerHTML = 'Skip the map';
      mapContainer.insertAdjacentElement('afterbegin', skipMap);

      // Add a map label.
      const mapLabel = d.createElement('h2');
      mapLabel.id = 'map-label';
      mapLabel.className = 'sr-only';
      mapLabel.innerHTML = 'Google Maps Widget: shows restaurants location';
      mapContainer.insertAdjacentElement('afterbegin', mapLabel);

      // Add aria-lebelledBy to the div focusable with tab.
      const div = d.querySelector('#map div[tabindex="0"]');
      div.setAttribute('aria-labelledby', 'map-label');

      const mapDOMElement = d.getElementById('map');

      // Highlight when map DOM element is onfocus.
      div.addEventListener('focus', () => {
        mapDOMElement.classList.add('focused');
      });

      // Remove highlight when map DOM element is onblur.
      div.addEventListener('blur', () => {
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

      // Remove event listener.
      google.maps.event.removeListener(listenerTiles);
    });
  }

  /**
   * Update page and map for current restaurants with proper error handling.
   */
  function updateRestaurants() {
    const cSelect = d.getElementById('cuisines-select');
    const nSelect = d.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
      .then(restaurants => {
        resetRestaurants();
        fillRestaurantsHTML(restaurants);
      })
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  function resetRestaurants() {
    // Remove all restaurants.
    const ul = d.getElementById('restaurants-list');
    ul.innerHTML = '';
    // If offline, markers could be not initialized.
    if (markers.length) {
      /* Remove all map markers. When a DOM Element is removed, its listeners are removed from memory too. */
      markers.forEach(m => m.setMap(null));
      markers = [];
    }
  }

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  function fillRestaurantsHTML(restaurants) {
    const notice = d.getElementById('results-notice');
    if (!restaurants.length) {
      notice.innerHTML = 'No restaurants found';
    } else {
      const ul = d.getElementById('restaurants-list');
      restaurants.forEach(restaurant => {
        ul.appendChild(createRestaurantHTML(restaurant));
      });
      let s = (restaurants.length > 1) ? 's' : '';
      notice.innerHTML = `${restaurants.length} restaurant${s} found`;
    }
    if (n.onLine) addMarkersToMap(restaurants);
  }

  /**
   * Create restaurant HTML.
   */
  function createRestaurantHTML(restaurant) {
    const li = d.createElement('li');
    const article = d.createElement('article');

    const image = d.createElement('img');
    image.src = '/img/image-placeholder.svg';
    image.className = 'restaurant-img';
    /* Adding alternative text for images is the first principle of web accessibility. [...] Every image must have an alt attribute. This is a requirement of HTML standard (with perhaps a few exceptions in HTML5). Images without an alt attribute are likely inaccessible. In some cases, images may be given an empty or null alt attribute (e.g., alt=""). https://webaim.org/techniques/alttext/ */
    image.alt = restaurant.photoDescription || `The ${restaurant.cuisine_type} Restaurant ${restaurant.name}`;

    if (!restaurant.photograph) {
      article.appendChild(image);
    } else {
      const picture = d.createElement('picture');
      const jpgSource = d.createElement('source');
      const webpSource = d.createElement('source');
      jpgSource.sizes = '(min-width: 1366px) calc((1366px - 5rem) / 4), (min-width: 1080px) calc((100vw - 4rem) / 3), (min-width: 700px) calc((100vw - 3rem) / 2), calc(100vw - 2rem)';
      webpSource.sizes = jpgSource.sizes;
      jpgSource.srcset = DBHelper.formatSrcset(restaurant);
      webpSource.srcset = jpgSource.srcset.replace(/w.jpg/g, 'w.webp');

      picture.appendChild(image);
      article.appendChild(picture);

      // Simple lazy loading implementation on scroll.
      w.addEventListener('scroll', function lazyLoad() {
        image.insertAdjacentElement('beforebegin', webpSource);
        image.insertAdjacentElement('beforebegin', jpgSource);
        image.src = DBHelper.imageUrlForRestaurant(restaurant, 800);
        w.removeEventListener('scroll', lazyLoad);
      });
    }

    const name = d.createElement('h3');
    name.innerHTML = restaurant.name;
    article.appendChild(name);

    const neighborhood = d.createElement('p');
    const strong = d.createElement('strong');
    strong.innerHTML = `${restaurant.neighborhood}`;
    neighborhood.appendChild(strong);
    article.appendChild(neighborhood);

    const address = d.createElement('address');
    const addressContent = d.createElement('p');
    addressContent.innerHTML = restaurant.address;
    address.appendChild(addressContent);
    article.appendChild(address);

    const more = d.createElement('p');
    const button = d.createElement('a');
    button.innerHTML = 'View Details';
    button.href = DBHelper.urlForRestaurant(restaurant);
    button.className = 'button';
    /* Relying on the title attribute is currently discouraged as many user agents do not expose the attribute in an accessible manner as required by w3c specifications. https://www.w3.org/TR/html/dom.html#the-title-attribute */
    /* The only very tiny exception a title attribute will be read by a screen reader is if there's absolutely no link anchor text. https://silktide.com/i-thought-title-text-improved-accessibility-i-was-wrong/ */
    /*  One alternative option could be using aria-labelledby, but in this case it's better using the aria-label attribute instead of title. N.B. The aria-label overrides the link text. */
    button.setAttribute('aria-label', `View Details about ${restaurant.name}`);
    more.appendChild(button);
    article.appendChild(more);

    li.appendChild(article);
    return li;
  }

  /**
   * Add markers for current restaurants to the map.
   */
  function addMarkersToMap(restaurants) {
    restaurants.forEach(restaurant => {
      // Add marker to the map.
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, map);
      marker.addListener('click', () => {
        w.location.href = marker.url;
      });
      markers.push(marker);
    });
    // Create an overlay object for assign an id to markerLayer.
    const overlay = new google.maps.OverlayView();
    overlay.draw = function () {
      this.getPanes().markerLayer.id='markerLayer';
    };
    overlay.setMap(map);
    if (!tilesLoaded) {
      // This event fires when the visible tiles have finished loading.
      const listenerTiles = map.addListener('tilesloaded', () => {
        addAccessibilityToMarkers(restaurants);
        tilesLoaded = true;
        google.maps.event.removeListener(listenerTiles);
      });
    } else {
      addAccessibilityToMarkers(restaurants);
    }
  }

  /**
   * Make markers focusable.
   */
  function addAccessibilityToMarkers(restaurants) {
    setTimeout(() => {
      // Markers are coded with area tags.
      const areas = d.querySelectorAll('[id^="gmimap"]> area');
      /* Seems impossible to style marker directly, but to any marker corresponds an img tag and the order is the same. */
      const layers = d.querySelectorAll('#markerLayer img');
      for (let i = 0; i < areas.length; i++) {
        areas[i].tabIndex = 0;
        areas[i].addEventListener('focus', () => {
          layers[i].classList.add('focused');
        });
        areas[i].addEventListener('blur', () => {
          layers[i].classList.remove('focused');
        });
        // Google Maps allows only click event on markers.
        areas[i].addEventListener('keydown', (e) => {
          if (e.keyCode === 13) {
            w.location.href = DBHelper.urlForRestaurant(restaurants[i]);
          }
        });
      }
      const s = (restaurants.length > 1) ? 's' : '';
      /* Relying on the title attribute is currently discouraged. See above. However, many sources say that <iframe> elements in the d must have a title that is not empty to describe their contents to screen reader users. https://dequeuniversity.com/rules/axe/2.2/frame-title */
      d.querySelector('#map iframe').title = `Map shows ${restaurants.length} restaurant${s}`;
    }, 150);
  }

})(window, document, navigator);