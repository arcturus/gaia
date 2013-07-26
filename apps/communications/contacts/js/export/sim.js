var ContactsSIMExport = function ContactsSIMExport() {

  var icc = navigator.mozIccManager || (navigator.mozMobileConnection &&
            navigator.mozMobileConnection.icc);
  var finishCallback;
  var exported = [];
  var notExported = [];
  var numContactsToImport = 0;

  /*
  var setContactsToExport = function setContactsToExport(cts) {
    contacts = cts;
  };
  */

  var configure = function configure() {
    numContactsToImport = window.ContactsExporter.getContactsToImport().length;
  };

  var hasDeterminativeProgress = function hasDeterminativeProgress() {
    return numContactsToImport > 1;
  };

  var getExportTitle = function getExportTitle() {
    return 'Export to SIM';
  };

  var doExport = function doExport(contact, next) {
    if (!icc) {
      // TODO: Better handling for icc errors
      return;
    }

    // Bug 895169
    if (contact.email.length == 0) {
      contact.email = null;
    }

    if (contact.name.length == 0) {
      contact.name = null;
    }

    if (contact.tel.length == 0) {
      contact.tel = [{'value': -1}];
    }
    // end Bug 895169
    var request = icc.updateContact('adn', contact);
    request.onsuccess = function onsuccess() {
      exported.push(contact);
      next();
    };
    request.onerror = function onerror() {
      notExported.push(contact);
      next();
    };
  };

  /*
    Done with all the contacts, we receive an cb where we
    can post information about what happened in the process
  */
  var finish = function finish(cb) {
    cb(null, exported.length, null);
  };

  return {
    //'setContactsToExport': setContactsToExport,
    'configure': configure,
    'shouldShowProgress': function() { return true },
    'hasDeterminativeProgress': hasDeterminativeProgress,
    'getExportTitle': getExportTitle,
    'doExport': doExport,
    'finish': finish
  };

}();
