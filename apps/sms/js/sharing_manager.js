'use strict';
/* globals Promise */
/* exported SharingManager */

var SharingManager = {
  ORIGIN: 'app://sms.gaiamobile.org/manifest.webapp',
  STORE_NAME: 'messaging',
  store: null,
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
  _save: function (message, contact) {
    var record = {
      date: message.timestamp,
      type: message.type,
      subtype: message.messageClass,
      thread: message.threadId,
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
  share: function (message, contacts) {
    var self = this;
    return self._getDataStore().then(function (store) {
      return self._save(message, contacts[0]);
    });
  }
};
