'use strict';
/* globals Contacts, Promise, L10nManipulator */
/* exported SharingManager */

var SharingManager = {
  ORIGIN: 'app://communications.gaiamobile.org/manifest.webapp',
  STORE_NAME: 'communications',
  METADATA_FIELD: 'metadata',
  store: null,
  // Check if we need to include meta data for this app or
  // it's already included. No matter if fail, we always
  // pass through this silently
  _initialise: function (store) {
    var self = this;
    return new Promise(function (resolve, reject) {
      function alwaysResolve() {
        resolve(store);
      }

      store.get(self.METADATA_FIELD).then(function (entry) {
        if (entry) {
          alwaysResolve();
        } else {
          self._populateMetadata(store).then(alwaysResolve, alwaysResolve);
        }
      }, function () {
        self._populateMetadata(store).then(alwaysResolve, alwaysResolve);
      });
    });
  },
  _populateMetadata: function (store) {
    var resources = {
      images: null,
      l10n: []
    };
    // Add locale
    // voice_call_dialing -> outgoing calls
    // voice_call_incoming -> incoming calls
    var l10nIds = ['voice_call_dialing', 'voice_call_incoming'];
    resources.l10n = L10nManipulator.getAST(l10nIds);

    var self = this;
    return new Promise(function (resolve, reject) {
      self._getImages().then(function (images) {
        resources.images = images;
        store.put(resources, self.METADATA_FIELD).then(resolve, reject);
      }, reject);
    });
  },
  _getImages: function () {
    //From: http://goo.gl/ul5z6
    function getBase64Image(img) {
      // Create an empty canvas element
      var canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      // Copy the image contents to the canvas
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Get the data-URL formatted image
      // Firefox supports PNG and JPEG. You could check img.src to
      // guess the original format, but be aware the using "image/jpg"
      // will re-encode the image.
      return canvas.toDataURL('image/png');
    }
    return new Promise(function (resolve, reject) {
      var request = navigator.mozApps.getSelf();
      request.onsuccess = function onApp(evt) {
        var app = evt.target.result;
        var icons = app.manifest.entry_points.dialer.icons;
        var iconUrl = app.installOrigin + icons['84'];
        var img = new Image();
        img.src = iconUrl;
        img.onload = function () {
          var images = {
            'icon': getBase64Image(img)
          };
          resolve(images);
        };
        img.onerror = reject;
      };
      request.onerror = reject;
    });
  },
  _getContact: function (number) {
    return new Promise(function (resolve, reject) {
      Contacts.findByNumber(number, function (contact, matchingTel) {
        if (contact) {
          resolve(contact);
        } else {
          reject('Contact not found');
        }
      });
    });
  },
  _getDataStore: function () {
    var self = this;
    return new Promise(function (resolve, reject) {
      if (self.store !== null) {
        resolve(self.store);
        return;
      }
      if (!navigator.getDataStores) {
        reject('No DS Support');
        return;
      }

      navigator.getDataStores(self.STORE_NAME).then(function (stores) {
        if (!stores) {
          reject('Could not find datastore');
          return;
        }

        stores.forEach(function (store) {
          if (store.owner === self.ORIGIN) {
            self.store = store;
            self._initialise(store).then(resolve, resolve);
            //resolve(store);
            return;
          }
        });

        reject('Cound not find datastore');
      });
    });
  },
  _save: function (clEntry, contact) {
    var record = {
      date: clEntry.date,
      type: 'voice_call',
      subtype: clEntry.type,
      contact_id: contact.id
    };

    var self = this;
    return new Promise(function (resolve, reject) {
      self.store.get(contact.id).then(function (history) {
        if (!history) {
          history = [];
        }

        history.push(record);

        self.store.put(history, contact.id).then(resolve, reject);
      }, reject);
    });
  },
  share: function (callLogEntry) {
    var self = this;
    return this._getContact(callLogEntry.number).then(function (contact) {
      return self._getDataStore().then(function (store) {
        return self._save(callLogEntry, contact);
      });
    });
  }
};
