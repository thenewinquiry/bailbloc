const { ipcRenderer, remote } = require('electron');
let currentWindow = remote.getCurrentWindow();

const $ = require('./jquery.min.js');

var gp = [];
var statsReady = false;

var mL, mR, mT, height; // margins

var lastX, lastY;

var yMin = 0.0;
var yMax = 0.0;

var minExRate = 0.0;
var maxExRate = 500.0;
var minUSD = 0.0;
var maxUSD = 1000.0;

var myFont;
var fontS = 18.7;

var firstLoad = true;
var mouseReady = false; // dont show mouse stats til ready

var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// graph modes
var graphMode = 0;
var TOTALRAISED = 0;
var PEOPLEMINING = 1;
var HASHRATE = 2;
var labels = ["Money Raised to Date (USD)", "Number of People Participating", "Current Hashrate (kH/s)"];

var friendsMode = true;
var friendsMultiplier = 3;

var numPoints = 0;

var totalMinedXMR;
var totalXMR, totalUSD, peopleFree;

var payouts; // json object to store payout data
var payoutIndex = 0;
var paidUSD = 0.0;
var exchangedXMR = 0;

var donations; // like above but to store donations (in xmr)
var donationIndex = 0;
var donatedXMR = 0;


function preload() {
    myFont = loadFont('assets/Lato-Regular.ttf');
}

function setup() {

    // do something with these individualized stats maybe
    // console.log(currentWindow.initialXMR);
    // console.log(currentWindow.installedTimestamp);

    // put setup code here
    createCanvas(588, 305);
    // createCanvas(windowWidth, windowHeight);
    background(255);
    strokeWeight(2);

    textFont(myFont);
    textSize(fontS);

    mL = 0;
    mR = width;
    mT = 0;
    mB = height;

    pullPayoutData();

}

function changeMode(n) {
    graphMode = n;
    pullPayoutData();
}

function draw() {
    background(255);

    if (statsReady) {

        // 5 friends
        // if (friendsMode) {
        //     noStroke();
        //     fill(255, 200, 200);
        //     beginShape();
        //     var mappedY = height - (height - gp[0].y) * friendsMultiplier;

        //     //var mappedY = map(gp[0].val * friendsMultiplier, yMin, yMax, height, 0);

        //     vertex(mL, height);

        //     if (graphMode == TOTALRAISED) {
        //         vertex(mL, height);
        //         vertex(gp[0].x, mappedY);
        //     } else {
        //         curveVertex(mL, height);
        //         curveVertex(gp[0].x, mappedY);
        //     }

        //     for (var i = 1; i < gp.length; i++) {
        //         mappedY = height - ((height - gp[i].y) * friendsMultiplier);
        //         //mappedY = map(gp[i].val * friendsMultiplier, yMin, yMax, height, 0);
        //         if (graphMode == TOTALRAISED)
        //             vertex(gp[i].x, mappedY);
        //         else
        //             curveVertex(gp[i].x, mappedY);
        //     }

        //     if (graphMode == TOTALRAISED)
        //         vertex(mR, height);
        //     else
        //         curveVertex(mR, height);

        //     vertex(mR, height);

        //     endShape();

        // }

        // // display points
        // //stroke(255, 0, 0);
        // fill(255, 0, 0);

        // beginShape();

        // vertex(mL, height);

        // if (graphMode == TOTALRAISED) {
        //     vertex(mL, height);
        //     vertex(gp[0].x, gp[0].y);
        // } else {

        //     curveVertex(mL, height);
        //     curveVertex(gp[0].x, gp[0].y);
        // }

        // for (var i = 1; i < gp.length; i++) {
        //     if (graphMode == TOTALRAISED)
        //         vertex(gp[i].x, gp[i].y);
        //     else
        //         curveVertex(gp[i].x, gp[i].y);
        // }
        // if (graphMode == TOTALRAISED)
        //     vertex(mR, height);
        // else
        //     curveVertex(mR, height);
        // vertex(mR, height);

        // endShape();


        // NEW------
        var y = 0.0;
        // // draw XMR graph
        // // stroke(255, 0, 0);
        // // strokeWeight(8);
        // noStroke();
        // fill(255, 0, 0);

        // beginShape();
        // vertex(mL, height);
        // vertex(gp[0].x, gp[0].y);

        // for (var i = 1; i < gp.length; i++) {
        //     vertex(gp[i].x, gp[i].y);
        // }
        // vertex(mR, height);
        // endShape();

        // USD as vertical bars
        strokeWeight(4);
        stroke(100,255,100);
        for (var i = 0; i < gp.length; i++) {
            y = map(gp[i].usd, minUSD, maxUSD, height, 0);
            line(gp[i].x - 1, height, gp[i].x - 1, y);
        }

        // XMR as vertical bars
        stroke(255,80,80);
        for (var i = 0; i < gp.length; i++) {
            line(gp[i].x - 1, height, gp[i].x - 1, gp[i].y);
        }

        // turn nearest bar to mouse yellow
        var nearestBar = int(map(mouseX,0,width,0,gp.length-1));
        nearestBar = constrain(nearestBar,0,gp.length-1);
        stroke(255,255,100);
        // usd
        y = map(gp[nearestBar].usd, minUSD, maxUSD, height, 0);
        line(gp[nearestBar].x - 1, height, gp[nearestBar].x - 1, y);
        // xmr
        line(gp[nearestBar].x - 1, height, gp[nearestBar].x - 1, gp[nearestBar].y);

        // clean lines between
        // stroke(255);
        // strokeWeight(1);
        // for (var i = 0; i < gp.length; i++) {
        //     line(gp[i].x + 2, height, gp[i].x + 2, 0);
        // }

        // // draw exchange rate graph
        // stroke(100, 100, 255, 200);
        // noFill();
        // beginShape();

        // for (var i = 0; i < gp.length; i++) {
        //     y = map(gp[i].eRate, minExRate, maxExRate, height, 0);
        //     vertex(gp[i].x, y);
        // }
        // endShape();



        // // draw USD graph
        // stroke(100, 255, 100, 200);
        // noFill();
        // beginShape();

        // for (var i = 0; i < gp.length; i++) {
        //     y = map(gp[i].usd, minUSD, maxUSD, height, 0);
        //     vertex(gp[i].x, y);
        // }
        // endShape();



        for (var i = 0; i < gp.length; i++) {
            if (!gp[i].inPosition) {
                gp[i].getIntoPosition();
            }
        }


        // draw payouts

    }
}

// as the mouse moves around the screen, show relevant stats
function mouseMoved() {

    if (statsReady && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {

        // mouse over info should be hidden to begin with
        if (!mouseReady) {
            $("#scrub-actual").show();
            $("#scrub-friends").show();
            mouseReady = true;
        }

        // check mouse (4 pixel offset helps)
        var pointInQuestion = int(map(mouseX, 0, width + 4, 0, gp.length));
        // pointInQuestion = constrain(pointInQuestion, 0, gp.length - 1);

        //console.log(pointInQuestion);

        // adjust value context if necessary
        var valToPrint = gp[pointInQuestion].usd + " USD<br>" + gp[pointInQuestion].xmr.toFixed(1) + " XMR" + "<br>" + gp[pointInQuestion].eRate + " exchange rate";

        var y = gp[pointInQuestion].y + $("#defaultCanvas0").offset().top - 18;
        var x = mouseX + 120;

        $("#scrub-line").css("left", x + "px");

        $("#stats-date").text(gp[pointInQuestion].date);
        $("#scrub-actual").offset({ top: y, left: x });
        $("#scrub-actual").html(valToPrint);

        $("#scrub-date").html(gp[pointInQuestion].date);
        $("#scrub-usd").html(gp[pointInQuestion].usd);
        $("#scrub-xmr").html(gp[pointInQuestion].xmr.toFixed(1));
        $("#scrub-exrate").html(gp[pointInQuestion].eRate.toFixed(0));


        y = height - (height - gp[pointInQuestion].y) * friendsMultiplier;
        y += $("#defaultCanvas0").offset().top - 18;
        y = constrain(y, 150, height);
        $("#scrub-friends").offset({ top: y, left: x });
        valToPrint *= friendsMultiplier;

        // format accordingly
        valToPrint = "$" + gp[pointInQuestion].usd * friendsMultiplier;
        $("#scrub-friends").text(valToPrint);
    }
}


// graph point class
function GP() {

    this.setup = function(x, y, xmr, usd, eRate, hashrate, nMiners, date) {
        this.x = x;
        this.y = 0.0;

        this.endY = y;

        this.inPosition = false;

        // arbitrary data value
        this.usd = usd.toFixed(0);
        this.xmr = xmr;
        this.eRate = eRate;
        this.date = date; // the date

        // console.log(usd);
    }

    this.getIntoPosition = function() {
        this.y = lerp(this.y, this.endY, .1);
        var theDist = abs(this.y - this.endY);
        if (theDist < .5) this.inPosition = true;
    };
}

function redrawGraph(stats, numWorkers) {

    // reset the already paid stuff
    payoutIndex = 0;
    paidUSD = 0.0;
    exchangedXMR = 0.0;
    donatedXMR = 0.0;

    // and the icons
    $(".payouticon").remove();
    $(".donationicon").remove();

    // find Y max and min first
    yMax = totalMinedXMR * 2;
    yMin = (stats[stats.length - 1].stats.amtPaid + stats[stats.length - 1].stats.amtDue) / 1000000000000 * .5;

    minExRate = maxExRate = stats[0].ticker.price;
    minUSD = ((stats[stats.length - 1].stats.amtPaid + stats[stats.length - 1].stats.amtDue) / 1000000000000) * stats[stats.length - 1].ticker.price;
    console.log(stats[stats.length - 1].ticker.price);
    // maxUSD = (stats[0].stats.amtPaid + stats[0].stats.amtDue) / 1000000000000 * stats[0].ticker.price;

    // add points to array
    for (var i = stats.length - 1; i >= 0; i--) {

        var x = map(i, 0, stats.length - 1, mR, mL);
        var y = 0.0;
        var xmr = 0.0;
        var usd = 0;
        var hashrate = stats[i].stats.hash / 1000.0;
        var nMiners = stats[i].n_miners;
        var eRate = parseFloat(stats[i].ticker.price);

        if (eRate > maxExRate) maxExRate = eRate;
        if (eRate < minExRate) minExRate = eRate;



        var date = new Date(convertTimestamp(stats[i].timestamp));
        var month = date.getMonth();
        var day = date.getDate();
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var formattedTime = monthNames[month] + ' ' + day + ' @ ' + hours + ':' + minutes.substr(-2);


        // total raised is what we've been paid out already plus what we are owed
        // this is complicated as we must take into account the checks we have already written
        // which are referred to here as payouts

        xmr = (stats[i].stats.amtDue + stats[i].stats.amtPaid) / 1000000000000;

        // add donations running total
        xmr += donatedXMR;

        // subtract that which we have already exchanged
        usd = (xmr - exchangedXMR) * stats[i].ticker.price; // get USD

        // add total amount of money paid out in checks so far
        usd += paidUSD;

        totalUSD = usd; // !

        // use for min/max graph stuff
        if (usd > maxUSD) maxUSD = usd;
        if (usd < minUSD) minUSD = usd;

        // y = map(usd, yMin, yMax, height, 0);
        y = map(xmr, yMin, yMax, height, 0);

        // if the timestamp of the current data point is greater than an unused payout data point
        if (Object.keys(payouts).length > payoutIndex) {
            if (stats[i].timestamp > payouts[payoutIndex].timestamp) {

                // add the check amount to running total
                paidUSD += payouts[payoutIndex].check_amount_usd;
                exchangedXMR += payouts[payoutIndex].amount_xmr;

                // note it in graph
                // but only show the icon if its not too old to be seen
                if (stats[stats.length - 1].timestamp < payouts[payoutIndex].timestamp) {
                    $('body').append(
                        $('<a href="https://bailbloc.thenewinquiry.com/payouts.html"><div/></a>')
                        .attr("id", "payout" + payoutIndex)
                        .addClass("payouticon")
                        .css("left", x + $("#defaultCanvas0").offset().left - 10)
                        .css("top", y + $("#defaultCanvas0").offset().top - 10)
                    );
                }

                payoutIndex++;

                //console.log("payout calculated: " + paidUSD);

            }
        }


        // donations

        if (Object.keys(donations).length > donationIndex) {
            if (stats[i].timestamp > donations[donationIndex].timestamp) {

                // add the check amount to running total
                donatedXMR += donations[donationIndex].amount_xmr;

                // note it in graph
                // but only show the icon if its not too old to be seen
                if (stats[stats.length - 1].timestamp < donations[donationIndex].timestamp) {
                    $('body').append(
                        $('<a href="https://bailbloc.thenewinquiry.com/payouts.html"><div/></a>')
                        .attr("id", "donation" + donationIndex)
                        .addClass("donationicon")
                        .css("left", x + $("#defaultCanvas0").offset().left - 10)
                        .css("top", y + $("#defaultCanvas0").offset().top - 10)
                    );
                }

                donationIndex++;
            }
        }



        // if this is the first load, add new objects, otherwise just update
        if (firstLoad) {

            // x, y, xmr, eRate, hashrate, nMiners, date

            gp.push(new GP());
            gp[gp.length - 1].setup(x, y, xmr, usd, eRate, hashrate, nMiners, formattedTime);

            // console.log(gp.length - 1);

            numPoints = gp.length;

        } else {

            gp[stats.length - i - 1].setup(x, y, xmr, usd, eRate, hashrate, nMiners, formattedTime);
        }

    }

    console.log(gp);


    // people free
    peopleFree = (totalUSD / 910).toFixed(0);

    $("#totalUSD").text("$" + usd.toFixed(0));
    $("#peopleFree").text(peopleFree);

    firstLoad = false;
    statsReady = true;
}



function pullPayoutData() {
    // get all the cashout entries
    $.ajax({

        url: "https://bailbloc.thenewinquiry.com/payouts.json",
        type: 'get',
        cache: false,
        success: function(stats) {

            payouts = stats;

            // establish a flag to use freeze data
            for (var i = 0; i < payouts.length; i++) {
                payouts[i].used = false;
            }

            pullDonationData();
        }
    });
}

function pullDonationData() {
    // get all the donation entries
    $.ajax({

        url: "https://bailbloc.thenewinquiry.com/donations.json",
        type: 'get',
        cache: false,
        success: function(stats) {

            donations = stats;

            // establish a flag to use freeze data
            for (var i = 0; i < donations.length; i++) {
                donations[i].used = false;
            }

            pullStatsData();
        }
    });
}


function pullStatsData() {

    // get all the bb. server data
    $.ajax({
        // was step=65, n=120
        url: "https://bb.darkinquiry.com/?step=130&n=80",
        type: 'get',
        cache: false,
        success: function(stats) {
            // console.log(stats);

            // current stats are in 0
            var numWorkers = stats[0].n_miners;
            $("#numWorkers").text(numWorkers);

            // total raised XMR:
            totalMinedXMR = (stats[0].stats.amtPaid + stats[0].stats.amtDue) / 1000000000000;

            redrawGraph(stats, numWorkers);

            // re-render all the labels and stuff
            // $("#xaxis-label-actual div").text(labels[graphMode]);

            var l1, l2 = "";
            l1 = yMax.toFixed(2) + " XMR";
            l2 = yMin.toFixed(2) + " XMR";

            $("#yaxis-label-top").text(l1);
            $("#yaxis-label-bottom").text(l2);
        }
    });
}


// subtract 4 hrs 9 minutes
function convertTimestamp(timestamp) {
    var d = new Date((timestamp - 14940) * 1000), // Convert the passed timestamp to milliseconds
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
        dd = ('0' + d.getDate()).slice(-2), // Add leading 0.
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2), // Add leading 0.
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh == 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM  
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
}


// Pull data every so often
// setInterval(pullData, 5 * 60 * 1000);