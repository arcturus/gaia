var AutoInstall = function AutoInstall() {

  var AUTOINSTALL_ENDPOINT = 'http://autoinstall.eu01.aws.af.cm';

  var settings = window.navigator.mozSettings;

  var _register = function register(email, endpoint, callback) {
    // Post the info to the server
    var data = new FormData();
    data.append('email', email);
    data.append('client', endpoint);

    var url = AUTOINSTALL_ENDPOINT + '/api/v1/register';
    var xhr = new XMLHttpRequest({mozSystem: true});

    console.log('Registering against url ' + url);

    xhr.onload = function onLoad(evt) {
      if (xhr.status === 200 || xhr.status === 0) {
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

  var configure = function configure(email) {
    if (!settings) {
      return;
    }

    if (!navigator.push) {
      console.log('We dont have push api');
      return;
    }

    var req = navigator.push.register();
    req.onsuccess = function onSuccess(evt) {
      var endpoint = req.result;
      console.log('Register and got endpoint ' + endpoint);
      _register(email, endpoint, function onRegister(error) {
        console.log('Got a response from regisitration ' + error);
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
