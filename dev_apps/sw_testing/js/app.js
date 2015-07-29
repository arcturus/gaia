window.addEventListener('DOMContentLoaded', function() {

  'use strict';

  var img = document.getElementById('theImage');
  var measureImageLoadButton = document.getElementById('measureImageLoad');
  
  /**
   * Perform a request to the network, setup the mark when we setup the image src and
   * the second mark just when we detect that has been loaded.
   */
  function measureImageLoad() {
   img.src = '';
   performance.clearMarks();
   performance.clearMeasures();
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
  
  measureImageLoadButton.addEventListener('click', measureImageLoad);
});
