'use strict';

/* global loadBodyHTML */
/* global asyncStorage */
/* global MocksHelper */
/* global MockMozActivity */
/* global MockContactsSettings */
/* global ContactsService */
/* global ConfirmDialog */
/* global ICEData, ICE */

requireApp('test/unit/mock_header_ui.js');
requireApp('services/contacts.js');
requireApp('test/unit/mock_navigation.js');
requireApp('test/unit/mock_asyncstorage.js');
requireApp('test/unit/mock_contacts.js');
requireApp('test/unit/mock_cache.js');
requireApp('js/utilities/ice_data.js');
requireApp('js/views/ice_settings.js');
requireApp('test/unit/mock_contacts_list_obj.js');
requireApp('test/unit/mock_contacts_settings.js');
requireApp('test/unit/mock_mozActivity.js');
require('/shared/js/component_utils.js');
require('/shared/elements/gaia_switch/script.js');
require('/shared/test/unit/mocks/mock_confirm_dialog.js');
require('/shared/test/unit/mocks/mock_ice_store.js');

var mocksHelper = new MocksHelper([
  'asyncStorage',
  'Cache',
  'ConfirmDialog',
  'Contacts',
  'ICEStore',
  'MozActivity'
]);
mocksHelper.init();

suite('ICE Settings view', function() {
  var subject;
  var realSettingsUI;
  var defaultLabel = 'ICESelectContact';

  var cid1 = '1', cid2 = '2', fbcid3 = '3';

  suiteSetup(function() {
    subject = ICE;
    realSettingsUI = window.SettingsUI;
    window.SettingsUI = {
      navigation: {
        back: function() {}
      }
    };

    mocksHelper.suiteSetup();
  });

  suiteTeardown(function() {
    mocksHelper.suiteTeardown();
    window.SettingsUI = realSettingsUI;
  });

  setup(function() {
    mocksHelper.setup();
    setupHTML();
    this.sinon.stub(
      ContactsService,
      'get',
      function(id, successCB, errorCB) {
        if (!id) {
          successCB();
          return;
        }

        var contacts = [];
        contacts.push({
          id: cid1,
          givenName: ['John'],
          familyName: ['Doe']
        });
        contacts.push({
          id: cid2,
          givenName: ['Albert'],
          familyName: ['Pla']
        });
        contacts.push({
          id: fbcid3,
          givenName: ['Cristian'],
          familyName: ['Martin'],
          isFB: true
        });

        var contact = contacts[id - 1];
        successCB(contact, contact.isFB);
      }
    );

  });

  teardown(function() {
    mocksHelper.teardown();
    subject.reset();
    window.asyncStorage.clear();
    ContactsService.get.restore();
  });

  function setupHTML() {
    loadBodyHTML('/elements/settings.html');
    // We loaded a template, expand it
    var template = document.getElementsByTagName('template')[0].innerHTML;
    var section = document.createElement('section');
    section.id = 'settings-wrapper';
    section.innerHTML = template;
    document.body.innerHTML = '';
    document.body.appendChild(section);
  }

  function assertIceContacts(iceStates) {
    var ice1 = document.getElementById('select-ice-contact-1');
    assert.equal(ice1.dataset.contactId, iceStates[0].contactId);

    if (iceStates[0].label) {
      assert.equal(ice1.textContent.trim(), iceStates[0].label);
    }
    else {
      assert.equal(ice1.dataset.l10nId, defaultLabel);
    }

    var ice2 = document.getElementById('select-ice-contact-2');
    assert.equal(ice2.dataset.contactId, iceStates[1].contactId);

    if (iceStates[1].label) {
      assert.equal(ice2.textContent.trim(), iceStates[1].label);
    }
    else {
      assert.equal(ice2.dataset.l10nId, defaultLabel);
    }

    assert.equal(ice1.disabled, !iceStates[0].active);
    assert.equal(ice2.disabled, !iceStates[1].active);

    var iceCheck1 = document.querySelector('[name="ice-contact-1-enabled"]');
    var iceCheck2 = document.querySelector('[name="ice-contact-2-enabled"]');
    assert.ok(!iceCheck1.disabled);
    assert.ok(!iceCheck2.disabled);
  }

  suite('> Initialization', function() {
    setup(function() {
      this.sinon.spy(asyncStorage, 'getItem');
    });

    test('> No ice contacts', function(done) {
      window.asyncStorage.keys = {
        'ice-contacts': []
      };

      subject.refresh(function() {
        // On init and when we do the listening
        sinon.assert.calledOnce(asyncStorage.getItem);

        assertIceContacts([{ contactId: '', active: false},
                         { contactId: '', active: false}]);
        done();
      });
    });

    test('> With 1 contact enabled. ICE Contact 1', function(done) {
      window.asyncStorage.keys = {
        'ice-contacts': [
          {
            id: cid1,
            active: true
          }
        ]
      };

      subject.refresh(function() {
        sinon.assert.calledTwice(ContactsService.get);

        assertIceContacts([{ contactId: cid1, label: 'John Doe', active: true},
                         { contactId: '', active: false}]);
        done();
      });
    });

    test('> With 1 contact enabled. ICE Contact 2', function(done) {
      window.asyncStorage.keys = {
        'ice-contacts': [
          {},
          {
            id: cid2,
            active: true
          }
        ]
      };

      subject.refresh(function() {
        sinon.assert.calledTwice(ContactsService.get);

        assertIceContacts([{ contactId: '', active: false},
                      { contactId: cid2, label: 'Albert Pla', active: true}]);
        done();
      });
    });

    test('> With 1 contact enabled. No name. Only has tel number',
      function(done) {
        window.asyncStorage.keys = {
          'ice-contacts': [
            {
              id: cid1,
              active: true
            }
          ]
        };

        var targetTelNumber = '678987654';

        ContactsService.get.restore();

        this.sinon.stub(
          ContactsService,
          'get',
          function(id, successCB, errorCB) {
            if (!id) {
              successCB();
              return;
            }

            var contacts = [];
            contacts.push({
              id: cid1,
              givenName: [],
              familyName: null,
              tel: [
                {
                  type: ['other'],
                  value: targetTelNumber
                }
              ]
            });
            var contact = contacts[id - 1];
            successCB(contact);
          }
        );


        subject.refresh(function() {
          sinon.assert.calledTwice(ContactsService.get);

          assertIceContacts([{
            label: targetTelNumber, contactId: cid1, active: true
          },{
              contactId: '', active: false
          }]);

          done();
        });
    });

    test('> With ICE contact 1 disabled', function(done) {
      window.asyncStorage.keys = {
        'ice-contacts': [
          {
            id: null,
            active: false
          }
        ]
      };

      subject.refresh(function() {
        sinon.assert.calledTwice(ContactsService.get);

        assertIceContacts([{ contactId: '', active: false},
                         { contactId: '', active: false}]);

        done();
      });
    });

    test('> With ICE contact 2 disabled', function(done) {
      window.asyncStorage.keys = {
        'ice-contacts': [
          {},
          {
            id: null,
            active: false
          }
        ]
      };

      subject.refresh(function() {
        sinon.assert.calledTwice(ContactsService.get);

        assertIceContacts([{ contactId: '', active: false},
                            { contactId: '', active: false}]);

        done();
      });
    });

    test('> With 2 contacts enabled', function(done) {
      window.asyncStorage.keys = {
        'ice-contacts': [
          {
            id: cid1,
            active: true
          }, {
            id: cid2,
            active: true
          }
        ]
      };

      subject.refresh(function() {
        sinon.assert.calledTwice(ContactsService.get);

        assertIceContacts([{ contactId: cid1, label: 'John Doe', active: true},
                      { contactId: cid2, label: 'Albert Pla', active: true}]);

        done();
      });
    });
  });

  suite('> Modify ICE contacts', function() {
    suiteSetup(function() {
      sinon.spy(ICEData, 'setICEContact');
    });

    suiteTeardown(function() {
      ICEData.setICEContact.restore();
    });

    setup(function() {
      window.asyncStorage.keys = {
        'ice-contacts': [
          {
            id: cid1,
            active: true
          }, {
            id: cid2,
            active: true
          }
        ]
      };
    });

    test('> change state saves ICE Datastore', function(done) {
      subject.refresh(function() {
        var switch1 = document.querySelector('[name=ice-contact-1-enabled]');
        // Disable 1
        switch1.click();

        sinon.assert.calledOnce(ICEData.setICEContact);
        sinon.assert.calledWith(ICEData.setICEContact, null, 0, false);

        done();
      });
    });

    test('> remove ICE Contact 1 and ICE Contact 2 remains', function(done) {
      subject.refresh(function() {
        assertIceContacts([{ contactId: cid1, label: 'John Doe', active: true},
                      { contactId: cid2, label: 'Albert Pla', active: true}]);

        ICEData.removeICEContact(cid1).then(function() {
          subject.refresh(function() {
            assertIceContacts([{ contactId: '', active: false},
                      { contactId: cid2, label: 'Albert Pla', active: true}]);
            done();
          });
        });
      });
    });

  });

  suite('> Error handling ', function() {
    setup(function() {
      window.asyncStorage.keys = {
        'ice-contacts': [
          {
            id: cid1,
            active: true
          }
        ]
      };
    });

    function assertErrorMessage(code, expectedCode, cb) {
      assert.equal(code, expectedCode);
      ConfirmDialog.show.restore();
      cb();
    }

    test(' repeated contact', function(done) {
      subject.refresh(function() {
        document.getElementById('select-ice-contact-1').click();
        MockMozActivity.setResult([{},{}]);
        MockMozActivity.currentActivity.onsuccess();
        sinon.stub(ConfirmDialog, 'show', function(param1, code) {
          assertErrorMessage(code, 'ICERepeatedContact', done);
        });
      });
    });
  });
});
