var ContactsSIMExport = function ContactsSIMExport() {

  var contacts;
  var progressStep;
  var icc = navigator.mozIccManager || (navigator.mozMobileConnection &&
            navigator.mozMobileConnection.icc);
  var finishCallback;
  var exported = [];
  var notExported = [];

  var setContactsToExport = function setContactsToExport(cts) {
    contacts = cts;
  };

  var hasDeterminativeProgress = function hasDeterminativeProgress() {
    return contacts.length > 1;
  };

  var setProgressStep = function setProgressStep(p) {
    progressStep = p;
  };

  var getExportTitle = function getExportTitle() {
    return 'Export to SIM';
  };

  var doExport = function doExport(cb) {
    finishCallback = cb;
    if (!icc) {
      finishCallback({
        'reason': 'No SIM'
      }, contacts.length, 0, 'No SIM detected');
      return;
    }
    _doExport(0);
  };

  var _doExport = function _doExport(step) {
    if (step == contacts.length) {
      finishCallback(null, exported.length, null);
      return;
    }

    var continuee = function continuee(success, contact) {
      var resultArray = success ? exported : notExported;
      resultArray.push(contact);
      step++;
      if (progressStep) {
        progressStep();
      }
      _doExport(step);
    };

    var theContact = contacts[step];

    // Bug 895169
    if (theContact.email.length == 0) {
      theContact.email = null;
    }

    if (theContact.name.length == 0) {
      theContact.name = null;
    }

    if (theContact.tel.length == 0) {
      theContact.tel = [{'value': -1}];
    }
    // end Bug 895169
    var request = icc.updateContact('adn', theContact);
    request.onsuccess = function onsuccess() {
      continuee(true, theContact);
    };
    request.onerror = function onerror() {
      // Don't send an error, just continue
      continuee(false, theContact);
    };

  };

  return {
    'setContactsToExport': setContactsToExport,
    'shouldShowProgress': function() { return true },
    'hasDeterminativeProgress': hasDeterminativeProgress,
    'getExportTitle': getExportTitle,
    'doExport': doExport,
    'setProgressStep': setProgressStep
  };

}();
