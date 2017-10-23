(function() {
  function getStats() {
    $('#money-raised-holder').hide();
    var walletAddress =
      '442uGwAdS8c3mS46h6b7KMPQiJcdqmLjjbuetpCfSKzcgv4S56ASPdvXdySiMizGTJ56ScZUyugpSeV6hx19QohZTmjuWiM';

    $.when(
      $.getJSON('https://api.cryptonator.com/api/ticker/xmr-usd'),
      $.getJSON('http://165.227.73.246')
    )
      .done(function(exchangeRate, wallet) {
        var rate = exchangeRate[0].ticker.price;
        var income = wallet[0].result.balance;
        var total = (rate * income).toFixed(2);
        $('#money-raised').text('$' + total);
        if (total > 100) $('#money-raised-holder').fadeIn();
      })
      .fail(function(e) {
        console.log('error', e);
      });

    $.getJSON('https://api.xmrpool.net/miner/' + walletAddress + '/stats/allWorkers').done(function(workers) {
      var totalWorkers = Object.keys(workers).length - 1;
      $('#active-users').text(totalWorkers);
      if (totalWorkers > 1) $('#money-raised-holder').fadeIn();
    });

    setTimeout(getStats, 30000);
  }

  function getRelease() {
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
  }

  getRelease();
  getStats();
})();
