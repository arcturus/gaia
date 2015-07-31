/* global caches,  performance, fetch, Request, Response */
'use strict';
var cachePromise = caches.open('offline');

addEventListener('install', function(evt) {
  console.log('Installing');
  evt.waitUntil(cachePromise.then( cache => {
    // var requests = [];
    // ['/img/test.png', '/precached/install-sw.js',
    // '/precached/precached.html'].forEach(url => {
    //   requests.push(new Request(url));
    // });
    // return cache.addAll(requests);
    var files = {
      '/img/test.png': 'image/png',
      '/precached/precached.html': 'text/html',
      '/precached/install-sw.js': 'application/javascript'
    };
    var requests = [];
    var urls = Object.keys(files);
    urls.forEach(url => {
      requests.push(fetch(url));
    });

    return Promise.all(requests).then(responses => {
      var cacheCalls = [];
      responses.forEach((response, index) => {
        var url = urls[index];
        var request = new Request(url);
        var newResponse = new Response(response.body,
           {'content-type': files[url]});
        cacheCalls.push(cache.put(request, newResponse));
      });
      return Promise.all(cacheCalls);
    });
  }));
});

addEventListener('activate', function(evt) {
  console.log('Activating');
  evt.waitUntil(self.clients.claim());
});

addEventListener('fetch', function(evt) {
  console.log('Doing fetch for ' + evt.request.url);
  performance.clearMarks();
  performance.mark('fetch_start');
  evt.respondWith(cachePromise.then(cache => {
    console.log('I have a cache ', cache);
    performance.mark('cache_start');
    cache.match(evt.request).then(response => {
      console.log('Doing the matching with response ', response.clone());
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
  self.clients.matchAll().then(clients => {
    clients[0].postMessage(JSON.stringify(measures));
  });
});
