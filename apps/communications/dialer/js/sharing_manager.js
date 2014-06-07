'use strict';
/* globals Contacts, Promise */
/* exported SharingManager */

var SharingManager = {
  ORIGIN: 'app://communications.gaiamobile.org/manifest.webapp',
  STORE_NAME: 'communications',
  store: null,
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
            resolve(store);
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
      subtype: clEntry.status,
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
