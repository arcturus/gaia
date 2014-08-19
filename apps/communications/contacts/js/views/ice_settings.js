/* global ICEStore */
/* global Contacts */

'use strict';

var contacts = window.contacts || {};

contacts.ICE = (function() {
  var iceSettingsPanel,
    iceSettingsHeader,
    iceContactItems = [],
    iceContactCheckboxes = [],
    iceContactButtons = [],
    iceScreenLoaded = false,
    ICE_CONTACTS_KEY = 'ice-contacts',
    localIceContacts = [],
    currentICETarget;

  var init = function ice_init() {
    if (iceScreenLoaded) {
      return;
    }
    // ICE DOM elements
    iceSettingsPanel = document.getElementById('ice-settings');
    iceSettingsHeader = document.getElementById('ice-settings-header');

    iceContactItems.push(document.getElementById('ice-contacts-1-switch'));
    iceContactItems.push(document.getElementById('ice-contacts-2-switch'));

    iceContactCheckboxes.push(iceContactItems[0]
                          .querySelector('[name="ice-contact-1-enabled"]'));
    iceContactCheckboxes.push(iceContactItems[1]
                          .querySelector('[name="ice-contact-2-enabled"]'));
    iceContactButtons.push(document.getElementById('select-ice-contact-1'));
    iceContactButtons.push(document.getElementById('select-ice-contact-2'));

    getICEContactsFromInternalStore(setButtonsState);

    // ICE Events handlers
    iceSettingsHeader.addEventListener('action', function(){
      contacts.Settings.navigation.back();
    });

    // All the controls do the same, just modifications on the
    // specific order.
    iceContactItems.forEach(function(item, index) {
      item.addEventListener('click', function(i) {
        return function(evt) {
          var disabled = iceContactCheckboxes[i].checked;
          iceContactCheckboxes[i].checked = !disabled;
          iceContactButtons[i].disabled = disabled;
          if (localIceContacts[i] && localIceContacts[i].id) {
            setICEContact(localIceContacts[i].id, i, !disabled);
          }
        };
      }(index));
    });

    iceContactButtons.forEach(function(element){
      element.addEventListener('click', function(evt) {
          showSelectList(evt.target.id);
      });
    });

    iceScreenLoaded = true;
  };

  function getICEContactsFromInternalStore(callback) {
    var iceContactsIds = [
      {
        id: undefined,
        active: false
      },
      {
        id: undefined,
        active: false
      }
    ];

    window.asyncStorage.getItem(ICE_CONTACTS_KEY, function(data) {
      if (data) {
        if (data[0]) {
          iceContactsIds[0] = data[0];
        }
        if (data[1]) {
          iceContactsIds[1] = data[1];
        }
      }
      localIceContacts = iceContactsIds;
      callback(iceContactsIds);
    });
  }

  function setButtonsState(iceContactsIds) {
    iceContactsIds.forEach(function(iceContact, index) {
      if (!iceContact.id) {
        return;
      }

      iceContactCheckboxes[index].checked = iceContact.active;
      iceContactButtons[index].disabled = !iceContact.active;
      contacts.List.getContactById(iceContact.id, function(contact) {
        var displayName = contacts.List.getDisplayName(contact);
        var display = [displayName.givenName];
        if (displayName.familyName) {
          display.push(displayName.familyName);  
        }
        iceContactButtons[index].innerHTML = display.join(' ');
      });
    });
  }

  function selectICEHandler(id) {
    
    setICEContact(id, currentICETarget, true,
     contacts.Settings.navigation.back.bind(
      contacts.Settings.navigation));

    contacts.List.clearClickHandlers();
    contacts.List.handleClick(Contacts.showContactDetail);
  }

  function showSelectList(target) {
    contacts.Settings.navigation.go('view-contacts-list', 'right-left');
    currentICETarget = target === 'select-ice-contact-1' ? 0 : 1;
    contacts.List.clearClickHandlers();
    contacts.List.handleClick(selectICEHandler);
  }

  /**
   * Set the values for ICE contacts, both in local and in the 
   * datastore
   */
  function setICEContact(id, pos, active, cb) {
    active = active || false;

    // Save locally
    localIceContacts[pos] = {
      id: id,
      active: active
    };
    window.asyncStorage.setItem(ICE_CONTACTS_KEY, localIceContacts);
    // Save in the datastore
    modifyICEInDS();
    setButtonsState(localIceContacts);

    if (typeof cb === 'function') {
      cb();
    }
  }

  /**
   * Clone the current local ice contacts into the datastore,
   * considering the active flag
   */
  function modifyICEInDS() {
    var contacts = [];
    localIceContacts.forEach(function(iceContact) {
      if (iceContact.id && iceContact.active) {
        contacts.push(iceContact.id);
      }
    });

    return ICEStore.setContacts(contacts);
  }

  return {
    init: init,
    get loaded() { return iceScreenLoaded; }
  };
})();
