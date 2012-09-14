'use strict';

if (!window.google) {
  var google = {};
}

var YQL = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'https%3A%2F%2Fwww.google.com%2Fm8%2Ffeeds%2Fcontacts%2Fdefault%2Ffull%3Faccess_token%3D%ACCESS_TOKEN%%26start-index%3D1%26max-results%3D10000'&format=json&callback=parseContacts";

google.auth = function auth() {
  var accessToken;

  var getURL = function getURL(url, success, error) {
    var request = new XMLHttpRequest();
    var theUrl = url;
    if (theUrl.indexOf('?') == -1) {
      theUrl += '?';
    } else {
      theUrl += '&';
    }
    theUrl += 'access_token=' + encodeURIComponent(accessToken);

    request.open('GET', theUrl, true);
    //request.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    //request.setRequestHeader('Gdata-version', '3.0');
    request.withCredentials = 'true';
    request.onload = function loaded() {
      success(request.responseXML);
    };

    request.onerror = error;

    request.send();
  };

  var getContacts = function getContacts() {
    //var url = 'https://www.googleapis.com/auth/contacts.readonly';
    //var url = 'https://www.googleapis.com/m8/feeds/contacts/default/full';
    /*
    var url = 'https://www.google.com/m8/feeds/contacts/default/full';

    var log = function (request) {
      console.log(request.responseText);
    };
    getURL(url, log, log);
    */
    var scrptE = document.createElement("script");
    scrptE.setAttribute("type", "text/javascript");
    scrptE.setAttribute("language", "JavaScript");
    scrptE.setAttribute("src", YQL.replace('%ACCESS_TOKEN%', accessToken));
    document.getElementsByTagName("head")[0].appendChild(scrptE);
  };

  var init = function init() {
    if (window.location.hash.indexOf('access_token') == -1) {
      return false;
    }

    var paramsString = window.location.hash.slice(1);
    var params = paramsString.split('&');
    for (var i = 0; i < params.length; i++) {
      var param = params[i].split('=');
      if (param[0] == 'access_token') {
        accessToken = param[1];
        return true;
      }
    }

    return false;
  };

  var getAccessToken = function getAccessToken() {
    return accessToken;
  }

  return {
    'init': init,
    'getAccessToken': getAccessToken,
    'getContacts': getContacts
  }
}();

google.auth.init();
google.auth.getContacts();

function parseContacts(response) {
  var results = response.query.results.feed.totalResults;
  var contactList = response.query.results.feed.entry;

  /*
      
  <li data-tag="A" data-state="tagged">
        <a href="#">
          <em class="aside">
             <time>9AM</time>
         </em>
         <dl>
           <dt>Paper Due</dt>
         </dl>
        </a>
      </li>

      <li data-tag="B" data-state="tagged">
        <em class="aside">
          <time>11AM</time>
        </em>
        <dl>
          <dt>Paper Due</dt>
          <dd><span>Madrid. Steve, Sergi, Victoria, Silvia, E...</span></dd>
        </dl>
      </li>
  */
  var container = document.getElementById('contactsList');
  for (var i = 0; i < contactList.length; i++) {
    var contact = contactList[i];
    var li = document.createElement('li');
    var title = contact.title.content;
    var showingEmail = false;
    if (!title && contact.email) {
      title = contact.email.address;
      showingEmail = true;
    }
    var subtitle = contact.phoneNumber ? contact.phoneNumber.content : '';
    if (!subtitle && contact.email && !showingEmail) {
      subtitle = contact.email.address;
    }
    li.dataset['tag'] = i % 2 == 0 ? 'A' : 'B';
    li.dataset['stage'] = 'tagged';
    li.innerHTML = '<em class="asside"></em><dl><dt>' + title + '</dt><dd>' + subtitle + '</dd></dl>';

    container.appendChild(li);
  }

}