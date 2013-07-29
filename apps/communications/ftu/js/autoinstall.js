var AutoInstall = function AutoInstall() {

  var settings = window.navigator.mozSettings;

  var configure = function configure(email) {
    if (!settings) {
      return;
    }

    var obj = {
      'gaia.autoinstall.register': email
    };
    console.log('Registering settings ::: ' + JSON.stringify(obj));
    settings.createLock().set(obj);
  };

  return {
    'configure': configure
  };
}();
