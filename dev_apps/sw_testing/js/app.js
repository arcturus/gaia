var IMAGE_SIZE = 877737; // bytes

var $ = document.querySelector.bind(document);
var img = $('img');

$('#load-from-package').onclick = () => {
  measureLoadFromPackage();
};

var httpCacheBtn = $('#load-from-http-cache');
if (httpCacheBtn) {
  httpCacheBtn.onclick = () => {
    measureLoadFromHttpCache();
  };
}

function clear() {
  performance.clearMeasures();
}

function measureLoadFromPackage() {
  clear();
  times(100, () => measureLoad('/img/test.png', { cache: 'no-cache' }))
    .then(showResults('resource_load'));
}

function measureLoadFromHttpCache() {
  clear();
  fetch('/img/test.png', { cache: 'force-cache' })
    .then(() => times(
      100,
      () => measureLoad('/img/test.png', { cache: 'force-cache' })
    ))
    .then(showResults('resource_load'));
}

function measureLoad(url, options) {
  performance.clearMarks();
  performance.mark('resource_load_start');
  return fetch(url, options).then(() => {
    performance.measure('resource_load', 'resource_load_start');
  });
}

function showResults(measure) {
  return function () {
    var entries = performance.getEntriesByName(measure);
    var n = entries.length;
    var avg = entries.reduce((sum, entry) => sum + entry.duration, 0) / n;
    var deviation = Math.sqrt(
      entries.reduce(
        (sum, entry) => sum + Math.pow(entry.duration - avg, 2),
        0
      ) / n
    );
    var bandwidth = IMAGE_SIZE / avg / 1000;
    console.log(measure);
    console.log('n:', n);
    console.log('avg:', avg);
    console.log('deviation:', deviation);
    console.log('bandwidth:', bandwidth, 'bytes per second');
    alert([
      measure,
      'n: ' + n,
      'avg: ' + avg.toFixed(2) + 'ms',
      'deviation: ' + deviation,
      'bandwidth: ' + bandwidth + ' bytes per second'
    ].join('\n'));
    document.dispatchEvent(new CustomEvent('resultsDone'));
  };
}

function times(n, operation) {
  if (n > 0) {
    return operation().then(() => times(n-1, operation));
  }
  return Promise.resolve();
}
