var googleAuth = 'https://accounts.google.com/o/oauth2/auth?scope=https://www.google.com/m8/feeds/&response_type=token&redirect_uri=http://importer.gaiamobile.org:8080/google/oauth2callback.html&approval_prompt=force&client_id=206115911344.apps.googleusercontent.com'
document.getElementById('importGoogle').addEventListener(
  'click', function(evt) {
    document.location.href = googleAuth;
});