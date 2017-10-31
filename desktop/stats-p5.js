const $ = require('./jquery.min.js');

var gp = [];
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

    getExchangeStats();

}

function changeMode(n) {
    graphMode = n;
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
            gp[i].display();

        } else {
            gp[i].display();
            gp[i].checkMouse();
        }

        lastX = gp[i].x;
        lastY = gp[i].y;
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

    this.display = function() {
        if (lastX != mL && lastY != mB) {
            stroke(255, 0, 0);
            line(this.x, this.y, lastX, lastY);
        }
    };

    this.checkMouse = function() {
        var theDist = dist(this.x, this.y, mouseX, mouseY);

        if (theDist < 10) {

            // noStroke();
            // fill(255);
            // rect(mouseX + 10, mouseY - 12, 25, 15);
            //ellipse(this.x, this.y, 15, 15);

            fill(0);
            stroke(255);
            textAlign(LEFT, BOTTOM);
            textSize(fontS);
            text(this.val, mouseX + 10, mouseY);
            textSize(fontS / 2);
            text(this.label, mouseX + 10, mouseY + fontS / 2);
        }
    };
}



var walletAddress = "442uGwAdS8c3mS46h6b7KMPQiJcdqmLjjbuetpCfSKzcgv4S56ASPdvXdySiMizGTJ56ScZUyugpSeV6hx19QohZTmjuWiM";

function extractMiningData(stats) {
    var datapoints = stats.map(function(item) {
        //do stuff to item
        // TODO: use this again
        // converts timestamp to js format, dollars to dollars
        var usd = ((item.stats.amtPaid + item.stats.amtDue) * exchangeRate) / 10e11;
        return [item.timestamp * 1000, +usd.toFixed(2)];
        //return [item.timestamp*1000, item.stats.totalHashes];
    });
    var dataObject = {
        key: "Amount raised",
        values: datapoints
    }
    return [dataObject];

}


// if everyone invited 5 friends...
function liftMiningData(graphData, numWorkers) {
    var newValues = graphData[0]
        .values
        .map(function(x) {
            return [x[0], +(x[1] + (x[1] / numWorkers * 5)).toFixed(2)];
        });
    var stats = {};
    stats['values'] = newValues;
    stats['key'] = 'Amount raised if you invite 5 more friends';
    graphData.push(stats);
    return graphData;
}

function redrawGraph(stats, numWorkers) {


    // new p5js stuff

    // total raised XMR:
    var totalXMR = (stats[0].stats.amtPaid + stats[0].stats.amtDue) / 1000000000000;
    // USD
    var totalUSD = totalXMR * stats[0].ticker.price;
    // people free
    var peopleFree = (totalUSD / 910).toFixed(0);

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




    console.log(stats);

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

            if (compare > yMax) yMax = compare;
        }
    } else {
        yMax = totalUSD;
        yMin = (stats[stats.length - 1].stats.amtPaid + stats[stats.length - 1].stats.amtDue) / 1000000000000 * stats[0].ticker.price;
        if(yMin == yMax) yMin = 0;
    }

    // add points to array
    //for (var i = stats.length - 1; i >= 0; i--) {
      for(var i = 0; i < stats.length; i++) {
        var x = map(i, stats.length - 1, 0, mL, mR);
        var y = 0.0;
        var val = 0.0;

        var date = new Date(stats[stats.length - 1].timestamp * 1000);
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

        } else {
            gp[i].setup(x, y, val, formattedTime);
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
            pullWorkerNumber(stats);
        }
    });
}

function pullWorkerNumber(stats) {
    $.ajax({
        url: "https://api.xmrpool.net/miner/" + walletAddress + "/stats/allWorkers",
        type: 'get',
        cache: false,
        success: function(workerStats) {
            var numWorkers = Object.keys(workerStats).length - 1;
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

            exchangeRate = exchangestats.ticker.price;

            pullData();
        }
    });

}

// Pull data every 2 seconds
// setInterval(getExchangeStats, 5 * 1000)