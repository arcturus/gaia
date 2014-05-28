/*export LoopClient */

/**
  DOM Integration: Prepend before the class 'social-actions'
*/
var LoopClient = (function LoopClient() {

  var start = function start(contact) {
    console.log('Loop start ' + JSON.stringify(contact));
  };

  var stop = function stop() {
    console.log('Loop stop');
  };

  return {
    start: start,
    stop: stop
  }

})();
