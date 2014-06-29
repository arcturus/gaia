'use strict';

/* global DataStoreDatabase */

(function(exports) {

  var FavoritesDatabase = new DataStoreDatabase('favorites_store');

  FavoritesDatabase.adaptData = function adapt(data) {
    var contact = JSON.parse(JSON.stringify(data));

    // Add the photos
    if (Array.isArray(data.photo)) {
      contact.photo = [];
      data.photo.forEach(function(blob) {
        contact.photo.push(blob);
      });
    }

    return contact;
  };

  exports.FavoritesDatabase = FavoritesDatabase;

})(window);
