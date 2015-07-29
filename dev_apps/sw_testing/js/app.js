var $ = document.querySelector.bind(document);
var img = $('img');

$('#load-from-package').onclick = () => {
  measureLoadFromPackage();
};

$('#load-from-http-cache').onclick = () => {
  measureLoadFromHttpCache();
};

function clear() {
  performance.clearMarks();
  performance.clearMeasures();
}

function measureLoadFromPackage() {
  clear();
  measureLoad('/img/test.png', { cache: 'no-cache' });
}

function measureLoadFromHttpCache() {
  clear();
  fetch('/img/test.png', { cache: 'default' })
    .then(() => measureLoad('/img/test.png', { cache: 'force-cache' }));
}

function measureLoad(url, options) {
  fetch(url, options).then(() => {
    performance.measure('resource_load', 'resource_load_start');
    var m = performance.getEntriesByName('resource_load')[0];
    console.log('resource_load', m);
    alert('resource_load: ' + m.duration);
  });
  performance.mark('resource_load_start');
}
