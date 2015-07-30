var cachePromise = caches.open('offline');

addEventListener('activate', function(evt) {
  var operations = [];
  operations.push(self.clients.claim());
  operations.push(cachePromise.then(cache => {
    cache.addAll(['/img/test.png', '/precached/install-sw.js',
    '/precache/precached.html']);
  }));
  evt.waitUntil(Promise.all(operations));
});

addEventListener('fetch', function(evt) {
  performance.clearMarks();
  performance.mark('fetch_start');
  evt.respondWith(cachePromise.then(cache => {
    performance.mark('cache_start');
    cache.match(evt.request).then(response => {
      performance.measure('time_to_cache', 'cache_start');
      if (response) {
        performance.measure('time_to_fetch', 'fetch_start');
        return response;
      }

      return fetch(evt.request);
    });
  }));
});

addEventListener('message', function(evt) {
  performance.clearMarks();
  var measures = performance.getEntries();
  console.log('Performance in the worker:');
  measures.forEach(function(measure) {
    console.log(JSON.stringify(measure));
  });
  clients.matchAll().then(clients => {
    clients[0].postMessage(JSON.stringify(measures));
  });
});
