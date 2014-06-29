'use strict';

/* global Promise */

(function(exports) {

  function DataStoreDatabase(name) {
    this.store = null;
    this.STORE_NAME = name;
    this.STORE_EVENT = name + '_ready';
    this.storeState = 'not_ready';
    this.listeners = Object.create(null);
  }

  function init(DB) {
    return new Promise(function (resolve, reject) {
      if (DB.store) {
        resolve();
        return;
      }

      if (DB.storeState === 'initializing') {
        document.addEventListener(DB.STORE_EVENT, function onStore() {
          document.removeEventListener(DB.STORE_EVENT, onStore);
          resolve();
          return;
        });
      }

      DB.storeState = 'initalizing';

      if (!navigator.getDataStores) {
        reject('Datastores not supported');
        DB.storeState = 'rejected';
        return;
      }

      navigator.getDataStores(DB.STORE_NAME).then(function (stores) {
        if (!stores || !Array.isArray(stores) || stores.length < 1) {
          reject('Could not access datastore ' + DB.STORE_NAME);
          DB.storeState = 'failed';
          return;
        }

        DB.store = stores[0];
        DB.store.addEventListener('change', DB.onChangeHandler.bind(DB));
        DB.storeState = 'initialized';
        document.dispatchEvent(new CustomEvent(DB.STORE_EVENT));
        resolve();
      }, reject);

    });
  }

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

  DataStoreDatabase.prototype.get = function get(id) {
    var self = this;
    return new Promise(function doGet(resolve, reject) {
      init(self).then(function onInitialized() {
        self.store.get(id).then(resolve, reject);
      }, reject);
    });
  };

  DataStoreDatabase.prototype.getAll = function getAll() {
    var self = this;
    return new Promise(function doGet(resolve, reject) {
      init(self).then(doGetAll.bind(null, self, resolve, reject), reject);
    });
  };

  DataStoreDatabase.prototype.onChangeHandler = function onchangeHandler(evt) {
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

  DataStoreDatabase.prototype.addEventListener = function addEventListener(type,
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

  DataStoreDatabase.prototype.removeEventListener = function
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

  DataStoreDatabase.prototype.add = function add(data) {
    var self = this;
    return new Promise(function doAdd(resolve, reject) {
      if (!data || !data.id) {
        reject('Incomplete element');
      }

      init(self).then(function onInitialized() {
        self.store.add(self.adaptData(data), data.id).then(
          function success() {
            resolve(true);
          },
          function nosuccess() {
            self.store.put(self.adaptData(data),
             data.id).then(resolve, reject);
          }
        );
      }, reject);
    });
  };

  DataStoreDatabase.prototype.getRevisionId = function getRevisionId() {
    var self = this;
    return new Promise(function doGet(resolve, reject) {
      init(self).then(function onInitialized() {
        resolve(self.store.revisionId);
      }, reject);
    });
  };

  DataStoreDatabase.prototype.put = function put(data) {
    this.add(data);
  };

  DataStoreDatabase.prototype.remove = function remove(id) {
    var self = this;
    return new Promise(function doRemove(resolve, reject) {
      init(self).then(function onInitialized() {
        self.store.remove(id).then(resolve, reject);
      }, reject);
    });
  };

  DataStoreDatabase.prototype.adaptData = function adaptData(data) {
    return data;
  };

  exports.DataStoreDatabase = DataStoreDatabase;

})(window);
