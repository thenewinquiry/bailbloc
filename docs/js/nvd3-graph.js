var chartData, chart;

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
        chart.dispatch.on('renderEnd', function() {
            console.log('render complete: line graph with guide line');
        });
        chart.xAxis.tickFormat(function(d) {
            return d3.time.format('%m/%d/%y %H:%M')(new Date(d))
        });
        //chart.yAxis.tickFormat(d3.format(',.1%'));



        d3.select('#chart1 svg')
            .datum(initialData())
            .call(chart);


        //TODO: Figure out a good way to do this automatically
        nv.utils.windowResize(chart.update);
        chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });
        chart.state.dispatch.on('change', function(state){
            nv.log('state', JSON.stringify(state));
        });
        return chart;
    });


    function initialData() {
        return [{
                key: "Mining Gross",
                values: [ [ 1083297600000 , -3.7454058855943] , [ 1085976000000 , -3.6096667436314]]
        }]
    }

/*
** 
* args:
* stats - bb.darkinquiry API request repsonse
* returns:
* a list of graph objects e.g.
* {
                key: "Mining Gross",
                values: [ [ 1083297600000 , -3.7454058855943] , [ 1085976000000 , -3.6096667436314]]
   }
*/
function extractMiningData(stats){
    var datapoints = stats.map(function(item) { 
        //do stuff to item
        // TODO: use this again
        //return [item.timestamp, item.stats.amtPaid]
        return [item.timestamp*1000, item.stats.totalHashes];
    });
    var dataObject = {
        key: "Mining Gross",
        values: datapoints 
    }
    return [dataObject];

}

function redrawGraph(stats){
    var graphData = extractMiningData(stats);
    console.log(graphData);
    d3.select('#chart1 svg')
        .datum(graphData)
        .call(chart);
}

function pullData(){
    $.ajax({
        url: "https://bb.darkinquiry.com/",
        type: 'get',
        cache: false,
        success: function(stats) {
           redrawGraph(stats);

        }
    });
}


setInterval(pullData, 2 * 1000)