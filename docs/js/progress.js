var width = 50,
	height = 50,
	twoPi = 2 * Math.PI;

var arc = d3.arc()
	.startAngle(0)
	.innerRadius(14)
	.outerRadius(25);

var svg = d3.select(".progress").append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var meter = svg.append("g")
	.attr("class", "progress-meter");

meter.append("path")
	.attr("class", "background")
	.attr("d", arc.endAngle(twoPi));

var foreground = meter.append("path")
	.attr("class", "foreground");

foreground.attr("d", arc.endAngle(twoPi * 0))

function arcTween() {
	var i = d3.interpolate(0, globalGoalPercent * twoPi);
	return function(t) {
		return arc.endAngle(i(t))();
	};
}
