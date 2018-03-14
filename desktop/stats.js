/* to do:

+ optimize; graph doesnt need to keep drawing if things arent changing
+ include stats since joining, to make the individual pumped
+ "initialXMR" is the only relevant var ATM for above
+ check to see if the "amount of money since joining" stuff is null, like if they installed while
  offline. if so, update those vals
  update() {
                ipcRenderer.send('changeSettings', {
                    whateverVal : 12
                });
            }

*/

const { ipcRenderer, remote } = require('electron');
let currentWindow = remote.getCurrentWindow();

const $ = require('./jquery.min.js');

var gp = [];
var statsReady = false;

var mL, mR, mT, height; // margins

var lastX, lastY;

var yMin = 0.0;
var yMax = 0.0;

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

    // do something with these individualized stats
    // console.log(currentWindow.initialXMR);
    // console.log(currentWindow.installedTimestamp);

    // put setup code here
    createCanvas(588, 305);
    // createCanvas(windowWidth, windowHeight);
    background(255);
    strokeWeight(3);

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
        if (friendsMode) {
            noStroke();
            fill(255, 200, 200);
            beginShape();
            var mappedY = height - (height - gp[0].y) * friendsMultiplier;

            //var mappedY = map(gp[0].val * friendsMultiplier, yMin, yMax, height, 0);

            vertex(mL, height);

            if (graphMode == TOTALRAISED) {
                vertex(mL, height);
                vertex(gp[0].x, mappedY);
            } else {
                curveVertex(mL, height);
                curveVertex(gp[0].x, mappedY);
            }

            for (var i = 1; i < gp.length; i++) {
                mappedY = height - ((height - gp[i].y) * friendsMultiplier);
                //mappedY = map(gp[i].val * friendsMultiplier, yMin, yMax, height, 0);
                if (graphMode == TOTALRAISED)
                    vertex(gp[i].x, mappedY);
                else
                    curveVertex(gp[i].x, mappedY);
            }

            if (graphMode == TOTALRAISED)
                vertex(mR, height);
            else
                curveVertex(mR, height);

            vertex(mR, height);

            endShape();

        }

        // display points
        //stroke(255, 0, 0);
        fill(255, 0, 0);

        beginShape();

        vertex(mL, height);

        if (graphMode == TOTALRAISED) {
            vertex(mL, height);
            vertex(gp[0].x, gp[0].y);
        } else {

            curveVertex(mL, height);
            curveVertex(gp[0].x, gp[0].y);
        }

        for (var i = 1; i < gp.length; i++) {
            if (graphMode == TOTALRAISED)
                vertex(gp[i].x, gp[i].y);
            else
                curveVertex(gp[i].x, gp[i].y);
        }
        if (graphMode == TOTALRAISED)
            vertex(mR, height);
        else
            curveVertex(mR, height);
        vertex(mR, height);

        endShape();



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

        // check mouse
        var pointInQuestion = int(map(mouseX, 0, width, 0, numPoints));
        pointInQuestion = constrain(pointInQuestion, 0, numPoints - 1);

        //console.log(pointInQuestion);

        // adjust value context if necessary
        var valToPrint = gp[pointInQuestion].val;
        if (graphMode == TOTALRAISED) valToPrint = "$" + gp[pointInQuestion].val;

        var y = gp[pointInQuestion].y + $("#defaultCanvas0").offset().top - 18;
        var x = mouseX + 120;

        $("#scrub-line").css("left", x + "px");

        $("#stats-date").text(gp[pointInQuestion].label);
        $("#scrub-actual").offset({ top: y, left: x });
        $("#scrub-actual").text(valToPrint);

        y = height - (height - gp[pointInQuestion].y) * friendsMultiplier;
        //y = map(gp[pointInQuestion].val * friendsMultiplier, yMin, yMax, height, 0);
        y += $("#defaultCanvas0").offset().top - 18;
        y = constrain(y, 150, height);
        $("#scrub-friends").offset({ top: y, left: x });
        valToPrint *= friendsMultiplier;

        // format accordingly
        if (graphMode == HASHRATE) valToPrint = valToPrint.toFixed(3);
        // if (graphMode == PEOPLEMINING) valToPrint = valToPrint.toFixed(0);
        if (graphMode == TOTALRAISED) valToPrint = "$" + gp[pointInQuestion].val * friendsMultiplier;

        $("#scrub-friends").text(valToPrint);
    }
}


// graph point class
function GP(x, y, val, label) {

    this.x = x;

    this.y = height;
    this.endY = y;

    this.inPosition = false;

    // arbitrary data value
    this.val = val;
    this.label = label;

    this.setup = function(x, y, val, label) {
        this.x = x;

        this.endY = y;

        this.inPosition = false;

        // arbitrary data value
        this.val = val;
        this.label = label;
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

    yMin = 999999.0;
    yMax = 0.0;

    // find Y max first
    if (graphMode != TOTALRAISED) {
        for (var i = stats.length - 1; i >= 0; i--) {

            var compare = 0.0;

            switch (graphMode) {
                case HASHRATE:
                    compare = stats[i].stats.hash / 1000.0;
                    break;
                case PEOPLEMINING:
                    compare = stats[0].n_miners;
                    break;
            }

            if (compare < yMin) {
                yMin = compare;
                //console.log(yMin);
            }

            if (friendsMode) compare *= friendsMultiplier;

            if (compare > yMax) yMax = compare;

        }
    } else {

        yMax = totalUSD * friendsMultiplier;
        yMin = (stats[stats.length - 1].stats.amtPaid + stats[stats.length - 1].stats.amtDue) / 1000000000000 * stats[0].ticker.price;
        if (yMin == yMax) yMin = 0;
        yMin = 0;
    }

    yMin = 0;

    // add points to array
    for (var i = stats.length - 1; i >= 0; i--) {
        //for (var i = 0; i < stats.length; i++) {
        var x = map(i, 0, stats.length - 1, mR, mL);
        //var x = map(i, stats.length - 1, 0, mL, mR);
        var y = 0.0;
        var val = 0.0;

        var date = new Date(convertTimestamp(stats[i].timestamp));
        var month = date.getMonth();
        var day = date.getDate();
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var formattedTime = monthNames[month] + ' ' + day + ' @ ' + hours + ':' + minutes.substr(-2);

        switch (graphMode) {
            case HASHRATE:
                // want it in kHash
                val = stats[i].stats.hash / 1000.0;
                y = map(val, yMin, yMax, height, 0);
                break;
            case PEOPLEMINING:
                val = stats[i].n_miners;
                y = map(val, yMin, yMax, height, 0);
                break;
            case TOTALRAISED:
                // total raised is what we've been paid out already plus what we are owed
                // this is complicated as we must take into account the checks we have already written
                // which are referred to here as payouts



                val = (stats[i].stats.amtDue + stats[i].stats.amtPaid) / 1000000000000;

                // add donations running total
                val += donatedXMR;


                // subtract that which we have already exchanged
                val -= exchangedXMR;

                val = val * stats[i].ticker.price; // get USD

                // add total amount of money paid out in checks so far
                val += paidUSD;

                totalUSD = val;

                y = map(val, yMin, yMax, height, 0);

                val = val.toFixed(0);


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

                break;
        }


        // if this is the first load, add new objects, otherwise just update
        if (firstLoad) {

            gp.push(new GP(x, y, val, formattedTime));

            numPoints = gp.length;

        } else {

            gp[stats.length - i - 1].setup(x, y, val, formattedTime);
        }
    }


    // people free
    peopleFree = (totalUSD / 910).toFixed(0);

    $("#totalUSD").text("$" + totalUSD.toFixed(0));
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

        url: "https://bb.darkinquiry.com/?step=65&n=120",
        type: 'get',
        cache: false,
        success: function(stats) {
            // console.log(stats);

            // current stats are in 0
            var numWorkers = stats[0].n_miners;
            $("#numWorkers").text(numWorkers);

            exchangeRate = stats[0].ticker.price;

            // total raised XMR:
            totalXMR = (stats[0].stats.amtPaid + stats[0].stats.amtDue) / 1000000000000;

            // USD ... this one will be inaccurate but we can use it as a starting point
            // and change it out later once we've sifted all the data
            totalUSD = totalXMR * stats[0].ticker.price;


            redrawGraph(stats, numWorkers);

            // re-render all the labels and stuff
            $("#xaxis-label-actual div").text(labels[graphMode]);

            var l1, l2 = "";
            switch (graphMode) {
                case HASHRATE:
                    l1 = yMax.toFixed(3);
                    l2 = yMin.toFixed(3);
                    break;
                case PEOPLEMINING:
                    l1 = yMax.toFixed(0);
                    l2 = yMin.toFixed(0);
                    break;
                case TOTALRAISED:
                    l1 = "$" + yMax.toFixed(2);
                    l2 = "$" + yMin.toFixed(2);
                    break;
            }

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