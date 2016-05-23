/*
 * barChart.js
 * Contains all the functions related to the over time line chart.
 *
 * Authour: Wybe Westra
 * Date: 16-05-2016
 */

function buildYearChart(nestData, continentData, continentColors) {

    // Setup margins and graph size.
    var margin = { top: 50, right: 50, bottom: 50, left: 50 },
        totalWidth = 800,
        totalHeight = 400,
        width = totalWidth - margin.left - margin.right,
        height = totalHeight - margin.top - margin.bottom;

    // Setup chart area.
    var chart = d3.select("body").append("svg")
        .attr("class", "yearChart")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
      .append("g") // Add the margin offset.
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var numeralYears = nestData.keys().map(function(d) { return +d; });

    // Scales.
    var x = d3.scale.linear()
        .range([0, width])
        x.domain([
            Math.min(...numeralYears),
            Math.max(...numeralYears)
        ]);

    var y = d3.scale.linear()
        .range([0, height])
        .domain([1, 0]);


    // Axis.
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(10, "g");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "%");


    // X axis.
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0 ," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("y", "2rem")
        .text("Year");

    // Y axis.
    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("y", "-0.6rem")
        .attr("x", "-2rem")
        .text("% of people with access to improved water sources, per continent, over time.");


    // ---- Data wrangling -----------------------------------------------------


    // Will list for every continent the average acces per year.
    var trendPerContinent = {}


    // Loop over all the years.
    for (var i in nestData.entries()) {
        var yearData = nestData.entries()[i];
        var year = yearData.key;
        var list = yearData.value.entries();

        // Accumulates the values per continent before the averaging.
        var continentalAccumulator = {};
        for (continent in continentColors) {
            if (continentColors.hasOwnProperty(continent)) {
                continentalAccumulator[continent] = { sum:0, count:0 };
            }
        }

        // Filter only those countries with all three values: gdp, rural and urban.
        list = list.filter( function(d) { return d.value.has("GDP") &&
            d.value.has("Rural") &&
            d.value.has("Urban"); } );

        // Go over every country in that year.
        list.forEach(function(d) {

            // Get the continent that country is in.
            continent = continentData[d.key];

            if (!continent) {
                console.log(d.key);
            } else {
                continentalAccumulator[continent].sum += d.value.get("Total");

                continentalAccumulator[continent].count += 1;
            }
        });

        // Calculate the averages.
        for (continent in continentColors) {
            if (continentColors.hasOwnProperty(continent)) {
                if (!trendPerContinent[continent]) {
                    trendPerContinent[continent] = [];
                }

                trendPerContinent[continent].push({
                    'year': year,
                    'value': continentalAccumulator[continent].sum / continentalAccumulator[continent].count
                });
            }
        }
    }


    // ---- Data ready -----------------------------------------------------

    // Year line.
    var yearLine = chart.append("svg:line")
        .classed("yearline", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", height);


    // Define the line position functions.
    var lineGen = d3.svg.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.value / 100); });


    // -------------------------------------------------------------------------
    // ---- Update function  ---------------------------------------------------
    // -------------------------------------------------------------------------


    return function(year, continentFilter) {
        // Transition values.
        var duration = 1000;

        chart.selectAll(".continentLine")
            .remove();

        for (key in trendPerContinent) {
            if (continentFilter[key]) {
                chart.append("svg:path")
                    .attr("d", lineGen(trendPerContinent[key]))
                    .classed("continentLine", true)
                    .style("stroke", continentColors[key])
                    .style("fill", "none")
                    .style("stroke-width", 1.5)
                    .style("alpha", 1);
            }
        }

        yearLine.transition()
            .duration(duration)
            .attr("x1", function() { return x(year); })
            .attr("x2", function() { return x(year); });
    }
}
