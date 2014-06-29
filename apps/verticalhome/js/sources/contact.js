'use strict';

/* global GaiaGrid */
/* global FavoritesDatabase */
/* global app */

(function(exports) {

  var eventTypesToListenFor = ['added', 'updated', 'removed'];

  function takeSnapShot() {
    app.itemStore.save(app.grid.getItems());
  }

  function FavoriteSource(store) {
    this.store = store;
    this.entries = [];

    var self = this;
    eventTypesToListenFor.forEach(function iterateTypes(type) {
      FavoritesDatabase.addEventListener(type, self);
    }, this);
  }

  FavoriteSource.prototype.synchronize = function synchronize() {
    var icons = app.grid.getIcons();
    var allContacts = {};

    for (var i in icons) {
      var icon = icons[i];
      if (icon instanceof GaiaGrid.Contact) {
        allContacts[icon.detail.id] = icon;
      }
    }

    var toBeAdded = [];
    for(var j = 0, len = this.entries.length; j < len; j++) {
      var entry = this.entries[j];
      if (!allContacts[entry.detail.id]) {
        toBeAdded.push(entry);
      } else {
        delete allContacts[entry.detail.id];
      }
    }

    for (i in allContacts) {
      this.removeIconFromGrid(allContacts[i].id);
    }

    for (i = 0, len = toBeAdded.length; i < len; i++) {
      this.addIconToGrid(toBeAdded[i].detail);
    }

    takeSnapShot();
  };

  FavoriteSource.prototype.populate = function populate(done) {
    var self = this;
    FavoritesDatabase.getAll().then(function(favorites) {
      Object.keys(favorites).forEach(function(id) {
        self.entries.push(new GaiaGrid.Contact(favorites[id]));
      });

      done(self.entries);
    }, done);
  };

  FavoriteSource.prototype.handleEvent = function handleEvent(evt) {
    switch (evt.type) {
      case 'added':
      case 'updated':
        this.addIconToGrid(evt.target);
        takeSnapShot();
        break;
      case 'removed':
        this.removeIconFromGrid(evt.target.id);
        takeSnapShot();
        break;
    }
  };

  FavoriteSource.prototype.addIconToGrid = function addIcon(detail) {
    var icons = app.grid.getIcons();
    var existing = icons[detail.id];
    if (existing) {
      existing.update(detail);
      app.grid.render();
      return;
    }

    var contactIcon = new GaiaGrid.Contact(detail);
    contactIcon.setPosition(this.store.getNextPosition());
    this.entries.push(contactIcon);

    var lastDivider = app.grid.removeUntilDivider();
    app.grid.add(contactIcon);
    app.grid.add(lastDivider);

    app.grid.render();
  };

  FavoriteSource.prototype.removeIconFromGrid = function removeIcon(id) {
    var icons = app.grid.getIcons();
    var appObject = icons[id];

    if (appObject) {
      appObject.removeFromGrid();
    }
  };

  exports.FavoriteSource = FavoriteSource;
})(window);
