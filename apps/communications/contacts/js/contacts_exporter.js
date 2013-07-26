'use strict';

/*
  Generic module to do contacts export.

  Once passed to this module an array of mozContacts objects
  and setup the strategy (mechanism to export), will perform
  the common steps taken place during the process of exporting
  the information.

  Those steps are:

  - Preparation: (optional), may launch extra UI to setup some configuration
    and transform the mozcontacts object to any extra format
  - Export: Here is where the real import happens, could provide three known
    scenarios:
      - External handling of the export (web activity, ect.)
      - Progress of the import:
        - Defined progress activity
        - Undefined progress
  - Result of the export
*/
window.ContactsExporter = function ContactsExporter() {

  var contacts;
  var strategy;
  var hasProgress = false;
  var determinativeProgress = false;
  var progress;

  var init = function init(theContacts) {
    contacts = theContacts;
  };

  /*
    Setup what's the export mechanism:
      - SIM
      - to media card
      - to bluethood
      etc.
  */
  var setExportStrategy = function setExportStrategy(theStrategy) {
    strategy = theStrategy;
    if (strategy['configure'] !== 'undefined') {
      strategy.configure();
    }
  };

  /*
    Checks if the export module has been properly configured
    and start the process of exporting.
  */
  var start = function start() {
    if (!contacts || !strategy) {
      throw new Error('Not properly configured');
    }

    //strategy.setContactsToExport(contacts);

    // Check if we have a 'Preparation step'
    if (strategy['prepare'] !== undefined) {
      strategy.prepare(doExport);
    } else {
      doExport();
    }
  };

  var doExport = function doExport() {
    if (strategy['shouldShowProgress'] !=
        undefined && strategy.shouldShowProgress()) {
      hasProgress = true;
      configureProgress();
      displayProgress();
    }

    //strategy.doExport(doHandleResult);
    _doExport(0);
  };

  var _doExport = function _doExport(index) {
    if (index == contacts.length) {
      if (strategy['postExport'] !== undefined) {
        stragety.postExport(doHandleResult);
      } else {
        strategy.finish(doHandleResult);
      }
      return;
    }

    var continuee = function continuee() {
      var nextIndex = index + 1;
      if (hasProgress) {
        progress.update();
      }

      _doExport(nextIndex);
    };

    // Check if we have a Object, which we expect to be a
    // mozContact, otherwise we expect a contact id
    var contact = contacts[index];
    if (typeof contact !== 'object') {
      contactsResolver({'id': contact}, function onContact(ct) {
        if (ct == null) {
          continuee();
        } else {
          strategy.doExport(ct, continuee);
        }
      });
    } else {
      strategy.doExport(contact, continuee);
    }
  };

  /*
    Callback invoked when the exporting process finished.

    @param: {Object} error Not null in case an error happened
    @param: {Integer} exported Number of contacts successfuly imported
    @param: {String} message Any extra message from the exporting mechanism
  */
  var doHandleResult = function doHandleResult(error,
    exported, message) {
    if (hasProgress) {
      utils.overlay.hide();
    }

    // TODO: Better mechanism to show result
    var msg = exported + ' out of ' + contacts.length + ' exported';
    utils.status.show(msg);
  };

  /*
    Based on the strategy configure the progress display to show a
    determinative or indeterminate ui depending on the strategy
  */
  var configureProgress = function configureProgress() {
    determinativeProgress =
      strategy['hasDeterminativeProgress'] !== undefined &&
      strategy.hasDeterminativeProgress();
  };

  /*
    Shows the progress dialog based on the
  */
  var displayProgress = function displayProgress() {
    var progressClass = determinativeProgress ? 'progressBar' : 'spinner';

    progress = utils.overlay.show(
      strategy.getExportTitle(),
      progressClass,
      null
    );

    // Allow the strategy to setup the progress bar
    if (determinativeProgress) {
      console.log('---> Setting: ' + contacts.length);
      progress.setTotal(contacts.length);
      //strategy.setProgressStep(progress.update);
    }
  };

  /*
    Contacts resolver, used to find a mozContact object
    given a filer
  */
  var contactsResolver = function contactsResolver(filter, cb) {
    var request = navigator.mozContacts.find(filter);
    request.onsuccess = function onSuccess(evt) {
      var contact = null;
      if (request.result.length > 0) {
        contact = request.result[0];
      }

      cb(contact);
    };

    request.onerror = function onError(evt) {
      cb(null);
    };
  };

  return {
    'init': init,
    'setExportStrategy': setExportStrategy,
    'start': start,
    'getContactsToImport': function() {return contacts;}
  };

}();
