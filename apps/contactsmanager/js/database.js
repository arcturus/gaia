/*global Promise, SimplePhoneMatcher */
/* exported DB */
'use strict';

var DB = (function DB() {

  var VERSION = 1;
  var DB_NAME = 'sync_info';
  var db;

  var INDEX_EMAIL_NAME = 'email, given, family';
  var INDEX_PHONE_NAME = 'phone, given, family';

  function createDB(evt) {
    var promise = new Promise(function(resolve, reject) {
      db = evt.target.result;
      var objectStore = db.createObjectStore('data',
       { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex(INDEX_EMAIL_NAME,
       ['email', 'given', 'family']);
      objectStore.createIndex(INDEX_PHONE_NAME,
       ['phone', 'given', 'family']);
      resolve();
    });

    return promise;
  }

  function getStore(writable) {
    var permission = writable ? 'readwrite' : 'readonly';
    var transaction = db.transaction(['data'], permission);
    return transaction.objectStore('data');
  }

  function getIndex(indexName) {
    var store = getStore();
    return store.index(indexName);
  }

  var init = function init() {
    return new Promise(function(resolve, reject) {
      var request = window.indexedDB.open(DB_NAME, VERSION);
      request.onsuccess = function(evt) {
        db = evt.target.result;
        resolve();
      };

      request.onerror = function(evt) {
        reject(evt);
      };

      request.onupgradeneeded = function(evt) {
        createDB(evt).then(resolve, reject);
      };
    });
  };

  var checkForMatches = function checkForMatches(contact) {
    if (!db) {
      return Promise.reject('No initialized');
    }

    var promises = [];
    promises.push(checkByEmail(contact));
    promises.push(checkByPhone(contact));

    return new Promise(function(resolve, reject) {
      Promise.all(promises).then(function(values) {
        var result = [];
        values.forEach(function(valuesArray) {
          if (!valuesArray) {
            return;
          }
          if (!Array.isArray(valuesArray)) {
            valuesArray = [valuesArray];
          }
          valuesArray.forEach(function(value) {
            if (value && value.key && result.indexOf(value.key) === -1) {
              result.push(value.key);
            }
          });
        });
        resolve(result);
      }, reject);
    });
  };

  function checkByEmail(contact) {
    if (!contact || !Array.isArray(contact.email) ||
     contact.email.length === 0) {
      return Promise.resolve(null);
    }
    var given = contact && contact.givenName && contact.givenName[0] || '';
    var family = contact && contact.familyName && contact.familyName[0] || '';
    var indexEmail = getIndex(INDEX_EMAIL_NAME);
    var promises = [];
    contact.email.forEach(function(field) {
      var email = field.value;
      promises.push(findBy(indexEmail, [email, given, family]));
    });

    return Promise.all(promises);
  }

  function checkByPhone(contact) {
    if (!contact || !Array.isArray(contact.tel) || contact.tel.length === 0) {
      return Promise.resolve(null);
    }

    var given = contact && contact.givenName && contact.givenName[0] || '';
    var family = contact && contact.familyName && contact.familyName[0] || '';

    var phoneIndex = getIndex(INDEX_PHONE_NAME);
    var promises = [];
    contact.tel.forEach(function(field) {
      var variants = SimplePhoneMatcher.generateVariants(field.value);
      variants.forEach(function(tel) {
        promises.push(findBy(phoneIndex, [tel, given, family]));
      });
    });

    return Promise.all(promises);
  }

  function findBy(index, arrayFields) {
    return new Promise(function(resolve, reject) {
      var request = index.get(arrayFields);
      request.onerror = reject;
      request.onsuccess = function(evt) {
        resolve(evt.target.result);
      };
    });
  }

  var storeReference = function storeReference(key, contact) {
    var given = contact && contact.givenName && contact.givenName[0] || '';
    var family = contact && contact.familyName && contact.familyName[0] || '';

    if (!given || !family) {
      return Promise.resolve();
    }
    return new Promise(function(resolve, reject) {
      var store = getStore(true);

      if (Array.isArray(contact.email) && contact.email.length > 0) {
        contact.email.forEach(function(emailField) {
          var email = emailField.value;
          store.add({
            key: key,
            given: given,
            family: family,
            phone: '',
            email: email
          });
        });
      }

      if (Array.isArray(contact.tel) && contact.tel.length > 0) {
        contact.tel.forEach(function(telField) {
          var variants = SimplePhoneMatcher.generateVariants(telField.value);
          variants.forEach(function(phone) {
            store.add({
              key: key,
              given: given,
              family: family,
              phone: phone,
              email: ''
            });
          });
        });
      }

      resolve();
    });
  };

  return {
    init: init,
    checkForMatches: checkForMatches,
    storeReference: storeReference
  };


})();
