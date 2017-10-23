const $ = require('./jquery.min.js');

var walletAddress = "442uGwAdS8c3mS46h6b7KMPQiJcdqmLjjbuetpCfSKzcgv4S56ASPdvXdySiMizGTJ56ScZUyugpSeV6hx19QohZTmjuWiM";

var chartData, chart, exchangeRate;

    // Wrapping in nv.addGraph allows for '0 timeout render', stores rendered charts in nv.graphs,
    // and may do more in the future... it's NOT required
    nv.addGraph(function() {
        chart = nv.models.lineChart()
            .useInteractiveGuideline(true)
            .x(function(d) { return d[0] })
            .y(function(d) { return d[1] })
            .color(d3.scale.category10().range())
           // .average(function(d) { return d.mean/100; })
            .duration(300)
            //.clipVoronoi(false);
        // chart.dispatch.on('renderEnd', function() {
        //     console.log('render complete: line graph with guide line');
        // });
        chart.xAxis.tickFormat(function(d) {
            return d3.time.format('%m/%d/%y %H:%M')(new Date(d))
        }).rotateLabels(-45);
        chart.yAxis.tickFormat(function(d){return  "$" + d3.format(",")(d)  });

        //chart.forceX([1507918048.569191*1000,1507947748.593314*1000])

        //TODO: Figure out a good way to do this automatically
        nv.utils.windowResize(chart.update);
        chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });
        chart.state.dispatch.on('change', function(state){
            nv.log('state', JSON.stringify(state));
        });
        return chart;
    });


/*
**
* args:
* stats - bb.darkinquiry API request repsonse
* returns:
* a list of graph objects e.g.
* [{
                key: "Mining Gross",
                values: [ [ 1083297600000 , -3.7454058855943] , [ 1085976000000 , -3.6096667436314]]
   }]
*/
function extractMiningData(stats){
    var datapoints = stats.map(function(item) {
        //do stuff to item
        // TODO: use this again
        // converts timestamp to js format, dollars to dollars
        var usd = ((item.stats.amtPaid + item.stats.amtDue) * exchangeRate)/10e11;
        return [item.timestamp * 1000, +usd.toFixed(2)];
        //return [item.timestamp*1000, item.stats.totalHashes];
    });
    var dataObject = {
        key: "Mining Gross",
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
  stats['key'] = 'Mining Gross if you invited 5 friends';
  graphData.push(stats);
  return graphData;


}

var $container = $('#stats-chart'),
      width = $container.width(),
      height = $container.height();

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

