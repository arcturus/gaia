'use strict';

var ContactsSIMDomGenerator = (function ContactsSIMDomGenerator() {

  var iccs = {};

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
      // Fake id to beeing pickup by the generic handler
      // in sim_manager.js
      button.dataset.id = 'sim-import';
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


  var generate = function generate() {
    generateImportDOM();
    generateExportDOM();
  };

  var setIccs = function setIccs(theIccs) {
    iccs = theIccs;
  };

  return {
    'generate': generate,
    'setIccs': setIccs
  };
}());
