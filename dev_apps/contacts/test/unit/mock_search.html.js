'use strict';
/* exported MockSearchHtml */

var MockSearchHtml = (function MockSearchHtml() {
  var req = new XMLHttpRequest();
  req.open('GET', '/test/unit/mock_search.html', false);
  req.send(null);

  return req.responseText;
})();
