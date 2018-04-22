let restaurants,
  neighborhoods,
  cuisines,
  tilesLoaded = false;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false,
    keyboardShortcuts: false
  });
  initResponsiveMap();
  updateRestaurants();
}

function initResponsiveMap() {
  const listenerTiles = google.maps.event.addListener(map, 'tilesloaded', () => {
    const mapFocusable = document.querySelector('#map div[tabindex="0"]');
    const mapElement = document.getElementById('map');
    mapFocusable.setAttribute('aria-labelledby', 'map-label');
    mapFocusable.addEventListener('focus', () => {
      mapElement.classList.add('focused');
    });
    mapFocusable.addEventListener('blur', () => {
      mapElement.classList.remove('focused');
    });
    mapElement.addEventListener('focus', () => {
      self.map.setOptions({keyboardShortcuts: true});
    }, true);
    mapElement.addEventListener('blur', () => {
      self.map.setOptions({keyboardShortcuts: false});
    }, true);
    google.maps.event.removeListener(listenerTiles);
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  /* Remove all map markers. When a DOM Element is removed, its listeners are removed from memory too. */
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const notice = document.getElementById('results-notice');
  let result = '';
  if (!restaurants.length) {
    result = 'No restaurants found';
  } else {
    const ul = document.getElementById('restaurants-list');
    let counter = 0;
    restaurants.forEach(restaurant => {
      ul.append(createRestaurantHTML(restaurant));
      counter++;
    });
    let s = (counter > 1) ? 's' : '';
    result = `${counter} restaurant${s} found`;
  }
  notice.innerHTML = result;

  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const article = document.createElement('article');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = `The ${restaurant.cuisine_type} Restaurant ${restaurant.name}`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  article.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  article.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = `<strong>${restaurant.neighborhood}</strong>`;
  article.append(neighborhood);

  const address = document.createElement('address');
  const addressInner = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.append(addressInner);
  article.append(address);

  const moreContainer = document.createElement('p');
  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.className = 'button';
  /* Relying on the title attribute is currently discouraged as many user agents do not expose the attribute in an accessible manner as required by w3c specifications. https://www.w3.org/TR/html/dom.html#the-title-attribute */
  /* The only very tiny exception a title attribute will be read by a screen reader is if there's absolutely no link anchor text. https://silktide.com/i-thought-title-text-improved-accessibility-i-was-wrong/ */
  /*  One alternative option could be using aria-labelledby, but in this case it's better using the aria-label attribute instead of title. N.B. The aria-label overrides the link text. */
  more.setAttribute('aria-label', `View Details about ${restaurant.name}`);
  moreContainer.append(more);
  article.append(moreContainer);

  li.append(article);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  let urls = [];
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
    urls.push(marker.url);
  });
  // Create an overlay object for assign an id to markerLayer
  var gmOverlay = new google.maps.OverlayView();
  gmOverlay.draw = function () {
    this.getPanes().markerLayer.id='markerLayer';
  };
  gmOverlay.setMap(map);
  if (!tilesLoaded) {
    // This event fires when the visible tiles have finished loading.
    const listenerTiles = google.maps.event.addListener(map, 'tilesloaded', () => {
      makeMapAccessible(urls);
      tilesLoaded = true;
      google.maps.event.removeListener(listenerTiles);
    });
  } else {
    makeMapAccessible(urls);
  }
}

function makeMapAccessible(urls) {
  setTimeout(() => {
    const areas = document.querySelectorAll('[id^="gmimap"]> area');
    const layers = document.querySelectorAll('#markerLayer img');
    for (let i = 0; i < areas.length; i++) {
      areas[i].tabIndex = 0;
      areas[i].addEventListener('focus', () => {
        layers[i].classList.add('focused');
      });
      areas[i].addEventListener('blur', () => {
        layers[i].classList.remove('focused');
      });
      areas[i].addEventListener('keydown', (e) => {
        if (e.keyCode === 13) window.location.href = urls[i];
      });
    }
    const s = (urls.length > 1) ? 's' : '';
    /* Relying on the title attribute is currently discouraged. See above. However, many sources say that <iframe> elements in the document must have a title that is not empty to describe their contents to screen reader users. https://dequeuniversity.com/rules/axe/2.2/frame-title */
    document.querySelector('#map iframe').title = `Map shows ${urls.length} restaurant${s}`;
  }, 150);
}