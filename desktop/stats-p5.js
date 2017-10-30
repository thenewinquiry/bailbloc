//const $ = require('./jquery.min.js');

var gp = [];
var mL, mR, mT, mB;	// margins

var lastX, lastY;


function setup() {
  // put setup code here
	createCanvas(windowWidth, windowHeight);
	background(255);
	strokeWeight(3);

	mL = width*.1;
	mR = width*.9;
	mT = mL;
	mB = height-mT;
	

	// add points to array
	for(var i = 0; i < 10; i++) {
		var y = mB - random(0,350);
		var x = map(i,0,9,mL,mR);
		gp.push(new GP(x, y));
	}

}

function draw() {

	background(255);
	
	// draw axes labels etc
	stroke(255,0,0);
	line(mL,mT,mL,mB);
	line(mL,mB,mR,mB);


	lastX = mL;
	lastY = mB;
	// update & display points
	for(var i = 0; i < gp.length; i++) {
		if(!gp[i].inPosition) {
			gp[i].getIntoPosition();
			gp[i].display();

		} else {
			gp[i].display();
		}

		lastX = gp[i].x;
		lastY = gp[i].y;
	}
	
}


// graph point class
function GP(x,y) {
	this.x = x;
	
	this.y = mB;
	this.endY = y;

	this.inPosition = false;
  
	this.getIntoPosition = function() {
		this.y = lerp(this.y, this.endY, .1);
		var theDist = dist(this.y,this.endY);
		//if(theDist < 1) inPosition = true;
	};

	this.display = function() {
		stroke(255,0,0);
		line(this.x,this.y,lastX,lastY);

		noStroke();
		fill(0);
		ellipse(this.x,this.y,5,5);
	};
}



var walletAddress = "442uGwAdS8c3mS46h6b7KMPQiJcdqmLjjbuetpCfSKzcgv4S56ASPdvXdySiMizGTJ56ScZUyugpSeV6hx19QohZTmjuWiM";

function extractMiningData(stats){
    var datapoints = stats.map(function(item) {
        //do stuff to item
        // TODO: use this again
        // converts timestamp to js format, dollars to dollars
        var usd = ((item.stats.amtPaid + item.stats.amtDue) * exchangeRate)/10e11;
        return [item.timestamp * 1000, + usd.toFixed(2)];
        //return [item.timestamp*1000, item.stats.totalHashes];
    });
    var dataObject = {
        key: "Amount raised",
        values: datapoints
    }
    return [dataObject];

}

function liftMiningData(graphData, numWorkers){
  var newValues = graphData[0]
                  .values
                  .map(function(x){
                   return [x[0],+(x[1] + (x[1]/numWorkers * 5)).toFixed(2)];
                  });
  var stats = {};
  stats['values'] = newValues;
  stats['key'] = 'Amount raised if you invite 5 more friends';
  graphData.push(stats);
  return graphData;


}


function redrawGraph(stats, numWorkers){
    var graphData = extractMiningData(stats);
    var hypData = liftMiningData(graphData, numWorkers);
    d3.select('#stats-chart svg')
        .attr("width", '100%')
        .attr("height", '100%')
        .attr('viewBox','0 0 '+width+' '+height)
        .attr('preserveAspectRatio','xMinYMin')
        .datum(hypData)
        .call(chart);
}

function pullData(){
    $.ajax({
        url: "https://bb.darkinquiry.com/",
        type: 'get',
        cache: false,
        success: function(stats) {
           //redrawGraph(stats);
           pullWorkerNumber(stats);

        }
    });
}

function pullWorkerNumber(stats){
    $.ajax({
        url: "https://api.xmrpool.net/miner/" + walletAddress + "/stats/allWorkers",
        type: 'get',
        cache: false,
        success: function(workerStats) {
          var numWorkers = Object.keys(workerStats).length - 1;
          redrawGraph(stats,numWorkers);


        }
    });
}

function getExchangeStats(){
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
//pullWorkerNumber();
getExchangeStats();
// Pull data every 2 seconds
setInterval(getExchangeStats, 2 * 1000)

