/* to do:

optimize; graph doesnt need to keep drawing if things arent changing

*/

const $ = require('./jquery.min.js');
var walletAddress = "442uGwAdS8c3mS46h6b7KMPQiJcdqmLjjbuetpCfSKzcgv4S56ASPdvXdySiMizGTJ56ScZUyugpSeV6hx19QohZTmjuWiM";

var gp = [];
var gp_friends = [];

var mL, mR, mT, mB; // margins

var lastX, lastY;

var yMin = 0.0;
var yMax = 0.0;

var myFont;
var fontS = 18.7;

var firstLoad = true;

var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// graph modes
var graphMode = 0;
var HASHRATE = 0;
var PEOPLEMINING = 1;
var TOTALRAISED = 2;
var labels = ["HASHRATE (kH/s)", "PEOPLE CURRENTLY PARTICIPATING", "MONEY RAISED TO DATE (USD)"];

var friendsMode = false;
var friendsMultiplier = 1;

function preload() {
    myFont = loadFont('assets/Lato-Regular.ttf');
}

function setup() {
    // put setup code here
    createCanvas(windowWidth, windowHeight);
    background(255);
    strokeWeight(3);

    textFont(myFont);
    textSize(fontS);

    mL = width * .1;
    mR = width * .95;
    mT = height * .05;
    mB = height - mT * 2;
    mT += 12;


    getExchangeStats();

}

function changeMode(n) {
    graphMode = n;
    getExchangeStats();
}

function friendsModeEngage(n) {

    friendsMode = !friendsMode;

    if (friendsMode)
        friendsMultiplier = n;
    else
        friendsMultiplier = 1;

    getExchangeStats();
}

function draw() {

    background(255);

    // draw axes
    textSize(fontS);
    stroke(255, 0, 0);
    line(mL, mT, mL, mB);
    line(mL, mB, mR, mB);

    // draw Y labels
    fill(0);
    noStroke();
    textAlign(RIGHT, BOTTOM);
    // l1 is top Y label, l2 is bottom y label
    var l1, l2 = "";
    switch (graphMode) {
        case HASHRATE:
            l1 = yMax.toFixed(2);
            l2 = yMin.toFixed(2);
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
    text(l1, mL - 10, mT + fontS);
    text(l2, mL - 10, mB);

    // draw X labels
    textAlign(CENTER, TOP);
    text(labels[graphMode], width / 2, mB + 12);

    lastX = mL;
    lastY = mB;

    // update & display points
    for (var i = 0; i < gp.length; i++) {
        if (!gp[i].inPosition) {
            gp[i].getIntoPosition();
            gp[i].display(color(255, 0, 0));

        } else {
            gp[i].getIntoPosition();
            gp[i].display(color(255, 0, 0));
            gp[i].checkMouse();
        }

        lastX = gp[i].x;
        lastY = gp[i].y;
    }

    // update & display points
    if (friendsMode) {
        for (var i = 0; i < gp_friends.length; i++) {
            if (!gp_friends[i].inPosition) {
                gp_friends[i].getIntoPosition();
                gp_friends[i].display(color(255, 255, 0));

            } else {
                gp_friends[i].display(color(255, 255, 0));
                gp_friends[i].checkMouse();
            }

            lastX = gp_friends[i].x;
            lastY = gp_friends[i].y;
        }
    }

}


// graph point class
function GP(x, y, val, label) {

    this.x = x;

    this.y = mB;
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

    this.display = function(c) {
        if (lastX != mL && lastY != mB) {
            stroke(c);
            line(this.x, this.y, lastX, lastY);
        }
    };

    this.checkMouse = function() {
        var theDist = dist(this.x, this.y, mouseX, mouseY);

        if (theDist < 10) {


            // adjust value context if necessary
            var valToPrint = this.val;
            if (graphMode == TOTALRAISED) valToPrint = "$" + valToPrint;

            // constrain positioning
            var x = constrain(mouseX, 0, width * .925);
            var y = constrain(mouseY - 10, height * .1, height);

            fill(255, 200);
            noStroke();
            rect(x + 10, y - fontS, 60, 30);
            fill(0);
            stroke(255);
            textAlign(LEFT, BOTTOM);
            textSize(fontS);
            text(valToPrint, x + 10, y);
            textSize(fontS / 2);
            text(this.label, x + 10, y + fontS / 2);
        }
    };
}

function redrawGraph(stats, numWorkers) {

    // new p5js stuff

    // total raised XMR:
    var totalXMR = (stats[0].stats.amtPaid + stats[0].stats.amtDue) / 1000000000000;

    // USD
    var totalUSD = totalXMR * stats[0].ticker.price;

    // people free
    var peopleFree = (totalUSD / 910).toFixed(0);

    if (friendsMode) {
        peopleFree *= friendsMultiplier;
        totalUSD *= friendsMultiplier;
        totalXMR *= friendsMultiplier;
    }

    $("#stats-text").css("top", mT + "px");
    $("#stats-text").css("left", mL + 4 + "px");
    $("#numWorkers").text(numWorkers);
    $("#totalUSD").text("$" + totalUSD.toFixed(0));
    $("#peopleFree").text(peopleFree);

    // useful intel:

    // number of miners:
    // Object.keys(stats[i].miners).length - 1

    // amount due:
    // stats[i].stats.amtDue / 1000000000000).toFixed(4)

    // amount paid:
    // stats[i].stats.amtPaid / 1000000000000).toFixed(4)

    // hash rate:
    // stats[i].stats.hash




    // console.log(stats);

    // stats returns 167 member JSON array, 0 is the newest


    yMin = 0.0;
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
                    compare = Object.keys(stats[i].miners).length - 1;
                    break;
            }

            if (friendsMode) compare *= friendsMultiplier;

            if (compare > yMax) yMax = compare;
        }
    } else {
        yMax = totalUSD;
        yMin = (stats[stats.length - 1].stats.amtPaid + stats[stats.length - 1].stats.amtDue) / 1000000000000 * stats[0].ticker.price;
        if (yMin == yMax) yMin = 0;
    }

    // add points to array
    //for (var i = stats.length - 1; i >= 0; i--) {
    for (var i = 0; i < stats.length; i++) {
        var x = map(i, stats.length - 1, 0, mL, mR);
        var y = 0.0;
        var val = 0.0;

        var date = new Date(stats[i].timestamp * 1000);
        var month = date.getMonth();
        var day = date.getDate();
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var formattedTime = monthNames[month] + ' ' + day + ' @ ' + hours + ':' + minutes.substr(-2);

        switch (graphMode) {
            case HASHRATE:
                // want it in kHash
                val = stats[i].stats.hash / 1000.0;
                y = map(val, yMin, yMax, mB, mT);
                break;
            case PEOPLEMINING:
                val = Object.keys(stats[i].miners).length - 1;
                y = map(val, yMin, yMax, mB, mT);
                break;
            case TOTALRAISED:
                val = (stats[i].stats.amtDue + stats[i].stats.amtPaid) / 1000000000000;
                val = val * stats[0].ticker.price;
                y = map(val, yMin, yMax, mB, mT);
                val = val.toFixed(0);

                break;
        }


        // if this is the first load, add new objects, otherwise just update
        if (firstLoad) {
            gp.push(new GP(x, y, val, formattedTime));
            gp_friends.push(new GP(x, map(val * friendsMultiplier, yMin, yMax, mB, mT), val * friendsMultiplier, formattedTime));

        } else {

            gp[i].setup(x, y, val, formattedTime);
            gp_friends[i].setup(x, map(val * friendsMultiplier, yMin, yMax, mB, mT), val * friendsMultiplier, formattedTime);
        }
    }
    firstLoad = false;
}

function pullData() {
    $.ajax({
        url: "https://bb.darkinquiry.com?n=200&step=48",
        type: 'get',
        cache: false,
        success: function(stats) {
            // console.log(stats);

            var numWorkers = Object.keys(stats[0].miners).length - 1;

            redrawGraph(stats, numWorkers);
        }
    });
}

function getExchangeStats() {
    $.ajax({
        url: "https://api.cryptonator.com/api/ticker/xmr-usd",
        type: 'get',
        cache: false,
        success: function(exchangestats) {

            console.log(exchangestats);

            exchangeRate = exchangestats.ticker.price;

            pullData();
        }
    });

}

// Pull data every 2 seconds
// setInterval(getExchangeStats, 5 * 1000)