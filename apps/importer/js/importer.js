var googleAuth = 'https://accounts.google.com/o/oauth2/auth?scope=https://www.google.com/m8/feeds/&response_type=token&redirect_uri=http://importer.gaiamobile.org%PORT%/google/oauth2callback.html&approval_prompt=force&client_id=206115911344.apps.googleusercontent.com';

document.getElementById('importGoogle').addEventListener(
  'click', function(evt) {
    var port = '';
    if (window.location.port != '') {
      port = ':' + window.location.port;
    }
    console.log('FJJ Asking google: ' + googleAuth.replace('%PORT%', port));
    document.location.href = googleAuth.replace('%PORT%', port);
});