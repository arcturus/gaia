document.addEventListener('resultsDone', function() {
  navigator.serviceWorker.controller.postMessage('');
});

addEventListener('message', function(evt) {
  alert('Got results from worker');
  console.log(evt);
});
