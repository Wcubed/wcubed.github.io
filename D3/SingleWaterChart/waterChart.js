/*
 * waterChart.js
 * Authour: Wybe Westra
 * Date: 08-05-2016
 */


// Setup margins and graph size.
var margin = { top: 50, right: 30, bottom: 50, left: 50 },
    totalWidth = 1800,
    totalHeight = 600,
    width = totalWidth - margin.left - margin.right,
    height = totalHeight - margin.top - margin.bottom;


// Scales.
var x = d3.scale.log()
    .range([0, width]);

var y = d3.scale.linear()
    .range([0, height]);


// Axis.
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(10, "g");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10, "%");


// Setup chart area.
var chart = d3.select(".chart")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
  .append("g") // Add the margin offset.
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Load the data and create the graph.
d3_queue.queue()
    .defer(d3.csv, "waterData.csv", coerceTypes)
    .defer(d3.csv, "gdpData.csv", coerceTypes)
    .await(createGraph);


function coerceTypes(d) {
    d.Quantity = +d.Value; // Coerce to number.
    d.Year = +d.Year; // Coerce to number.

    return d;
}


// Is run when the data is loaded.
function createGraph(error, waterData, gdpData) {
    // Filter variables.
    var year = 2012,
        textFilter = "";

    var tickWidth = 8; // Width of the datapoint marks.

    // Transition values.
    var duration = 1000;
        delay = function(d) { return 0; };

    rawData = d3.merge([waterData, gdpData]);

    nestData = nestData(rawData);

    data = getYearData(nestData, year);

    // ---- Data ready. ----

    // Datapoint locations.
    var xMap = function(d) { return Math.round( x(d.value.get("GDP")) ); };
        xMapStart = function(d) { return xMap(d) - tickWidth/2; };
        xMapStop = function(d) { return xMap(d) + tickWidth/2; };
        yMapRural = function(d) { return y(d.value.get("Rural") / 100); };
        yMapUrban = function(d) { return y(d.value.get("Urban") / 100); };
        yMapTotal = function(d) { return y(d.value.get("Total") / 100); };

    var xMapLabel = function(d) { return xMap(d) + 10; };


    // Set the X domain.
    x.domain([
        // Get the minimum GDP of all the entries in all the years.
        d3.min(nestData.entries(), function(d) {
            return d3.min(d.value.entries(), function(e) {
                return e.value.get("GDP");
            });
        }) - 5, // Make sure the lowest datapoint does not touch the axis.
        // Get the maximum GDP of all the entries in all the years.
        d3.max(nestData.entries(), function(d) {
            return d3.max(d.value.entries(), function(e) {
                return e.value.get("GDP");
            });
        }),
    ]);

    // Set the Y domain.
    y.domain( [1, 0] );


    var lineArea = chart.append("g"); // Background lines go here.
    var dataArea = chart.append("g"); // Datapoints go here.


    // X axis.
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0 ," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("y", "1.7rem")
        .text("Country GDP");

    // Y axis.
    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("y", "-0.6rem")
        .attr("x", "-2rem")
        .text("% of people with access to improved water sources.");


    // Data tooltip used on hover of the datapoints.
    var tooltip = chart.append("g")
        .attr("class", "tooltip")
    tooltip.append("rect"); // Tooltip background.

    var tooltipText = tooltip.append("text");

    tooltipText.append("tspan")
        .attr("class", "name")
        .attr("x", "0")
        .attr("dy", "1.2rem");
    tooltipText.append("tspan")
        .attr("class", "total")
        .attr("x", "0")
        .attr("dy", "1.2rem");
    tooltipText.append("tspan")
        .attr("class", "urban")
        .attr("x", "0")
        .attr("dy", "1.2rem");
    tooltipText.append("tspan")
        .attr("class", "rural")
        .attr("x", "0")
        .attr("dy", "1.2rem");


    // Handles the entering, exiting and updating of datapoints.
    function updateGraph() {
        data = getYearData(nestData, year);
        data = textFilterData(data, textFilter);


        // ---- Datapoints -----------------------------------------------------

        // Create the datapoints.
        var keyFn = function(d) { return d.key; };
        var dataPoint = dataArea.selectAll("g.datapoint")
            .data(data, keyFn);
        // The KeyFunction is explained here at section 4.2:
        // http://code.hazzens.com/d3tut/lesson_4.html

        // -- Enter --

        var newDatapoint = dataPoint.enter().append("g")
            .attr("class", "datapoint")
            .style("opacity", 0);

        newDatapoint.transition() // Slowly fade new points in.
            .duration(duration)
            .delay(delay)
            .style("opacity", 1);

        newDatapoint.append("rect") // Cathes the hovers for the "g" element.
            .attr("class", "hovercatcher");

        newDatapoint.append("line") // Connector.
            .attr("class", "connector");

        newDatapoint.append("line") // Rural line.
            .attr("class", "rural");

        newDatapoint.append("line") // Urban line.
            .attr("class", "urban");

        newDatapoint.append("circle") // Total circle.
            .attr("class", "total");


        // -- Update --

        dataPoint.on('mouseover', datapointOver)
            .on('mouseout', datapointOut);

        dataPoint.select("rect.hovercatcher").transition()
            .duration(duration)
            .delay(delay)
            .attr("x", function(d) { return Math.min(xMapStart(d), xMapStop(d)); })
            .attr("y", function(d) { return Math.min(yMapUrban(d), yMapRural(d)); })
            .attr("width", function(d) { return Math.abs(xMapStop(d) - xMapStart(d)); })
            .attr("height", function(d) { return Math.abs(yMapRural(d) - yMapUrban(d)); });

        dataPoint.select("line.connector").transition()
            .duration(duration)
            .delay(delay)
            .attr("x1", xMap)
            .attr("y1", yMapRural)
            .attr("x2", xMap)
            .attr("y2", yMapUrban);

        dataPoint.select("line.rural").transition()
            .duration(duration)
            .delay(delay)
            .attr("x1", xMapStart)
            .attr("y1", yMapRural)
            .attr("x2", xMapStop)
            .attr("y2", yMapRural);

        dataPoint.select("line.urban").transition()
            .duration(duration)
            .delay(delay)
            .attr("x1", xMapStart)
            .attr("y1", yMapUrban)
            .attr("x2", xMapStop)
            .attr("y2", yMapUrban);

        dataPoint.select("circle.total").transition()
            .duration(duration)
            .delay(delay)
            .attr("cx", xMap)
            .attr("cy", yMapTotal);

        // -- Remove --

        dataPoint.exit().transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();


        // ---- Datalines ------------------------------------------------------

        var lineGroup = lineArea.selectAll("g.lineGroup")
            .data(data, keyFn);


        // -- Enter --

        var newLineGroup = lineGroup.enter().append("g")
            .attr("class", "lineGroup")
            .style("opacity", 0);

        newLineGroup.transition() // Slowly fade new points in.
            .duration(duration)
            .delay(delay)
            .style("opacity", 1);

        newLineGroup.append("line")
            .attr("class", "x");

        newLineGroup.append("line")
            .attr("class", "y");


        // -- Update --

        // The lines are identified by a key ID.
        lineGroup.attr("id", function(d, i) { return "line" + i; });


        // If there is no filter set: Hide the lines.
        // It would be too crowded otherwise.
        if (!textFilter) {
            lineGroup.classed("hidden", true);
        } else {
            lineGroup.classed("hidden", false);
        }

        lineGroup.select("line.x").transition()
            .duration(duration)
            .delay(delay)
            .attr("x1", 0)
            .attr("y1", yMapTotal)
            .attr("x2", xMap)
            .attr("y2", yMapTotal);

        lineGroup.select("line.y").transition()
            .duration(duration)
            .delay(delay)
            .attr("x1", xMap)
            .attr("y1", yMapTotal)
            .attr("x2", xMap)
            .attr("y2", height);


        // -- Remove --

        lineGroup.exit().transition()
            .duration(duration)
            .style("opacity", 0)
            .remove();
    }


    // ---- Button creation ----------------------------------------------------

    // Create a button for every year.
    var buttonContainer = d3.select("#buttonContainer");
        years = nestData.keys();

    for (index = 0; index < years.length; ++index) {
        // The 'setYear' function has to be created inside another function.
        // Otherwise the variable 'index' inside the function will increment
        // with the for loop.
        var clickFunction = function(index) { return function() { setYear(+years[index]); }; };

        buttonContainer.append("button")
            .on("click", clickFunction(index))
            .text(years[index]);
    }

    // ---- Year label ---------------------------------------------------------

    d3.select("#filterContainer").append("p") // Create the year text.
        .attr("class", "text-year")
        .html(year);

    // ---- Input functions ----------------------------------------------------

    // Filter text input.
    d3.select("input[name=filter]")
        .on("input", function() {
            textFilter = this.value;
            updateGraph();
        });

    function setYear(y) {
        year = y;

        // Set the year text.
        d3.select(".text-year")
            .html(year);

        updateGraph();
    }

    // ---- Tooltip functions --------------------------------------------------

    // Shows the tooltip.
    function showTooltip(d) {
        var tip = d3.select(".tooltip");

        // Move the tooltip to the datapoint.
        tip.attr("transform", "translate(" + (xMap(d) + 10 ) +
                "," + yMapTotal(d) + ")")
            .style("display", "block");

        // Update the text.
        tip.select(".name")
            .text(d.key);
        tip.select(".total")
            .text("Total: " + d.value.get("Total") + "%");
        tip.select(".urban")
            .text("Urban: " + d.value.get("Urban") + "%");
        tip.select(".rural")
            .text("Rural: " + d.value.get("Rural") + "%");

        // Size the background.
        var bbox = tip.select("text").node().getBBox();
        tip.select("rect")
            .attr("width", bbox.width)
            .attr("height", bbox.height + 10);
    }

    // Hides the tooltip.
    function hideTooltip(d) {
        var tip = d3.select(".tooltip");
        tip.style("display", "");
    }

    // ---- Datapoint hover functions ------------------------------------------

    // Datapoint is hovered.
    function datapointOver(d, i) {
        showTooltip(d);

        // Hightlight the data lines.
        d3.select("#line" + i)
            .classed("highlight", true);
    }

    // Datapoint is no longer hovered.
    function datapointOut(d, i) {
        hideTooltip(d);

        // Remove the highlight on the lines.
        d3.select("#line" + i)
            .classed("highlight", false);
    }

    // Run!
    updateGraph();
}


// ---- Data functions ---------------------------------------------------------

function nestData(data) {
    // First remove everything that is not higher than 0.
    var data = data.filter(function(d) { return d.Quantity > 0; })

    // Now nest it.
    var nest = d3.nest()
        .key(function(d) { return d.Year; })
        .key(function(d) { return d.Country; })
        .key(function(d) { return d.Identifier; })
        // Convert the quanitites to key: value pairs.
        .rollup(function(leaves) { return d3.sum(leaves, function(d) {  return d.Value; }); })
        .map(data, d3.map);

    return nest;
}

// Gets the data from a specific year.
function getYearData(data, year) {
    data = data.get(year).entries();

    // Filter only those countries with all three values: gdp, rural and urban.
    data = data.filter( function(d) { return d.value.has("GDP") &&
        d.value.has("Rural") &&
        d.value.has("Urban"); } );

    return data;
}

// Filters the data on a string.
function textFilterData(data, textFilter) {

    data = data.filter( function(d)  {
        // See if the filter is contained in the string somewhere.
        return d.key.toLowerCase().indexOf(textFilter.toLowerCase()) > -1;
    });

    return data;
}

// Removes spaces from a string.
function strRemoveSpaces(s) {
    s = s.replace(/\s+/g, "");
    return s;
}
