'use strict';

if (!window.google) {
  var google = {};
}

var global = {};
global.imported = 0;

google.ui = function ui() {

  var progressBar = document.querySelector('#import_progress progress');
  var progressText = document.querySelector('#import_progress span');

  var printContacts = function printContacts(contactsList) {
    var container = document.getElementById('contactsList');
    for (var i = 0; i < contactsList.length; i++) {
      var contact = contactsList[i];
      var li = document.createElement('li');
      var title = contact.name;
      var showingEmail = false;
      if (!title && contact.email) {
        title = contact.email[0].value;
        showingEmail = true;
      }
      var subtitle = '';
      if (contact.tel) {
        subtitle = contact.tel[0].value;
      }
      
      if (subtitle == '' && contact.email && !showingEmail) {
        subtitle = contact.email[0].value;
      }
      li.dataset['tag'] = i % 2 == 0 ? 'A' : 'B';
      li.dataset['state'] = 'tagged';
      var img = '<img/>';      
      li.innerHTML = img + '<dl><dt>' + title + '</dt><dd>' + subtitle + '</dd></dl>';

      container.appendChild(li);
    }

    document.getElementById('progress').classList.add('hide');    
    document.getElementById('contactsList').classList.remove('hide');
  };

  var showContactsParsed = function showContactsParsed(num) {
    document.getElementById('progress').classList.add('hide');

    document.querySelector('#import h2').innerHTML = num + ' contacts found!';
    var importButton = document.querySelector('#import button');
    importButton.disabled = num == 0 ? 'disabled' : false;

    document.getElementById('import').classList.remove('hide');
  }

  var showImporting = function showImporting() {
    document.getElementById('import').classList.add('hide');
    document.getElementById('import_progress').classList.remove('hide');

    setTimeout(google.ui.updateStatus, 1000);
  };

  var updateStatus = function updateStatus() {
    var total = google.contacts.getContacts().length;
    var imported = global.imported;
    var percentage = Math.floor(imported * 100 / total);

    progressText.innerHTML = percentage + ' %';
    progressBar.value = percentage;

    if (percentage != 100) {
      setTimeout(updateStatus, 1000);
    } else {
      document.querySelector('#import_progress button').classList.remove('hide');
    }

  };

  var showImportedContacts = function showImportedContacts() {
    document.getElementById('import_progress').classList.add('hide');
    printContacts(google.contacts.getContacts());
    document.getElementById('contactsList').classList.remove('hide');
  };

  return {
    'showContactsParsed': showContactsParsed,
    'showImporting': showImporting,
    'updateStatus': updateStatus,
    'showImportedContacts': showImportedContacts
  };

}();

google.auth = function auth() {
  var accessToken;

  var getURL = function getURL(url, success, error) {
    var request = new XMLHttpRequest();
    var theUrl = googleUrl(url);

    request.open('GET', theUrl, true);
    request.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    request.setRequestHeader('Gdata-version', '3.0');
    request.withCredentials = 'true';
    request.onload = function loaded() {
      success(request.responseXML);
    };

    request.onerror = error;

    request.send();
  };

  var init = function init(at) {
    accessToken = at;
  };

  var getAccessToken = function getAccessToken() {
    return accessToken;
  };

  var googleUrl = function googleUrl(url) {
    if (!accessToken) {
      return url;
    }

    var theUrl = url;
    if (theUrl.indexOf('?') == -1) {
      theUrl += '?';
    } else {
      theUrl += '&';
    }
    theUrl += 'access_token=' + encodeURIComponent(accessToken);

    return theUrl;
  }

  return {
    'init': init,
    'getAccessToken': getAccessToken,
    'googleUrl': googleUrl
  }
}();

google.contacts = function contacts() {

  var YQL = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'https%3A%2F%2Fwww.google.com%2Fm8%2Ffeeds%2Fcontacts%2Fdefault%2Ffull%3Faccess_token%3D%ACCESS_TOKEN%%26start-index%3D1%26max-results%3D10000'&format=json&callback=google.contacts.parseContacts";
  var contacts = null;

  var fetchContacts = function getContacts() {
    var scrptE = document.createElement("script");
    scrptE.setAttribute("type", "text/javascript");
    scrptE.setAttribute("language", "JavaScript");
    scrptE.setAttribute("src", YQL.replace('%ACCESS_TOKEN%', google.auth.getAccessToken()));
    document.getElementsByTagName("head")[0].appendChild(scrptE);
  };

  var parseContacts = function parseContacts(response) {
    var contactsList = [];
    try {
      var results = response.query.results.feed.totalResults;
      var contactsList = response.query.results.feed.entry;
    } catch (e) {
      // Problem fetching contact, shut up and say you have 0 contacts
    }

    var parsedContacts = [];
    for (var i = 0; i < contactsList.length; i++) {
      var contact = contactsList[i];
      
      if (contact.phoneNumber ||
          contact.email ||
          contact.organization) {
        var parsedContact = {};

        if (contact.title && contact.title.content) {
          parseName(contact.title.content, parsedContact);
        }
        if (contact.phoneNumber) {
          parsePhoneNumber(contact.phoneNumber, parsedContact);
        }
        if (contact.email) {
          parseEmail(contact.email, parsedContact);
        }
        if (contact.organization) {
          parseOrg(contact.organization, parsedContact);
        }

        parsedContacts.push(parsedContact);
      }
    }
    
    google.contacts.setContacts(parsedContacts);
    google.ui.showContactsParsed(parsedContacts.length);

  };

  var parseName = function parseName(name, contact) {
    contact.name = [name];
    var name = name.split(' ');
    if (name.length == 1) {
      contact.giveName = name;
    } else if (name.length == 2) {
      contact.giveName = [name[0]];
      contact.familyName = [name[1]];
    } else {
      contact.giveName = [name[0]];
      contact.additionalName = [name[1]];
      contact.familyName = [name.slice(2).join(' ')];
    }
  };

  var parsePhoneNumber = function parsePhoneNumber(rawPhone, contact) {
    var phones = Array.isArray(rawPhone) ? rawPhone : [rawPhone];

    contact.tel = [];
    for(var i = 0; i < phones.length; i++) {
      var originalPhone = phones[i];
      var phone = {
        'value': originalPhone.content,
        'carrier': null,
        'type': 'mobile' //Add a default value :(
      };
      contact.tel.push(phone);
    }
  };

  var parseEmail = function parseEmail(rawEmail, contact) {
    var emails = Array.isArray(rawEmail) ? rawEmail : [rawEmail];

    contact.email = [];
    for(var i = 0; i < emails.length; i++) {
      var originalEmail = emails[i];
      var email = {
        'value': originalEmail.address,
        'type': 'personal' // Default value
      }
      contact.email.push(email);
    }
  };

  var parseOrg = function parseOrg(rawOrg, contact) {
    var orgs = Array.isArray(rawOrg) ? rawOrg : [rawOrg];

    contact.org = [];
    for(var i = 0; i < orgs.length; i++) {
      contact.org.push(orgs[i].orgName);
    }
  }

  var importContacts = function importContacts() {
    google.ui.showImporting();

    var contactsSaver = new ContactsSaver(contacts);
    contactsSaver.start();
    var self = this;
    contactsSaver.onsaved = function(c) {
      global.imported++;
    };
    contactsSaver.onerror = function(c, e) {
      global.imported++;
      console.log('Error importing ' + e);
    }
  };

  var setContacts = function setContacts(parsedContacts) {
    contacts = parsedContacts;
  };

  var getContacts = function getContacts() {
    return contacts;
  }

  return {
    'parseContacts': parseContacts,
    'fetchContacts': fetchContacts,
    'importContacts': importContacts,
    'setContacts': setContacts,
    'getContacts': getContacts
  }
}();

/* Based on the UI tests */
function ContactsSaver(data) {
  this.data = data;
  var next = 0;
  var self = this;

  this.start = function() {
    saveContact(data[0]);
  }

  function saveContact(cdata) {
    var contact = new mozContact();
    contact.init(cdata);
    var req = navigator.mozContacts.save(contact);
    req.onsuccess = function(e) {
      if (typeof self.onsaved === 'function') {
        self.onsaved(contact);
      }
      continuee();
    }

    req.onerror = function(e) {
      if (typeof self.onerror === 'function') {
        self.onerror(self.data[next], e.target.error);
      }
    }
  }

  function continuee() {
    next++;
    if (next < self.data.length) {
      saveContact(self.data[next]);
    }
    else {
          // End has been reached
          if (typeof self.onsuccess === 'function') {
            self.onsuccess();
          }
    }
  }
}