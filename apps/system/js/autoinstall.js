var AutoInstall = function AutoInstall() {

  var autoinstallEnabled = false;
  var autoinstallChannel = null;
  var REGISTER_KEY = 'gaia.autoinstall.register';
  var SETTINGS_KEY = 'gaia.autoinstall';
  var PENDING_KEY = 'gaia.pending.manifest';

  // Grab the channel from the settings
  var settings = window.navigator.mozSettings;
  var req = settings.createLock().get(SETTINGS_KEY);
  req.onsuccess = function() {
    autoinstallChannel = req.result[SETTINGS_KEY];
    console.log('------> Autoinstall key ' + autoinstallChannel);
    if (autoinstallChannel) {
      console.log('Autoinstall enabled');
      autoinstallEnabled = true;
    }
  };

  // Handle the receiving of a message
  var handlePush = function handlePush(evt) {
    console.log('------->Received a message ' + evt.pushEndpoint);
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

  // Fetch new version and its content
  var handleVersion = function handleVersion(version) {
    // Fetch from the server what do we have to install
    var url = 'http://autoinstall.eu01.aws.af.cm/api/v1/get/';
    url += encodeURIComponent(autoinstallChannel) + '?clean=1';
    url += '&t=' + Math.random();
    console.log('Asking for pending installs to ' + url);

    getJSON(url, function onPending(error, pending) {
      if (error || !pending.history || pending.history.length == 0) {
        return;
      }

      autoinstall(pending.history);
    });
  };

  // Given a manifest, install it in silent mode
  var autoinstall = function autoinstall(manifests) {
    if (manifests == null || !Array.isArray(manifests) ||
      manifests.length == 0) {
      console.log('No more manifests to install \o/');
      settings.createLock().get({'gaia.pending.manifest': ''});
      return;
    }

    var next = manifests.pop();
    console.log('Next manifest to install is ' + next);
    settings.createLock().set({'gaia.pending.manifest': next});
    var request = window.navigator.mozApps.install(next);
    var continuee = function() {
      autoinstall(manifests);
    };
    request.onsuccess = continuee;
    request.onerror = continuee;
  };

  var getJSON = function(uri, cb, t) {
    var xhr = new XMLHttpRequest({mozSystem: true});
    var type = 'GET' || t;

    xhr.onload = function onLoad(evt) {
      if (xhr.status === 200 || xhr.status === 0 || xhr.status == null) {
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

  var AUTOINSTALL_ENDPOINT = 'http://autoinstall.eu01.aws.af.cm';
  var _register = function register(email, endpoint, callback) {
    // Post the info to the server
    var data = new FormData();
    data.append('email', email);
    data.append('client', endpoint);

    var url = AUTOINSTALL_ENDPOINT + '/api/v1/register';
    var xhr = new XMLHttpRequest({mozSystem: true});

    console.log('Registering against url ' + url);

    xhr.onload = function onLoad(evt) {
      if (xhr.status === 200 || xhr.status === 0 || xhr.status === null) {
        callback(null);
      } else {
        callback(xhr.status);
      }
    };
    xhr.onerror = function onError(err) {
      callback(err);
    };
    xhr.open('POST', url, true);
    xhr.send(data);
  };

  var _configure = function _configure(email) {
    console.log('---------> Ready to register ' + email);
    if (!navigator.push) {
      console.log('We dont have push api');
      return;
    }

    var req = navigator.push.register();
    req.onsuccess = function onSuccess(evt) {
      var endpoint = req.result;
      console.log('Register and got endpoint ' + endpoint);
      _register(email, endpoint, function onRegister(error) {
        console.log('Got a response from regisitration, error is ' + error);
        if (error) {
          console.error(error);
          return;
        }
        var obj = {
          'gaia.autoinstall': endpoint
        };
        settings.createLock().set(obj);
        autoinstallEnabled = true;
        autoinstallChannel = endpoint;
      });
    };

    req.onerror = function onError(evt) {
      console.error(evt);
    };
  };

  var configure = function configure() {
    if (!settings) {
      return;
    }
    settings.addObserver(REGISTER_KEY, function onSettings(event) {
      _configure(event.settingValue);
    });
  };


  return {
    'handlePush': handlePush,
    'configure': configure
  };

}();

AutoInstall.configure();

navigator.mozSetMessageHandler('push', AutoInstall.handlePush);
console.log('----> Registering for push ' + AutoInstall.handlePush);
