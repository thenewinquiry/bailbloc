/* to do:

optimize; graph doesnt need to keep drawing if things arent changing

*/

const $ = require('./jquery.min.js');
var walletAddress = "442uGwAdS8c3mS46h6b7KMPQiJcdqmLjjbuetpCfSKzcgv4S56ASPdvXdySiMizGTJ56ScZUyugpSeV6hx19QohZTmjuWiM";

var gp = [];
var statsReady = false;

var mL, mR, mT, height; // margins

var lastX, lastY;

var yMin = 0.0;
var yMax = 0.0;

var myFont;
var fontS = 18.7;

var firstLoad = true;
var mouseReady = false;	// dont show mouse stats til ready

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



function preload() {
    myFont = loadFont('assets/Lato-Regular.ttf');
}

function setup() {

    // put setup code here
    createCanvas(588, 305);
    // createCanvas(windowWidth, windowHeight);
    background(255);
    strokeWeight(3);

    textFont(myFont);
    textSize(fontS);

    // mL = width * .1;
    // mR = width * .95;
    // mT = height * .05;
    // height = height - mT * 2;
    // mT += 12;
    mL = 0;
    mR = width;
    mT = 0;
    height = height;


    pullData();

}

function changeMode(n) {
    graphMode = n;
    pullData();
}

function draw() {
    background(255);

    if (statsReady) {
        // lastX = gp[0].x;
        // lastY = gp[0].y;

        // 5 friends
        if (friendsMode) {
            noStroke();
            fill(255, 200, 200);
            beginShape();
            var mappedY = height - (height - gp[0].y) * friendsMultiplier;

            //var mappedY = map(gp[0].val * friendsMultiplier, yMin, yMax, height, 0);

            vertex(mR, height);

            if (graphMode == TOTALRAISED) {
                vertex(mR, height);
                vertex(gp[0].x, mappedY);
            } else {
                curveVertex(mR, height);
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
                vertex(mL, height);
            else
                curveVertex(mL, height);

            vertex(mL, height);

            endShape();

        }

        // display points
        //stroke(255, 0, 0);
        fill(255, 0, 0);

        beginShape();

        vertex(mR, height);

        if (graphMode == TOTALRAISED) {
            vertex(mR, height);
            vertex(gp[0].x, gp[0].y);
        } else {

            curveVertex(mR, height);
            curveVertex(gp[0].x, gp[0].y);
        }

        for (var i = 1; i < gp.length; i++) {
            if (graphMode == TOTALRAISED)
                vertex(gp[i].x, gp[i].y);
            else
                curveVertex(gp[i].x, gp[i].y);
        }
        if (graphMode == TOTALRAISED)
            vertex(mL, height);
        else
            curveVertex(mL, height);
        vertex(mL, height);

        endShape();



        for (var i = 0; i < gp.length; i++) {
            if (!gp[i].inPosition) {
                gp[i].getIntoPosition();
                // gp[i].display(color(255, 0, 0));

            } else {
                //gp[i].getIntoPosition();
                // gp[i].display(color(255, 0, 0));
                // gp[i].checkMouse();
            }

            // lastX = gp[i].x;
            // lastY = gp[i].y;
        }
    }



}

// as the mouse moves around the screen, show relevant stats
function mouseMoved() {


    if (statsReady && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
      	
    	// mouse over info should be hidden to begin with
      	if(!mouseReady) {
			$("#scrub-actual").show();
			$("#scrub-friends").show();
			mouseReady = true;
		}

        // check mouse
        var pointInQuestion = int(map(mouseX, width, 0, 0, numPoints));
        pointInQuestion = constrain(pointInQuestion, 0, numPoints - 1);

        //console.log(pointInQuestion);

        // adjust value context if necessary
        var valToPrint = gp[pointInQuestion].val;
        if (graphMode == TOTALRAISED) valToPrint = "$" + gp[pointInQuestion].val;

        var y = gp[pointInQuestion].y + $("#defaultCanvas0").offset().top - 18;
        var x = mouseX + 120;

        $("#stats-line").css("left", x + "px");

        $("#stats-date").text(gp[pointInQuestion].label);
        $("#scrub-actual").offset({ top: y, left: x });
        $("#scrub-actual").text(valToPrint);

        y = height - (height - gp[pointInQuestion].y) * friendsMultiplier;
        //y = map(gp[pointInQuestion].val * friendsMultiplier, yMin, yMax, height, 0);
        y += $("#defaultCanvas0").offset().top - 18;
        y = constrain(y, 40, height);
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

    // new p5js stuff

    // total raised XMR:
    var totalXMR = (stats[0].stats.amtPaid + stats[0].stats.amtDue) / 1000000000000;

    // USD
    var totalUSD = totalXMR * stats[0].ticker.price;

    // people free
    var peopleFree = (totalUSD / 910).toFixed(0);

    $("#numWorkers").text(numWorkers);
    $("#totalUSD").text("$" + totalUSD.toFixed(0));
    $("#peopleFree").text(peopleFree);

    // useful intel:

    // nuheighter of miners:
    // Object.keys(stats[i].miners).length - 1

    // amount due:
    // stats[i].stats.amtDue / 1000000000000).toFixed(4)

    // amount paid:
    // stats[i].stats.amtPaid / 1000000000000).toFixed(4)

    // hash rate:
    // stats[i].stats.hash

    // stats returns 167 member JSON array, 0 is the newest


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
                    compare = Object.keys(stats[i].miners).length - 1;
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
                y = map(val, yMin, yMax, height, 0);
                break;
            case PEOPLEMINING:
                val = Object.keys(stats[i].miners).length - 1;
                y = map(val, yMin, yMax, height, 0);
                break;
            case TOTALRAISED:
                // total raised is what we've been paid out already plus what we are owed
                val = (stats[i].stats.amtDue + stats[i].stats.amtPaid) / 1000000000000;
                val = val * stats[0].ticker.price; // get USD
                y = map(val, yMin, yMax, height, 0);
                //console.log(y,val,yMin,yMax,height,0);

                // var range = yMax - yMin;
                // var p = val / range;
                // y = map(p, 0,1,height,0);
                // y = height - (val / (yMax-yMin) * height);
                val = val.toFixed(0);

                break;
        }


        // if this is the first load, add new objects, otherwise just update
        if (firstLoad) {
            gp.push(new GP(x, y, val, formattedTime));

            numPoints = gp.length;

        } else {

            gp[i].setup(x, y, val, formattedTime);
        }
    }
    firstLoad = false;
    statsReady = true;
}

function pullData() {
    $.ajax({
        url: "https://bb.darkinquiry.com?n=200&step=48",
        type: 'get',
        cache: false,
        success: function(stats) {
            // console.log(stats);

            var numWorkers = Object.keys(stats[0].miners).length - 1;

            exchangeRate = stats[0].ticker.price;

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

// Pull data every 5 seconds
// setInterval(pullData, 5 * 1000)