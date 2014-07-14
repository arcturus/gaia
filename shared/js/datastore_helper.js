'use strict';

/* global Promise */

/**
 *  DataStoreHelper provides a simple interface for accessing an specific
 *  datastore by name (and origin if specified).
 *  
 *  Provides subscrition to events happening to the data as well as automatic
 *  data access based on manifest.
 */

(function(exports) {

  // Constructor, we will need the datastore name and an origin
  // if no origin is specified we will get the first (if any)
  // of the datastores on the system with that name.
  function DataStoreHelper(name, origin) {
    this.store = null;
    this.origin = origin;
    this.STORE_NAME = name;
    this.STORE_EVENT = name + '_ready_' + (new Date()).getTime();
    this.storeState = 'not_ready';
    this.listeners = Object.create(null);
  }

  // Gets a reference to the datastore object based on the
  // constructor information.
  // Returns a promise, if not datastores found with the
  // given criteria the promise won't be fullfilled.
  function init(DB) {
    return new Promise(function (resolve, reject) {
      if (DB.store) {
        resolve();
        return;
      }

      // Don't initialise several times, just wait till we do it
      // once and propagate.
      if (DB.storeState === 'initializing') {
        document.addEventListener(DB.STORE_EVENT, function onStore(evt) {
          document.removeEventListener(DB.STORE_EVENT, onStore);
          if (evt.detail && evt.detail.error) {
            DB.storeState = 'rejected';
            reject(evt.detail.error);
          } else {
            resolve();
          }
          return;
        });
      }

      DB.storeState = 'initializing';

      if (!navigator.getDataStores) {
        reject('Datastores not supported');
        DB.storeState = 'rejected';
        return;
      }

      // Fetch all datastores on the system by that name and start
      // filtering by manifest (owner), or pick the first one if
      // not supplied as parameter.
      navigator.getDataStores(DB.STORE_NAME).then(function (stores) {
        if (!stores || !Array.isArray(stores) || stores.length < 1) {
          reject('Could not access datastore ' + DB.STORE_NAME);
          DB.storeState = 'failed';
          return;
        }

        if (!DB.origin) {
          DB.store = stores[0];
          DB.origin = DB.store.owner;
        } else {
          stores.forEach(function (store) {
            if (DB.origin === store.owner) {
              DB.store = store;
            }
          });

          if (!DB.store) {
            var error = 'Could not find owner ' + DB.origin +
             ' for store ' + DB.STORE_NAME;
            DB.storeState = 'rejected';
            reject(error);
            document.dispatchEvent(new CustomEvent(DB.STORE_EVENT), {
              detail: {
                error: error
              }
            });
            return;
          }
        }
        
        DB.store.addEventListener('change', DB.onChangeHandler.bind(DB));
        DB.storeState = 'initialized';
        document.dispatchEvent(new CustomEvent(DB.STORE_EVENT));
        resolve();
      }, reject);

    });
  }

  // Utility method that will give an array of all elements
  // of the store
  function doGetAll(DB, resolve, reject) {
    var result = Object.create(null);
    var cursor = DB.store.sync();

    function cursorResolve(task) {
      switch (task.operation) {
        case 'update':
        case 'add':
          result[task.data.id] = task.data;
          break;

        case 'remove':
          delete result[task.data.id];
          break;

        case 'clear':
          result = Object.create(null);
          break;

        case 'done':
          resolve(result);
          return;
      }

      cursor.next().then(cursorResolve, reject);
    }

    cursor.next().then(cursorResolve, reject);
  }

  // Get an element of the store based on it's key.
  DataStoreHelper.prototype.get = function get(id) {
    var self = this;
    return new Promise(function doGet(resolve, reject) {
      init(self).then(function onInitialized() {
        self.store.get(id).then(resolve, reject);
      }, reject);
    });
  };

  // Fetch all items on the datastore
  DataStoreHelper.prototype.getAll = function getAll() {
    var self = this;
    return new Promise(function doGet(resolve, reject) {
      init(self).then(doGetAll.bind(null, self, resolve, reject), reject);
    });
  };

  // Generic handler for listening to any change on the datastore.
  // Will broadcast the change to any listener added by type.
  DataStoreHelper.prototype.onChangeHandler = function onchangeHandler(evt) {
    var operation = evt.operation;
    var callbacks = this.listeners[operation];
    var self = this;
    callbacks && callbacks.forEach(function iterCallback(callback) {
      self.store.get(evt.id).then(function got(result) {
        callback.method.call(callback.context || this, {
          type: operation,
          target: result || evt
        });
      });
    });
  };

  // Add custom listeners based on datastore change types.
  DataStoreHelper.prototype.addEventListener = function addEventListener(type,
     callback) {
    var context;
    if (!(type in this.listeners)) {
      this.listeners[type] = [];
    }

    var cb = callback;
    if (typeof cb === 'object') {
      context = cb;
      cb = cb.handleEvent;
    }

    if (cb) {
      this.listeners[type].push({
        method: cb,
        context: context
      });
      init(this);
    }
  };

  // Removes the callback by change type for the datastore.
  DataStoreHelper.prototype.removeEventListener = function
   removeEventListener(type, callback) {
    if (!(type in this.listeners)) {
      return false;
    }

    var callbacks = this.listeners[type];
    var length = callbacks.length;
    for (var i = 0; i < length; i++) {

      var thisCallback = callback;
      if (typeof thisCallback === 'object') {
        thisCallback = callback.handleEvent;
      }

      if (callbacks[i] && callbacks[i].method === thisCallback) {
        callbacks.splice(i, 1);
        return true;
      }
    }

    return false;
  };

  // Adds a new element to the store.
  // Restriction, each element must contain a id field, that will
  // be used as key to store it on the datastore.
  DataStoreHelper.prototype.add = function add(data) {
    var self = this;
    return new Promise(function doAdd(resolve, reject) {
      if (!data || !data.id) {
        reject('Cannot find identifier in object ' +
         JSON.stringify(data));
        return;
      }

      init(self).then(function onInitialized() {
        var toStore = self.adaptData &&
         typeof self.adaptData == 'function' ?
          self.adaptData(data) : data;
        self.store.add(toStore, data.id).then(
          function success() {
            resolve(true);
          },
          function nosuccess() {
            self.store.put(toStore,
             data.id).then(resolve, reject);
          }
        );
      }, reject);
    });
  };

  // Returns the revision id.
  DataStoreHelper.prototype.getRevisionId = function getRevisionId() {
    var self = this;
    return new Promise(function doGet(resolve, reject) {
      init(self).then(function onInitialized() {
        resolve(self.store.revisionId);
      }, reject);
    });
  };

  // Updates an element on the database, the object will need to
  // have a 'id' field used as store key.
  DataStoreHelper.prototype.put = function put(data) {
    return this.add(data);
  };

  // Removes an object based on it's key
  DataStoreHelper.prototype.remove = function remove(id) {
    var self = this;
    return new Promise(function doRemove(resolve, reject) {
      init(self).then(function onInitialized() {
        self.store.remove(id).then(resolve, reject);
      }, reject);
    });
  };

  // Utility method that can be overriten, it's invoked when saving
  // an object and can adapt the original object to what we save
  // in the datastore
  DataStoreHelper.prototype.adaptData = function adaptData(data) {
    return data;
  };

  exports.DataStoreHelper = DataStoreHelper;

})(window);
