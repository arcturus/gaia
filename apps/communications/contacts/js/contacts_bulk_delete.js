'use strict';

var contacts = window.contacts || {};

contacts.BulkDelete = (function() {

  var cancelled = false;
  var totalRemoved = 0;

  /**
   * Loads the overlay class before showing
   */
  function requireOverlay(callback) {
    Contacts.utility('Overlay', callback);
  }

  // Shows a dialog to confirm the bulk delete
  var showConfirm = function showConfirm(n) {
    var response = confirm('You want continue delete ' +
       n + ' contacts?');

    return response;
  };

  var doDelete = function doDelete(ids) {
    var deleted = 0;
    var progress = Contacts.showOverlay('Deleting contacts', 'progressBar');
    utils.overlay.showMenu();
    utils.overlay.oncancel = function() {
      cancelled = true;
    };
    progress.setTotal(ids.length);
    _doDelete(ids, progress);
  };

  var _doDelete = function _doDelete(ids, progress) {
    var currentId = ids.shift();
    if (!currentId || cancelled) {
      // Finished
      Contacts.hideOverlay();
      Contacts.showStatus(totalRemoved + ' deleted');
      return;
    }

    if (contacts.Search && contacts.Search.isInSearchMode()) {
      contacts.Search.invalidateCache();
      contacts.Search.removeContact(contact.id);
    }

    var contact = contact = new mozContact();
    contact.id = currentId;
    var request = navigator.mozContacts.remove(contact);
    request.onerror = request.onsuccess = function cb() {
      contacts.List.remove(currentId);
      totalRemoved++;
      progress.update();
      setTimeout(function() {
        _doDelete(ids, progress);
      }, 100);
    };
  };

  // Start the delete of the contacts
  var performDelete = function performDelete(promise) {
    requireOverlay(function onOverlay() {
      Contacts.showOverlay('Fetching contacts', 'spinner');
      promise.resolve();
      promise.onsuccess = function onSucces(ids) {
        Contacts.hideOverlay();
        var confirmDelete = showConfirm(ids.length);
        if (confirmDelete) {
          doDelete(ids);
        } else {
          Contacts.showStatus('Bulk delete cancelled');
        }
      };
      promise.onerror = function onError() {
        Contacts.hideOverlay();
      };
    });
  };

  return {
    'performDelete': performDelete
  };

})();
