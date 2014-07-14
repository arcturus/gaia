'use strict';

/* global MockNavigatorDatastore */
/* global DataStoreHelper */
/* global MockDatastoreObj */

require('/shared/js/datastore_helper.js');
require('/shared/test/unit/mocks/mock_navigator_datastore.js');

suite('DataStore Helper', function() {
  var realGetDataStores = null;
  var subject;
  var STORE_NAME = 'store_mystore';
  var STORE_OWNER = 'app://myapp';
  var objects = [
    {id:0, value:0},
    {id:1, value:1},
    {id:2, value:2},
  ];

  suiteSetup(function() {
    realGetDataStores = navigator.getDataStores;
  });

  suiteTeardown(function() {
    navigator.getDataStores = realGetDataStores;
  });

  setup(function() {
    navigator.getDataStores = MockNavigatorDatastore.getDataStores;
    subject = new DataStoreHelper(STORE_NAME);

    MockNavigatorDatastore._notFound = false;
    MockNavigatorDatastore._datastores =
     [new MockDatastoreObj(STORE_NAME, STORE_OWNER, objects)];
  });


  suite('Initialisation', function() {
    test('> No datastores stores by specific name', function(done) {
      MockNavigatorDatastore._notFound = true;

      subject.getRevisionId().then(function(store){
        assert.notOk(store, 'We should have not found a store');
        done();
      }, function(msg) {
        assert.isTrue(msg.indexOf(STORE_NAME) !== -1);
        done();
      });
    });

    test('> No datastore found for an specific owner', function(done) {
      subject = new DataStoreHelper(STORE_NAME, 'wrong owner');
      subject.getRevisionId().then(function(store) {
        assert.notOk(store, 'We should have not found a store');
        done();
      }, function(msg) {
        assert.isTrue(msg.indexOf(STORE_NAME) !== -1 &&
         msg.indexOf('wrong owner') !== -1);
        done();
      });
    });
  });

  suite('> Fetching a valid store', function() {
    test('> We get a valid store reference', function(done) {
      subject.getRevisionId().then(function() {
        assert.isNotNull(subject.store);
        assert.equal(subject.store.owner, STORE_OWNER);
        done();
      }, function(msg) {
        assert.notOk(msg, msg);
        done();
      });
    });

    test('> Valid store states', function(done) {
      var state = {
        value: null,
        setState: function(v) {
          this.value = v;
        }
      };
      sinon.spy(state, 'setState');
      Object.defineProperty(subject, 'storeState', {
        get: function() { return state.value; },
        set: function(value) { state.setState(value); },
        enumerable: true,
        configurable: true
      });

      subject.getRevisionId().then(function() {
        sinon.assert.callCount(state.setState, 2);
        assert.equal(state.setState.getCall(0).args[0], 'initializing');
        assert.equal(state.setState.getCall(1).args[0], 'initialized');
        done();
      }, function(msg) {
        assert.notOk(msg, msg);
        done();
      });
    });
  });

  suite('> Operations', function() {
    test('> get a valid object', function(done) {
      subject.get('1').then(function(obj) {
        assert.isNotNull(obj);
        assert.isTrue(obj.id === 1);
        assert.isTrue(obj.value === 1);
        done();
      }, function(msg) {
        assert.notOk(msg, msg);
        done();
      });
    });

    test('> get an invalid object', function(done) {
      subject.get('invalid key').then(function(obj) {
        assert.isNull(obj);
        done();
      }, function(msg) {
        assert.notOk(msg, msg);
        done();
      });
    });

    test('> modify an object', function(done) {
      var fail = function(msg) {
        assert.notOk(msg, msg);
        done();
      };
      subject.put({id: 1, value:'new'}).then(
        function() {
          subject.get('1').then(function(obj) {
            assert.isNotNull(obj);
            assert.isTrue(obj.id === 1);
            assert.equal(obj.value, 'new');
          }, fail);
        }, fail);
      done();
    });

    test('> remove an object', function(done) {
      var fail = function(msg) {
        assert.notOk(msg, msg);
        done();
      };
      subject.remove('1').then(function() {
        subject.get('1').then(function(obj){
          assert.isNull(obj);
          done();
        }, fail);
      }, fail);
    });

    test('> add an object', function(done){
      var fail = function(msg) {
        assert.notOk(msg, msg);
        done();
      };
      subject.add({id: 'id', value: 'value'}).then(function(){
        subject.get('id').then(function(obj){
          assert.isNotNull(obj);
          assert.equal(obj.id, 'id');
          assert.equal(obj.value, 'value');
          done();
        }, fail);
      }, fail);
    });
  });

  suite('> Adapt data', function() {
    setup(function() {
      subject.adaptData = function(data) {
        if (data.id) {
          data.id_clone = data.id;
        }
        return data;
      };
    });

    test('> check data adaption', function(done) {
      var fail = function(msg) {
        assert.notOk(msg, msg);
        done();
      };
      subject.add({id: 'id', value: 'value'}).then(function(){
        subject.get('id').then(function(obj){
          assert.isNotNull(obj);
          assert.equal(obj.id, 'id');
          assert.equal(obj.value, 'value');
          assert.equal(obj.id_clone, 'id');
          done();
        }, fail);
      }, fail);
    });

    test('> invalid adaptData', function(done){
      var fail = function(msg) {
        assert.notOk(msg, msg);
        done();
      };
      subject.adaptData = null;
      subject.add({id: 'id', value: 'value'}).then(function(){
        subject.get('id').then(function(obj){
          assert.isNotNull(obj);
          assert.equal(obj.id, 'id');
          assert.equal(obj.value, 'value');
          assert.isTrue(obj.id_clone === undefined);
          done();
        }, fail);
      }, fail);
    });
  });

});