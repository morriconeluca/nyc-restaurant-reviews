/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000; // Change this to your server port.
    return `http://localhost:${port}/data/restaurants.json`;
  }

  /**
   * Fetch all restaurants with proper error handling.
   */
  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL)
      .then((response) => {
        if (!response.ok) {
          throw Error(`Request failed. Returned status of ${response.statusText}`);
        }
        return response.json();
      })
      .then((json) => {
        return json.restaurants;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Get all neighborhoods from all restaurants.
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods.
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
        return uniqueNeighborhoods;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Get all cuisines from all restaurants.
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines.
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
        return uniqueCuisines;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        let results = restaurants;
        if (cuisine != 'all') { // Filter by cuisine.
          results = results.filter(r => r.cuisine_type === cuisine);
        }
        if (neighborhood != 'all') { // Filter by neighborhood.
          results = results.filter(r => r.neighborhood === neighborhood);
        }
        return results;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Fetch a restaurant by its ID with proper error handling.
   */
  static fetchRestaurantById(id) {
    // Fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        const restaurant = restaurants.find(r => r.id == id);
        if (!restaurant) { // Restaurant does not exist in the database.
          throw Error('Restaurant does not exist');
        }
        return restaurant; // Got the restaurant.
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, width) {
    const extension = restaurant.photograph.split('.').pop();
    const name = restaurant.photograph.slice(0, restaurant.photograph.indexOf(`.${extension}`));
    return (`/img/${name}-${width}w.${extension}`);
  }

  /**
   * Restaurant image srcset.
   */
  static formatSrcset(restaurant) {
    let srcsetStr = [];
    for (let w = 3; w < 9; w++) {
      srcsetStr.push(`${DBHelper.imageUrlForRestaurant(restaurant, w*100)} ${w*100}w`);
    }
    return srcsetStr.join(', ');
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`/restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: `${restaurant.name} ${restaurant.neighborhood}`,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Filter restaurants to have only given cuisine type.
        return restaurants.filter(r => r.cuisine_type == cuisine);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Filter restaurants to have only given neighborhood.
        return restaurants.filter(r => r.neighborhood == neighborhood);
      })
      .catch((error) => {
        console.log(error);
      });
  }

}

/**
 * Register Service Worker.
 */
((d, n) => {
  'use strict';
  // Check if Service Worker is supported.
  if (!n.serviceWorker) {
    console.log('Service Worker not supported');
    return; // Exit from function.
  }
  d.addEventListener('DOMContentLoaded', () => {
    n.serviceWorker.register('/sw.js')
      .then((reg) => {
        // Exit if the current page wasn't loaded via a SW.
        if (!n.serviceWorker.controller) return;
        // Listening messages from SW.
        n.serviceWorker.addEventListener('message', (event) => {
          /* When client receives the 'refreshed' message, the boolean flag 'dismissed', which is in the session storage of this client, will be deleted. N.B. The new SW sends this message to all clients. Look at sw.js to inspect. */
          if (event.data.action === 'refreshed') {
            sessionStorage.removeItem('dismissed');
          }
          /* When client receives the 'dismissed' message, the boolean flag 'dismissed', which is in the session storage of this client, will be set to true. N.B. The current SW sends this message to all clients. Look at sw.js to inspect. */
          if (event.data.action === 'dismissed') {
            sessionStorage.setItem('dismissed', true);
          }
        });
        /* Exit if the update of SW was dismissed in this session previously. */
        if (sessionStorage.dismissed) return;
        // If there's an updated worker already waiting.
        if (reg.waiting) {
          SWUpdateAlert(reg.waiting);
          return;
        }
        // If there's an updated worker installing.
        if (reg.installing) {
          // If one arrives, track its progress.
          trackProgressOf(reg.installing);
          return;
        }
        // Otherwise, listen for new installing worker arriving.
        reg.addEventListener('updatefound', () => {
          // If one arrives, track its progress.
          trackProgressOf(reg.installing);
        });
      })
      .catch((error) => {
        console.log('[SW] Registration failed, error:', error);
      });

      /**
       * Set, show and handle SW update alert.
       */
      function SWUpdateAlert(worker) {
        trackControllerChange();
        // Set SW update alert.
        const div = d.createElement('div');
        div.id = 'update-alert';
        div.setAttribute('role', 'alert');
        const notice = d.createElement('p');
        notice.innerHTML = 'New version available.';
        const buttons = d.createElement('p');
        buttons.className = 'no-wrap';
        const refresh = d.createElement('button');
        refresh.type = 'button';
        refresh.innerHTML = 'REFRESH';
        const dismiss = d.createElement('button');
        dismiss.type = 'button';
        dismiss.innerHTML = 'DISMISS';
        buttons.append(refresh);
        buttons.append(dismiss);
        div.append(notice);
        div.append(buttons);
        d.body.append(div);
        // Set a timeout to make animation visible.
        setTimeout(() => {
          div.className = 'open';
          /* 1. Set a timeout to listen the alert text in right order with screen readers. 2. On load, sometimes Google Maps grabs the focus, a timeout fixes this behaviour. */
          setTimeout(() => {
            refresh.focus(); // Move focus to the refresh button.
            /* Dismiss, hide and remove the alert after 7 sec. The alert will be showed again on load of a next page, because the user did not answer expressally. */
            setTimeout(() => {
              if (!sessionStorage.dismissed) hideAlert(div);
            },5000);
          },300);
        },150);
        /* When refresh button is clicked, the client sends a message to the new SW that is waiting. */
        refresh.addEventListener('click', () => {
          worker.postMessage({action: 'refresh'});
        });
        /* When dismiss button is clicked, the client sends a message to the current SW that actually is active yet. */
        dismiss.addEventListener('click', () => {
          n.serviceWorker.controller.postMessage({action: 'dismiss'});
          hideAlert(div); // Dismiss, hide and remove the alert.
        });
      }

      /**
       * Track the progress of new SW.
       */
      function trackProgressOf(worker) {
        worker.addEventListener('statechange', function() {
          if (this.state == 'installed') {
            SWUpdateAlert(this);
          }
        });
      }

      /**
       * Track change of controller and reload when new SW is activated.
       */
      function trackControllerChange() {
        /* Ensure refresh is only called once. This works around a bug in "force update on reload". */
        let refreshing;
        n.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          location.reload(true);
          refreshing = true;
        });
      }

      /**
       * Dismiss, hide and remove the alert.
       */
      function hideAlert(panel) {
        panel.classList.remove('open');
        d.body.focus(); // Move focus to the body.
        setTimeout(() => {
          panel.parentNode.removeChild(panel);
        }, 300);
      }
  });
})(document, navigator);
