//
// IccManager Handler, abstract the new IccManager Multi SIM
// API.
// Generates code and handles listener for multiple SIMs
//
'use strict';

var Icc_Handler = function Icc_Handler() {

  var iccManager = navigator.mozIccManager;
  var isSingleSIM = iccManager && typeof iccManager.getIccById !== 'function';
  var iccs = {};
  var domGenerator = null;

  if (isSingleSIM) {
    iccs['default'] = iccManager;
  } else if (iccManager) {
    for (var iccId in iccManager.iccIds) {
      iccs[iccId] = iccManager.getIccById(iccId);
    }
  }

  // Make all the SIMS to listen to the same change observer
  var subscribeToChanges = function subscribeToChanges(cb) {
    Object.keys(iccs).forEach(function onIccId(iccId) {
      iccs[iccId].oncardstatechange = cb;
    });
  };

  // Get the status of all the SIMs, not just the status, also
  // the proper icc object
  var getStatus = function getStatus() {
    var status = [];
    Object.keys(iccs).forEach(function onIccId(iccId) {
      var icc = iccs[iccId];
      status.push({
        'iccId': iccId,
        'icc': icc,
        'cardState': icc.cardState
      });
    });

    return status;
  };

  // Returns the specific icc depending on id.
  // If id is null will try to get the one named 'default'
  var getIccById = function getIccById(id) {
    if (!id) {
      id = 'default';
    }

    return iccs[id];
  };

  var generateDOM = function generateDOM() {
    if (domGenerator != null &&
      typeof domGenerator === 'object' &&
      typeof domGenerator.generate === 'function') {
      domGenerator.generate();
    }
  };

  var setDOMGenerator = function setDOMGenerator(g) {
    if (g && typeof g.setIccs === 'function') {
      domGenerator = g;
      domGenerator.setIccs(iccs);
    }
  };

  var getIccIds = function getIccIds() {
    return Object.keys(iccs);
  };

  return {
    'generateDOM': generateDOM,
    'subscribeToChanges': subscribeToChanges,
    'getStatus': getStatus,
    'getIccById': getIccById,
    'setDOMGenerator': setDOMGenerator,
    'getIccIds': getIccIds
  };

}();
