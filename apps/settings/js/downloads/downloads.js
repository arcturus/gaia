'use strict';

var DownloadList = (function DownloadList() {

  var fakeDownloads = [
    {
      'totalBytes': 4000,
      'currentBytes': 1200,
      'url': 'http://www.example1.com/FileName.doc',
      'state': 'downloading',
      'contentType': 'audio/mpeg'
    },
    {
      'totalBytes': 4000,
      'currentBytes': 1200,
      'url': 'http://www.example2.com/FileName.doc',
      'state': 'paused',
      'contentType': 'audio/mpeg'
    },
    {
      'totalBytes': 4000,
      'currentBytes': 4000,
      'url': 'http://www.example3.com/Supreme_Neva_remix.mp3',
      'state': 'stopped',
      'contentType': 'audio/mpeg'
    },
    {
      'totalBytes': 4000,
      'currentBytes': 1200,
      'url': 'http://www.example4.com/FileName.doc',
      'state': 'canceled',
      'contentType': 'audio/mpeg'
    }

  ];

  navigator.mozDownloadManager = {
    'getDownloads': function() {
      return {
        'then': function(fulfill, reject) {
          fulfill(fakeDownloads);
        }
      };
    },
    'remove': function(download) {
      return {
        'then': function(fulfill, reject) {
          var found = false;
          fakeDownloads.forEach(function(d, index) {
            if (d === download) {
              delete fakeDownloads[index];
              found = true;
            }
          });
          if (found) {
            fulfill(download);
          } else {
            reject(download);
          }
        }
      };
    },
    'clearAllDone': function() {
      return {
        'then': function(fulfill, reject) {
          fakeDownloads = [];
          fulfill();
        }
      };
    },
    set ondownloadstart(f) {
      this.onstartcallback = f;
    },
    set ondownloadstop(f) {
      this.onstopcallback = f;
    }
  };

  var downloadList,
      downloads;

  var init = function init() {

    downloadList = document.querySelector('#downloadList ul');
    downloads = [];

    LazyLoader.load(['js/downloads/download_item.js',
      'shared/js/download/download_ui.js',
      'shared/js/mime_mapper.js',
      'shared/js/download/download_launcher.js'], function() {
      loadList();
    });
  };

  var loadList = function loadList() {
    var downloadsPromise = navigator.mozDownloadManager.getDownloads();

    downloadsPromise.then(function onDownloads(downls) {
      downloads = downls;

      if (!downloads || downloads.length == 0) {
        console.log('No downloads available message');
        return;
      }

      downloads.forEach(function(download) {
        var li = DownloadItem.create(download);
        downloadList.appendChild(li);
        li.addEventListener('click', onDownloadAction);

        if (download.state === 'downloading' && download.onstatechange) {
          download.onstatechange = onDownloadStateChange;
        }
      });
    }, function error(e) {
      console.log('Error ' + e);
    });
  };

  var lookupForDownload = function lookupForDownload(url) {
    // We could have a dictionary, also just looking by url
    // is not enought, fallback to the id that we will generate
    var result = null;
    downloads.forEach(function(d) {
      if (d.url === url) {
        result = d;
      }
    });

    return result;
  };

  var lookupDOMDownload = function lookupDOMDownload(download) {
    // Again use an unique identifier not the url
    return downloadList.querySelector('[data-url="' + download.url + '"]');
  };

  var onDownloadAction = function onDownloadAction(evt) {
    var url = evt.target.dataset.url;
    var download = lookupForDownload(url);

    if (!download) {
      return;
    }

    switch (download.state) {
      case 'downloading':
        // downlading -> paused
        pauseDownload(download);
        break;
      case 'paused':
      case 'canceled':
        // paused -> downloading
        restartDownload(download);
        break;
      case 'stopped':
        // launch an app to view the download
        launchDownload(download);
        break;
    }
  };

  var pauseDownload = function pauseDownload(download) {
    var request = DownloadUI.show(DownloadUI.TYPE.STOP, download);

    request.onconfirm = function() {
      if (download.pause) {
        download.pause().then(function() {
          // Remove listener
          download.onstatechange = null;
          updateDOMDownload(download);
        }, function() {
          console.error('Could not pause the download');
        });
      }
    };
  };

  var restartDownload = function restartDownload(download) {
    var request = DownloadUI.show(DownloadUI.TYPE.STOPPED, download);

    request.onconfirm = function() {
      if (download.resume) {
        download.resume().then(function() {
          download.onstatechange = onDownloadStateChange;
          updateDOMDownload(download);
        });
      }
    };
  };

  var launchDownload = function launchDownload(download) {
    DownloadLauncher.launch(download);
  };

  var onDownloadStateChange = function onDownloadStateChange(evt) {
    var download = evt.target.download;
    updateDOMDownload(download);
  };

  var updateDOMDownload = function updateDOMDownload(download) {
    request = DownloadItem.update(lookupDOMDownload(download), download);
    request.onerror = function() {
      alert(req.error.message);
    };
  };

  return {
    'init': init
  };

}());

DownloadList.init();
