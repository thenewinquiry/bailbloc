// download button
function getRelease() {
    var defaultURL = 'https://github.com/thenewinquiry/bailbloc/releases/latest';
    var apiURL = 'https://api.github.com/repos/thenewinquiry/bailbloc/releases/latest';
    var userAgent = navigator.userAgent;

    if (/Mac/.test(userAgent)) {
        $('#download-button').text('Click To Download For Mac');
    } else if (/Windows/.test(userAgent)) {
        $('#download-button').text('Click To Download For Windows');
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

        $('#download-button').attr('href', url);
    });
}

getRelease();

// take to download page after clicking link
$('#download-button').click(function() {
    setTimeout(gotoDownloadPage, 2000);

});

function gotoDownloadPage() {
    window.location.href = "download.html";
}

// simulation
var worker;
$('#sim-start').on('click', function() {
    if (worker) {
        worker.terminate();
    }
    $('.sim-status').show();
    $('.sim-results').hide();
    worker = new Worker('js/sim.js');
    worker.onmessage = function(m) {
        var results = m.data;
        $('#sim-raised').text(results.raised.toLocaleString());
        $('#sim-released').text(results.released.toLocaleString());
        $('.sim-results').show();
        $('.sim-status').hide();
    };
    worker.postMessage({
        nMonths: $('input[name=months]').val(),
        nMiners: $('input[name=users]').val()
    });
});
$('input').on('keydown', function(ev) {
    if (ev.keyCode == 13) {
        $('#sim-start').click();
    }
});


// social

function facebook() {

    var raised = $('#sim-raised').text();
    var released = $('#sim-released').text();

    var users = $("input[name=users]").val();
    var months = $("input[name=months]").val();

    var sentence = "If " + users + " ran Bail Bloc for " + months + "months we could raise $" + raised + "and get " + released + " people released from immigration detention.";

    popUp("https://www.facebook.com/dialog/feed?app_id=140586622674265&link=http://bailbloc.thenewinquiry.com&name=" + sentence + "&redirect_uri=http%3A%2F%2Fs7.addthis.com%2Fstatic%2Fpostshare%2Fc00.html", 900, 600);
}

function twitter() {

    var raised = $('#sim-raised').text();
    var released = $('#sim-released').text();

    var users = $("input[name=users]").val();
    var months = $("input[name=months]").val();

    var sentence = "If " + users + " ran Bail Bloc for " + months + " months we could raise $" + raised + " and get " + released + " people released from immigration detention. Join the Bloc %23BAILBLOC";

    popUp("https://twitter.com/intent/tweet?text=" + sentence + "&url=http://bailbloc.thenewinquiry.com", 704, 260);
}

// create pop up windows
function popUp(url, _width, _height) {
    newwindow = window.open(url, 'Join the Bloc!', 'height=' + _height + ',width=' + _width);
    if (window.focus) { newwindow.focus() }
    return false;
}
