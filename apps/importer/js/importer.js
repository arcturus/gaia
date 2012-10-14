var googleAuth = 'https://accounts.google.com/o/oauth2/auth?scope=https://www.google.com/m8/feeds/&response_type=token&redirect_uri=http://contacts-importer.cloudfoundry.com/&approval_prompt=force&client_id=206115911344.apps.googleusercontent.com';
var authWindow;

var menu = document.getElementById('importer-menu');
var gContacts = document.getElementById('google-contacts');

document.getElementById('importGoogle').addEventListener(
  'click', function(evt) {
    var port = '';
    if (window.location.port != '') {
      port = ':' + window.location.port;
    }
    console.log('FJJ Asking google: ' + googleAuth);
    authWindow = window.open(googleAuth);
    window.addEventListener('message', function onMessage(evt) {
      console.log('-----> Got ' + evt.data.access_token);
      authWindow.close();

      menu.classList.add('hide');
      gContacts.classList.remove('hide');
      
      google.auth.init(evt.data.access_token);
      google.contacts.fetchContacts();
    });
});