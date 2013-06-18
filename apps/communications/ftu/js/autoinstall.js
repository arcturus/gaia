var AutoInstall = function AutoInstall() {

  var settings = window.navigator.mozSettings;

  var _register = function register(email, endpoint, callback) {
    if (callback) {
      callback();
    }
  };

  var configure = function configure(email) {
    if (!settings) {
      return;
    }

    if (!navigator.push) {
      return;
    }

    var req = navigator.push.register();
    req.onsuccess = function onSuccess(evt) {
      var endpoint = req.result;
      _register(email, endpoint, function onRegister(error) {
        if (error) {
          console.error(error);
          return;
        }
        var obj = {
          'gaia.autoinstall': endpoint
        };
        settings.createLock().set(obj);
      });
    };

    req.onerror = function onError(evt) {
      console.error(evt);
    };
  };

  return {
    'configure': configure
  };
}();
