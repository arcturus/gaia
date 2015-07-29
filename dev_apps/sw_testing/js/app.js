window.addEventListener('DOMContentLoaded', function() {

  'use strict';

  var img = document.getElementById('theImage');
  var measureImageLoadButton = document.getElementById('measureImageLoad');
  var measureImageLoadSWButton = document.getElementById('measureImageLoadSW');
  
  function clean() {
    img.src = '';
    performance.clearMarks();
    performance.clearMeasures();
  }
  
  /**
   * Perform a request to the network, setup the mark when we setup the image src and
   * the second mark just when we detect that has been loaded.
   */
  function measureImageLoad() {
   clean();
   img.onload = function() {
     performance.measure('image_loaded', 'image_load_start');
     var entries = performance.getEntriesByName('image_loaded');
     var entry = entries[0];
     console.log(entry);
     alert('Duration: ' + entry.duration);
   };
   img.src = '/img/test.png';
   performance.mark('image_load_start');
  }
  
  function installSW() {
    navigator.serviceWorker.register('sw.js').then(null, function(err) {
      alert(err);
    });
  }
  
  function measureImageLoadSW() {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg && reg.active) {
        measureImageLoad();
      }
      navigator.serviceWorker.addEventListener('controllerchange', function(evt) {
        measureImageLoad();
      });
      installSW();
    });
  }
  
  measureImageLoadButton.addEventListener('click', measureImageLoad);
  measureImageLoadSWButton.addEventListener('click', measureImageLoadSW);
});
