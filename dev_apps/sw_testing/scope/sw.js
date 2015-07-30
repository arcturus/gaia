addEventListener('activate', function(evt) {
  evt.waitUntil(self.clients.claim());
});

addEventListener('fetch', function(evt) {
  evt.respondWith(fetch(evt.request));
});

// addEventListener('message', function(evt) {
//   var marks = performance.getEntries();
//   console.log('Performance in the worker:');
//   marks.forEach(function(mark) {
//     console.log(JSON.stringify(mark));
//   });
// });
