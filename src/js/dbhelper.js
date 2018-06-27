'use strict';

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port.
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants with proper error handling.
   */
  static fetchRestaurants() {
    // Check if indexedDB is supported.
    if (window.indexedDB) {
      // Open a connection with indexedDB.
      const request = window.indexedDB.open('nyc_rr_data', 1);

      // Create the object store.
      request.onupgradeneeded = event => {
        const db = event.target.result;
        db.createObjectStore('restaurants', {keyPath: 'id'});
      };

      // The fetchRestaurants function must return a Promise.
      return new Promise((resolve, reject) => {

        request.onsuccess = event => {
          const db = event.target.result;
          // Open a transaction and obtain a reference to the object store.
          const store = db.transaction(['restaurants'], 'readwrite').objectStore('restaurants');

          resolve(new Promise((resolve, reject) => {
            // Use cursors to retrieve all objects in the object store and add them to an array.
            let IDBRestaurants = [];
            store.openCursor().onsuccess = event => {
              let cursor = event.target.result;
              // Check if the object store is empty.
              if (!cursor && !IDBRestaurants.length) {
                // Fetch from the network.
                resolve(fetch(DBHelper.DATABASE_URL)
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
              reject(event.target.errorCode);
            };
          }));
        };
        request.onerror = event => {
          reject(event.target.errorCode);
        };
      });
    } else { // If indexedDB is not supported.
      return fetch(DBHelper.DATABASE_URL)
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
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all neighborhoods from all restaurants.
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods.
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
        return uniqueNeighborhoods;
      })
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all cuisines from all restaurants.
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines.
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
        return uniqueCuisines;
      })
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants;
        if (cuisine != 'all') { // Filter by cuisine.
          results = results.filter(r => r.cuisine_type === cuisine);
        }
        if (neighborhood != 'all') { // Filter by neighborhood.
          results = results.filter(r => r.neighborhood === neighborhood);
        }
        return results;
      })
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * Fetch a restaurant by its ID with proper error handling.
   */
  static fetchRestaurantById(id) {
    // Fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const restaurant = restaurants.find(r => r.id == id);
        if (!restaurant) { // Restaurant does not exist in the database.
          throw Error('Restaurant does not exist');
        }
        return restaurant; // Got the restaurant.
      })
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, width) {
    /* const extension = restaurant.photograph.split('.').pop();
    const name = restaurant.photograph.slice(0, restaurant.photograph.indexOf(`.${extension}`));
    return (`/img/${name}-${width}w.${extension}`); */
    return `/img/${restaurant.photograph}-${width}w.jpg`;
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
      .then(restaurants => {
        // Filter restaurants to have only given cuisine type.
        return restaurants.filter(r => r.cuisine_type == cuisine);
      })
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Filter restaurants to have only given neighborhood.
        return restaurants.filter(r => r.neighborhood == neighborhood);
      })
      .catch(error => {
        console.log(error);
      });
  }

}
