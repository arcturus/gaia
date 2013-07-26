var exportSIMButton = document.querySelector('#exportSIM > button');

console.log('---------------------------> shim loaded');

function exportToSIM() {
  console.log('About to export all my contacts to the SIM');
  var request = navigator.mozContacts.find({});
  request.onsuccess = function() {
    var contacts = request.result;
    console.log('Got all the contacts ' + contacts.length);

    window.ContactsExporter.init(contacts);
    window.ContactsExporter.setExportStrategy(ContactsSIMExport);
    window.ContactsExporter.start();
  };

  request.onerror = function() {
    alert('Error getting all the contacts');
  };
}

function exportByIds() {
  console.log('About to export all my contacts to the SIM by id');
  var request = navigator.mozContacts.find({});
  request.onsuccess = function() {
    var contacts = request.result;
    var ids = [];
    contacts.forEach(function(contact) {
      ids.push(contact.id);
    });

    window.ContactsExporter.init(ids);
    window.ContactsExporter.setExportStrategy(ContactsSIMExport);
    window.ContactsExporter.start();
  };

  request.onerror = function() {
    alert('Error getting all the contacts');
  };
}

function exportSingleContactToSIM() {
  var contacts = [window.Contacts.getCurrentContact()];
  window.ContactsExporter.init(contacts);
  window.ContactsExporter.setExportStrategy(ContactsSIMExport);
  window.ContactsExporter.start();
}

exportSIMButton.addEventListener('click', exportToSIM);

var exportSingleButton = document.getElementById('export-contact');
exportSingleButton.addEventListener('click', exportSingleContactToSIM);

var exportToSimById = document.querySelector('#exportSIMID > button');
exportToSimById.addEventListener('click', exportByIds);
