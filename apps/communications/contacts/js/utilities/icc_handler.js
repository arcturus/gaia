//
// IccManager Handler, abstract the new IccManager Multi SIM
// API.
// Generates code and handles listener for multiple SIMs
//
'use strict';

var Icc_Handler = function Icc_Handler() {

  var iccManager = navigator.mozIccManager;
  var isSingleSIM = typeof iccManager.getIccById !== 'function';
  var iccs = {};

  if (isSingleSIM) {
    iccs['default'] = iccManager;
  } else {
    for (var iccId in iccManager.iccIds) {
      iccs[iccId] = iccManager.getIccById(iccId);
    }
  }

  // Specific DOM generation for export options, generating the
  // following code:
  //<li id="export-sim-option" data-source="sim">
  //  <button class="icon icon-sim" data-l10n-id="simCard">
  //    SIM card
  //  </button>
  //  <p class="error-message" data-l10n-id="noSimMsgExport"></p>
  //</li>
  var generateExportDOM = function generateExportDOM() {
    var exportList = document.getElementById('export-options');
    if (exportList === null) {
      return;
    }

    var firstOption = exportList.firstChild;

    Object.keys(iccs).forEach(function onIccId(iccId) {
      var li = document.createElement('li');
      li.id = 'export-sim-option-' + iccId;
      li.dataset.source = 'sim';
      li.dataset.iccid = iccId;

      var button = document.createElement('button');
      button.classList.add('icon', 'icon-sim');
      button.textContent = iccId === 'default' ? _('importSim2') : iccId;

      var p = document.createElement('p');
      p.classList.add('error-message');
      p.textContent = _('noSimMsgExport');

      li.appendChild(button);
      li.appendChild(p);

      exportList.insertBefore(li, firstOption);
    });
  };

  // Specific DOM generation for import options, generating the
  // following code:
  //<li id="import-sim-option" data-source="sim">
  //  <button class="icon icon-sim" data-l10n-id="importSim2">
  //    SIM card
  //    <p><span></span><time></time></p>
  //  </button>
  //  <p class="error-message" data-l10n-id="noSimMsg"></p>
  //</li>
  var generateImportDOM = function generateImportDOM() {
    var importList = document.getElementById('import-options');
    if (importList === null) {
      return;
    }
    var firstOption = importList.firstChild;

    Object.keys(iccs).forEach(function onIccId(iccId) {
      var li = document.createElement('li');
      li.dataset.source = 'sim';
      li.dataset.iccid = iccId;
      li.id = 'import-sim-option-' + iccId;

      var button = document.createElement('button');
      button.classList.add('icon', 'icon-sim');
      button.textContent = iccId === 'default' ? _('importSim2') : iccId;

      var pTime = document.createElement('p');
      pTime.appendChild(document.createElement('span'));
      pTime.appendChild(document.createElement('time'));

      button.appendChild(pTime);

      var p = document.createElement('p');
      p.classList.add('error-message');
      p.textContent = _('noSimMsg');

      li.appendChild(button);
      li.appendChild(p);

      importList.insertBefore(li, firstOption);
    });
  };

  // Builds the dom depending on how many iccs do
  // we have in the device
  var generateDOM = function generateDOM() {
    generateImportDOM();
    generateExportDOM();
  };

  // Make all the SIMS to listen to the same change observer
  var subscribeToChanges = function subscribeToChanges(cb) {
    Object.keys(iccs).forEach(function onIccId(iccId) {
      var icc = iccs[iccId].oncardstatechange = cb;
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

  return {
    'generateDOM': generateDOM,
    'subscribeToChanges': subscribeToChanges,
    'getStatus': getStatus,
    'getIccById': getIccById
  };

}();
