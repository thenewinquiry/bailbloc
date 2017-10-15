(function() {
  var defaultURL = 'https://github.com/thenewinquiry/bailbloc/releases/latest';
  var apiURL = 'https://api.github.com/repos/thenewinquiry/bailbloc/releases/latest';
  var userAgent = navigator.userAgent;

  if (/Mac/.test(userAgent)) {
    $('#download-button').text('Download Bail Bloc For Mac');
  } else if (/Windows/.test(userAgent)) {
    $('#download-button').text('Download Bail Bloc For Windows');
  }

  $.getJSON(apiURL, function(release) {
    var url = defaultURL;
    var assets = release.assets.map(function(a) {
      return a.browser_download_url;
    });

    if (/Mac/.test(userAgent)) {
      url = assets.find(function(a) {
        return a.indexOf('.dmg') > -1;
      });
    } else if (/Windows/.test(userAgent)) {
      url = assets.find(function(a) {
        return a.indexOf('.exe') > -1;
      });
    }

    $('#download-button, #install-the-app').attr('href', url);
  });
})();
