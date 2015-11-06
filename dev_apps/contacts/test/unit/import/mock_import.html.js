'use strict';

/* exported MockImportHtml */

var MockImportHtml = (function MockGoogleListing() {
  var req = new XMLHttpRequest();
  req.open('GET', '/test/unit/import/mock_import.html', false);
  req.send(null);

  return req.responseText;
})();
