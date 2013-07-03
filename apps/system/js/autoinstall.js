var AutoInstall = function AutoInstall() {

  var autoinstallEnabled = false;
  var autoinstallChannel = null;
  var SETTINGS_KEY = 'gaia.autoinstall';
  var PENDING_KEY = 'gaia.pending.manifest';

  // Grab the channel from the settings
  var settings = window.navigator.mozSettings;
  var req = settings.createLock().get(this.SETTINGS_KEY);
  req.onsuccess = function() {
    autoinstallChannel = req.result[this.SETTINGS_KEY];
    if (autoinstallChannel) {
      autoinstallEnabled = true;
    }
  };

  var handlePush = function handlePush(evt) {
    if (!autoinstallEnabled) {
      return;
    }

    var channel = evt.pushEndpoint;

    if (channel !== autoinstallChannel) {
      return;
    }

    var version = evt.version;
    handleVersion(version);
  };

  var handleVersion = function handleVersion(version) {
    // Fetch from the server what do we have to install
    var url = 'http://autoinstall.eu01.aws.af.cm/api/v1/get/';
    url + = encodeURIComponent(autoinstallChannel) + '?clean=1';

    getJSON(url, function onPending(error, pending) {
      if (error || !pending.history || pending.history.length == 0) {
        return;
      }

      autoinstall(pending.history);
    });
  };

  var autoinstall = function autoinstall(manifests) {
    var settings = window.navigator.mozSettings;
    if (manifest == null || !Array.isArray(manifest) || manifest.length == 0) {
      settings.createLock().get({this.PENDING_KEY: ''});
      return;
    }

    var next = manifests.pop();
    settings.createLock().get({this.PENDING_KEY: next});
    var request = window.navigator.mozApps.install(next);
    var continuee = function() {
      autoinstall(manifests);
    };
    request.onsuccess = continuee;
    request.onerror = continuee;
  };

  var getJSON = function(uri, cb) {
    var xhr = new XMLHttpRequest({mozSystem: true});

    xhr.onload = function onLoad(evt) {
      if (xhr.status === 200 || xhr.status === 0) {
        cb(null, JSON.parse(xhr.responseText));
      } else {
        cb(xhr.status);
      }
    };
    xhr.open(type, uri, true);
    xhr.onerror = function onError(e) {
      console.error('onerror en xhr ' + xhr.status);
      cb(e);
    };
    xhr.send(null);
  };

  return {
    'handlePush': handlePush
  };

}();

navigator.mozSetMessageHandler('push', AutoInstall.handlePush);
