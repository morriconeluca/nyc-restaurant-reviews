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
   * Fetch all restaurants.
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
   * Fetch all neighborhoods.
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
      });
  }

  /**
   * Fetch all cuisines.
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
      });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood.
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
      });
  }

  /**
   * Fetch a restaurant by its ID.
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
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
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
   * Fetch restaurants by a cuisine type.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Filter restaurants to have only given cuisine type.
        return restaurants.filter(r => r.cuisine_type == cuisine);
      });
  }

  /**
   * Fetch restaurants by a neighborhood.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants.
    return DBHelper.fetchRestaurants()
      .then((restaurants) => {
        // Filter restaurants to have only given neighborhood.
        return restaurants.filter(r => r.neighborhood == neighborhood);
      });
  }

}