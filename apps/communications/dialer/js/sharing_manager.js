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

    return store.put(resources, self.METADATA_FIELD);
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
