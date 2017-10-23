var parseLineGraphDate = d3.timeParse("%d-%b-%y");

  // Set the dimensions of the canvas / graph
  var margin = {top: 30, right: 20, bottom: 30, left: 50},
      width = 600 - margin.left - margin.right,
      height = 270 - margin.top - margin.bottom;

  // Parse the date / time
  // Set the ranges
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  // Define the axes
  var xAxis = d3.axisBottom().scale(x)
      .ticks(5);

  var yAxis = d3.axisLeft().scale(y)
      .ticks(5);

  // Define the line
  var valueline = d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); });

  // Adds the svg canvas
  var svg = d3.select("#line-graph")
      .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
      .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

  // Get the data
  d3.tsv("data/mock-data.tsv", function(error, data) {
      data.forEach(function(d) {
          d.date = parseLineGraphDate(d.date);
          d.close = +d.close;
      });

      // Scale the range of the data
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.close; })]);

      // Add the valueline path.
      svg.append("path")
          .attr("class", "line")
          .attr("d", valueline(data));

      // Add the X Axis
      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      // Add the Y Axis
      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);

  });

  var inter = setInterval(function() {
                  updateData();
          }, 5000);
// ** Update data section (Called from the onclick)
function updateData() {

    // Get the data again
    d3.tsv("data/mock-data.tsv", function(error, data) {
      console.log(data);
        data.forEach(function(d) {
        d.date = parseLineGraphDate(d.date);
        d.close = +d.close;
      });

      // Scale the range of the data again
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.close; })]);

    // Select the section we want to apply our changes to
    var svg = d3.select("body").transition();

    // Make the changes
        svg.select(".line")   // change the line
            .duration(750)
            .attr("d", valueline(data));
        svg.select(".x.axis") // change the x axis
            .duration(750)
            .call(xAxis);
        svg.select(".y.axis") // change the y axis
            .duration(750)
            .call(yAxis);

    });
}
