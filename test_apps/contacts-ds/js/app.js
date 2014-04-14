'use strict';

var App = (function App() {

  var ORIGIN = 'app://contacts-ds.gaiamobile.org/manifest.webapp';

  var log, copyButton, emptyButton;

  var store;
  var contacts = [];

  var init = function init(done) {
    log = document.getElementById('log');
    copyButton = document.getElementById('copy');
    emptyButton = document.getElementById('empty');

    copyButton.addEventListener('click', startMigration);
    emptyButton.addEventListener('click', resetStore);

    navigator.getDataStores('contacts').then(function(stores) {
      for(var i = 0; i < stores.length && !store; i++) {
        if (stores[i].owner === ORIGIN) {
          store = stores[i];
        }
      }

      info(done);
    });
  };

  function startMigration(evt) {
    if (!store) {
      return;
    }

    copyButton.disabled = true;

    var revisionReq = navigator.mozContacts.getRevision();
    revisionReq.onsuccess = function() {
      writeLog('Fetching contacts with revision ' + this.result);
    };

    var start = window.performance.now();
    var timeToAllContacts, timeToDs;
    var contactsReq = navigator.mozContacts.find({});
    contactsReq.onsuccess = function onsuccess() {
      timeToAllContacts = window.performance.now() - start;
      writeLog('Fetched ' + this.result.length +
       ' contacts in ' + timeToAllContacts);
      contacts = this.result;

      start = window.performance.now();
      var promises = [];
      for (var i = 0; i < contacts.length; i++) {
        promises.push(DS_fetchContact(i).then(DS_insertContact));
      }

      Promise.all(promises).then(function(values) {
        timeToDs = window.performance.now() - start;
        writeLog('Checked against the DS in ' + timeToDs);
        copyButton.disabled = false;
        contacts = [];
      }, function(e) {
        writeLog('An error happened ' + e);
        copyButton.disabled = false;
        contacts = [];
      });

    };

  }

  function DS_fetchContact(index) {
    // uncheap clone :(
    var contactStr = JSON.stringify(contacts[index]);
    var contact = JSON.parse(contactStr);
    var promise = new Promise(function(resolve, reject) {
      store.get(contact.id).then(function(storedContact) {
        if (!storedContact) {
          resolve({shouldInsert: true, contact: contact});
        } else {
          // To compare we need to stringify what we store :(
          var storedStringify = JSON.stringify(storedContact);
          if (storedStringify !== contactStr) {
            resolve({shouldInsert: true, contact: contact});
          } else {
            resolve({shouldInsert: false});
          }
        }
      }, reject);
    });

    return promise;
  }

  function DS_insertContact(meta) {
    var promise = new Promise(function(resolve, reject) {
      if (!meta || !meta.shouldInsert) {
        resolve();
        return;
      }

      var contact = meta.contact;

      store.put(contact, contact.id).then(resolve, reject);
    });

    return promise;
  }

  function resetStore(evt) {
    if (!store) {
      return;
    }
    emptyButton.disabled = true;
    store.clear().then(function() {
      emptyButton.disabled = false;
      info();
    });
  }

  function info(cb) {
    if (!store) {
      if (cb && typeof cb === 'function') {
        cb();
      }
      return;
    }
    store.getLength().then(function length(l) {
      writeLog('Contacts in DS: ' + l);
      if (cb && typeof cb === 'function') {
        cb();
      }
    });
  }

  function writeLog(msg) {
    log.innerHTML = msg;
  }

  return {
    init: init,
    get store() {
      return store;
    }
  };

}());

window.addEventListener('load', function() {
  App.init();
});
