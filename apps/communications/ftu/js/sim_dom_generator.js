'use strict';

var FTUSIMDomGenerator = (function FTUSIMDomGenerator() {

  var iccs = {};


  // Specific DOM generation for import options, generating the
  // following code:
  //<li id="sim_import_<iccid>" class="importOption">
  //  <button class="icon icon-sim"
  //    data-l10n-id="importSim2" data-iccid="<iccId>" data-id="sim-import">
  //      SIM card
  //  </button>
  //  <p id="no-sim-<iccid>" data-l10n-id="noSimMsg">
  //      To import insert a SIM card</p>
  //</li>
  var generate = function generate() {
    var importList = document.querySelector('#import_contacts ul');
    if (importList === null) {
      return;
    }
    var firstOption = importList.firstChild;

    Object.keys(iccs).forEach(function onIccId(iccId) {
      var li = document.createElement('li');
      li.dataset.iccid = iccId;
      li.id = 'sim_import_' + iccId;
      li.classList.add('importOption');

      var button = document.createElement('button');
      button.dataset.id = 'sim-import';
      button.dataset.iccid = iccId;
      button.classList.add('icon', 'icon-sim');
      button.textContent = iccId === 'default' ? _('importSim2') : iccId;

      var p = document.createElement('p');
      p.classList.add('error-message');
      p.textContent = _('noSimMsg');
      p.id = 'no-sim-' + iccId;

      li.appendChild(button);
      li.appendChild(p);

      importList.insertBefore(li, firstOption);
    });
  };

  var setIccs = function setIccs(theIccs) {
    iccs = theIccs;
  };

  return {
    'generate': generate,
    'setIccs': setIccs
  };
}());
