/*
 * barChart.js
 * Contains all the functions related to the availability differerence chart.
 *
 * Authour: Wybe Westra
 * Date: 15-05-2016
 */

function buildDifferenceChart(nestData, continentData, continentColors) {
    // Setup margins and graph size.
    var margin = { top: 50, right: 50, bottom: 120, left: 50 },
        totalWidth = 1800,
        totalHeight = 300,
        width = totalWidth - margin.left - margin.right,
        height = totalHeight - margin.top - margin.bottom;

    // Scales.
    var x = d3.scale.ordinal()
        .rangeBands([0, width], 0.1, 0.2);

    var y = d3.scale.linear()
        .range([height, 0]);


    // Set the Y domain.
    y.domain( [0, 1] );


    // Axis.
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "%");


    // Setup chart area.
    var chart = d3.select("body").append("svg")
        .attr("class", "differenceChart")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
      .append("g") // Add the margin offset.
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // X axis.
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0 ," + height + ")");


    // Y axis.
    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("y", "-0.6rem")
        .attr("x", "-2rem")
        .text("Difference in access between rural and urban areas.");


    // Calculates the inequality between uban and rural.
    function getDifference(d) {
        return Math.abs(d.value.get("Urban") - d.value.get("Rural"));
    }


    // Datapoint locations.
    var xMap = function(d) { return x(d.key); };
        yMap = function(d) {
            return y(getDifference(d) / 100);
        };
        heightMap = function(d) {
            return height - y(getDifference(d) / 100);
        };


    // ---- Continent functions ------------------------------------------------

    // Returns the continent of a country.
    function getContinent(d) {
        return continentData[d.key];
    }


    // Datapoint color function.
    // Selects colors based on continent.
    var continentColor = function(d) {
        var continent = getContinent(d);

        if (!continent) {
            console.log(d.key);
        }

        var color = continentColors[continent];

        return color;
    };


    // -------------------------------------------------------------------------
    // ---- Update function  ---------------------------------------------------
    // -------------------------------------------------------------------------


    return function(data, textFilter) {
        // Transition values.
        var duration = 1000;

        // Sort the data from high to low.
        data.sort( function(a, b) {
            // First try to sort the data on difference.
            var dif = getDifference(b) - getDifference(a);

            // If the differences are equal.
            if (dif == 0) {
                // Sort the data on the totals.
                div = b.value.get("Total") - a.value.get("Total");
            }

            return dif;
        });


        // Set the X domain.
        x.domain( data.map(function(d) { return d.key }) );

        // X axis.
        chart.select(".x.axis").transition()
            .duration(duration)
            .call(xAxis);

        chart.select(".x.axis").selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.5rem")
            .attr("dy", "-0.1rem")
            .attr("transform", "rotate(-45)");

        // ---- Datapoints -----------------------------------------------------

        // Create the datapoints.
        var keyFn = function(d) { return d.key; };
        var bar = chart.selectAll("rect.bar")
            .data(data, keyFn);

        // -- Enter --

        var newBar = bar.enter().append("rect")
            .classed("bar", true)
            .attr("x", xMap)
            .attr("y", height)
            .attr("height", 0)
            .attr("width", x.rangeBand())
            .style("fill", continentColor);

        // -- Update --

        bar.transition()
            .duration(duration)
            .style("opacity", "1")
            .attr("x", xMap)
            .attr("y", yMap)
            .attr("height", heightMap)
            .attr("width", x.rangeBand());

        // -- Exit --

        bar.exit().transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();


        // ---- Hover functions ------------------------------------------------

        function barOver(d, i) {
        }

        function barOut(d, i) {
        }

        // -- Hover functions --
        bar.on('mouseover', barOver)
            .on('mouseout', barOut);
    }
}
