((w, d, n) => {
  'use strict';

  if (!w.fetch) {
    console.log('Fetch API not supported');
    return;
  }

  let map;

  /**
   * Initialize Google map, called from HTML with proper error handling.
   */
  w.initMap = () => {
    if (!n.onLine) { // Check if offline.
      return; // Exit from function.
    }
    fetchRestaurantFromURL()
      .then(restaurant => {
        if (!restaurant) {
          fillError404HTML();
          return; // Exit from function.
        }
        map = new google.maps.Map(d.getElementById('map'), {
          center: restaurant.latlng,
          zoom: 16,
          scrollwheel: false,
          keyboardShortcuts: false // Disable Google Maps keyboard UI.
        });
        DBHelper.mapMarkerForRestaurant(restaurant, map);
        initMapAccessibility();
        const listenerTiles = map.addListener('tilesloaded', () => {
          setTimeout(() => {
            /* Relying on the title attribute is currently discouraged as many user agents do not expose the attribute in an accessible manner as required by w3c specifications. https://www.w3.org/TR/html/dom.html#the-title-attribute */
            /* However, many sources say that <iframe> elements in the document must have a title that is not empty to describe their contents to screen reader users. https://dequeuniversity.com/rules/axe/2.2/frame-title */
            d.querySelector('#map iframe').title = `Map shows ${restaurant.name} location`;
          }, 150);
          // Remove event listener.
          google.maps.event.removeListener(listenerTiles);
        });
        fillBreadcrumb(restaurant);
      })
      .catch(error => {
        console.log(error);
      });
  };

  /**
   * Fetch the page content when offline, as soon as the page is loaded.
   */
  if (!n.onLine) { // Check if offline.
    d.addEventListener('DOMContentLoaded', () => {
      initPage();
    });
  }

  /**
   * Initialize the page whithout initialize Google Maps.
   */
  function initPage() {
    fetchRestaurantFromURL()
      .then(restaurant => {
        if (!restaurant) {
          fillError404HTML();
          return; // Exit from function.
        }
        fillBreadcrumb(restaurant);
        fillMapOfflineAlert();
      })
      .catch(error => {
        console.log(error);
      });
  }

  function fillError404HTML() {
    // Prepare restaurant.html to receive new html codes.
    d.querySelector('title').innerHTML = 'Page Not Found - Restaurant Reviews';
    d.body.removeChild(d.querySelector('a.skip-link'));
    d.body.removeChild(d.querySelector('nav[aria-label="Breadcrumb"]'));
    const main = d.querySelector('main');
    main.innerHTML = '';
    d.body.className = 'error-page';
    main.removeAttribute('class');

    // Create new elements to build a 404 page.
    const div = d.createElement('div');
    div.setAttribute('role', 'alert');
    const header = d.createElement('header');
    const h1 = d.createElement('h1');
    h1.innerHTML = 'Error 404';
    const p = d.createElement('p');
    p.innerHTML = 'Sorry, but the page you were trying to view does not exist.';
    header.append(h1);
    header.append(p);

    const aContainer = d.createElement('p');
    const a = d.createElement('a');
    a.href = '/';
    a.className = 'button';
    a.innerHTML = 'Go to our home page';
    aContainer.append(a);

    div.append(header);
    div.append(aContainer);
    main.append(div);
  }

  /**
   * Set map offline alert.
   */
  function fillMapOfflineAlert() {
    const mapDOMElement = d.getElementById('map');
    const mapOfflineAlert = d.createElement('p');
    mapOfflineAlert.innerHTML = '⚠ You are offline, map is not available.';
    mapDOMElement.classList.add('offline');
    mapDOMElement.setAttribute('role', 'alert');
    mapDOMElement.append(mapOfflineAlert);
  }

  /**
   * Get current restaurant from page URL with proper error handling.
   */
  function fetchRestaurantFromURL() {
    const id = getParameterByName('id');
    if (!id) {
      return; // No id found in URL.
    }
    return DBHelper.fetchRestaurantById(id)
      .then(restaurant => {
        if (restaurant) {
          fillRestaurantHTML(restaurant);
          return restaurant;
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * Get a parameter by name from page URL.
   */
  function getParameterByName(name) {
    const url = new URL(w.location.href);
    return url.searchParams.get(name);
  }

  /**
   * Create restaurant HTML and add it to the webpage.
   */
  function fillRestaurantHTML(restaurant) {
    // Add a more meaningful title to the page for better accessibility.
    const title = d.querySelector('title');
    title.innerHTML = `${restaurant.name} - Restaurant Info and Reviews`;

    const name = d.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = d.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = d.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant, 800);
    image.sizes = '(min-width: 1366px) calc((1366px - 4rem) / 3), (min-width: 1080px) calc((100vw - 4rem) / 3), (min-width: 700px) calc((100vw - 3rem) / 2), calc(100vw - 2rem)';
    image.srcset = DBHelper.formatSrcset(restaurant);
    /* Adding alternative text for images is the first principle of web accessibility. [...] Every image must have an alt attribute. This is a requirement of HTML standard (with perhaps a few exceptions in HTML5). Images without an alt attribute are likely inaccessible. In some cases, images may be given an empty or null alt attribute (e.g., alt=""). https://webaim.org/techniques/alttext/ */
    image.alt = restaurant.photoDescription || `The Restaurant ${restaurant.name} in ${restaurant.neighborhood}`;

    const cuisine = d.getElementById('restaurant-cuisine');
    const strong = d.createElement('strong');
    strong.innerHTML = `Type of Cuisine: ${restaurant.cuisine_type}`;
    cuisine.appendChild(strong);

    // Fill operating hours.
    if (restaurant.operating_hours) {
      fillRestaurantHoursHTML(restaurant.operating_hours);
    }
    // Fill reviews.
    fillReviewsHTML(restaurant.reviews);
  }

  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   */
  function fillRestaurantHoursHTML(operatingHours) {
    const hours = d.getElementById('restaurant-hours');
    for (let key in operatingHours) {
      const row = d.createElement('tr');

      const day = d.createElement('th');
      day.innerHTML = key;
      day.scope = 'row';
      row.appendChild(day);

      const time = d.createElement('td');
      time.innerHTML = operatingHours[key];
      row.appendChild(time);

      hours.appendChild(row);
    }
  }

  /**
   * Create all reviews HTML and add them to the webpage.
   */
  function fillReviewsHTML(reviews) {
    const container = d.getElementById('reviews-container');
    const title = d.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = d.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = d.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  }

  /**
   * Create review HTML and add it to the webpage.
   */
  function createReviewHTML(review) {
    const li = d.createElement('li');
    const article = d.createElement('article');

    const header = d.createElement('header');
    const heading = d.createElement('h3');

    const name = d.createElement('span');
    name.innerHTML = review.name;
    heading.appendChild(name);

    const date = d.createElement('time');
    date.dateTime = formatDatetime(review.date);
    date.innerHTML = review.date;
    heading.appendChild(date);

    header.appendChild(heading);
    article.appendChild(header);

    const ratingContainer = d.createElement('p');
    /* Ratings are often presented either as a set of images or characters, e.g. "***". For these, the <abbr> element is particularly useful, as such characters are an abbreviation for the precise rating, e.g. <abbr class="rating" title="3.0">***</abbr>. http://microformats.org/wiki/hreview */
    const rating = d.createElement('abbr');
    /* Relying on the title attribute is currently discouraged as many user agents do not expose the attribute in an accessible manner as required by w3c specifications. https://www.w3.org/TR/html/dom.html#the-title-attribute */
    /* The only very tiny exception a title attribute will be read by a screen reader is if there's absolutely no link anchor text. https://silktide.com/i-thought-title-text-improved-accessibility-i-was-wrong/ */
    /* The title is an HTML global attribute, so it can be used on any HTML element. The screen readers behaviour is the same for all elements with the title attribute. For these reasons, in this case, the inner text node was left blank. The stars are rendered using ::before and ::after pseudo elements. --> */
    rating.title = `Rating: ${review.rating} of 5`;
    rating.className = `stars-${review.rating}`;
    ratingContainer.appendChild(rating);
    article.appendChild(ratingContainer);

    const comments = d.createElement('p');
    comments.innerHTML = review.comments;
    article.appendChild(comments);

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
      skipMap.href = '#restaurant-container';
      skipMap.innerHTML = 'Skip the map';
      mapContainer.insertAdjacentElement('afterbegin', skipMap);

      // Add a map label.
      const mapLabel = d.createElement('h2');
      mapLabel.id = 'map-label';
      mapLabel.className = 'sr-only';
      mapLabel.innerHTML = 'Google Maps Widget: shows the restaurant location';
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
   * Add restaurant name to the breadcrumb navigation menu
   */
  function fillBreadcrumb(restaurant) {
    const breadcrumb = d.getElementById('breadcrumb');
    const li = d.createElement('li');
    const a = d.createElement('a');
    const url = DBHelper.urlForRestaurant(restaurant);
    a.href = url;

    /* Here the title attribute is to avoid, and the link text is enough for accessibility. See above about title. */
    a.setAttribute('aria-current', 'page' );
    a.innerHTML = restaurant.name;
    li.appendChild(a);
    breadcrumb.appendChild(li);
  }

})(window, document, navigator);