/*
 * scatterplot.js
 * Part of the Team Visualization.
 * Shows
 *
 * Author: Wybe Westra
 * Date: 30-05-2016
 */

// createFlowchart.
// container => string => The name of the container this chart should go in.
function Scatterplot(container, config) {

    // Setup margins and graph size.
    var size = { margin: { top: 50, right: 20, bottom: 50, left: 20 } };
    size.totalWidth = 400;
    size.totalHeight = 400;
    size.width = size.totalWidth - size.margin.left - size.margin.right;
    size.height = size.totalHeight - size.margin.top - size.margin.bottom;

    // The return value.
    var scatterplot = {
        class: "scatterplot",
        datapointClass: "datapoint",
    };

    scatterplot.datapointSelector =
        "." + scatterplot.class + " ." + scatterplot.datapointClass;

    // Scales.
    var exportX = d3.scale.linear()
        .range([0, size.width]);

    var importY = d3.scale.linear()
        .range([size.height, 0]);

    var xAxis = d3.svg.axis()
        .scale(exportX)
        .orient("bottom")
        .ticks(5);

    var yAxis = d3.svg.axis()
        .scale(importY)
        .orient("right")
        .ticks(5);


    // ---- Build the chart ----------------------------------------------------

    var chart = d3.select(container).append("svg")
        .classed(scatterplot.class, true)
        .attr("width", size.totalWidth)
        .attr("height", size.totalHeight)
        .append("g") // Add the margin offset.
        .attr("transform", "translate(" + size.margin.left + "," + size.margin.top + ")");

    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Draw X Axis
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + size.height + ")")
        .style("fill", "white")
    .append("text")
        .attr("class", "label")
        .attr("x", size.width)
        .attr("dy", -20)
        .style("text-anchor", "end")
        .text("Export (kg)");

    // Draw Y Axis
    chart.append("g")
        .attr("class", "y axis")
        .style("fill", "white")
    .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("dy", -6)
        .style("text-anchor", "end")
        .text("Import (kg)");

    // ---- Update function ----------------------------------------------------

    scatterplot.update = function(config) {
        // Get the currenly selected data.
        var data = config.nestedData
            .get(config.year)
            .get(config.commodity).entries();

        // Compute Max values for Import and Export
        var maxExport = -1;
        var maxImport = -1;


        for (i=0; i<data.length; i++) {

            var prevExport = data[i].value.get("Export");
            if (prevExport > maxExport) {
                maxExport = prevExport;
            }

            var prevImport = data[i].value.get("Import");
            if (prevImport > maxImport) {
                maxImport = prevImport;
            }
        }

        console.log(" Export: " + maxExport + "Import: " + maxImport);


        // Scale domains.
        exportX.domain([0, maxExport]);
        importY.domain([0, maxImport]);


        // Setup X and Y Axis
        var xAxis = d3.svg.axis().scale(exportX).orient("bottom").ticks(3);
        var yAxis = d3.svg.axis().scale(importY).orient("right").ticks(4);

        // Update X and Y axis.

        chart.select(".axis.y").transition()
            .duration(config.transitionDuration)
            .call(yAxis);

        chart.select(".axis.x").transition()
            .duration(config.transitionDuration)
            .call(xAxis);

        // ---- Datapoints -----------------------------------------------------
        // Key function.
        var keyFn = function(d, i) {
            return d.key;
        };

        var datapoints = chart.selectAll("g.dots")
            .data(data, keyFn);

        // -- Enter --
        var newDatapoints = datapoints.enter().append("g")
            .classed(scatterplot.datapointClass, true)
            .classed("dots", true);


        newDatapoints.append("circle")
            .attr("class", "dot")
            .attr("r", 4);

        // -- Update --
        datapoints.select(".dot").transition()
            .duration(config.transitionDuration)
            .style("stroke", function(d) {
                if (d.key == config.hoveredCountry) {
                    // Tooltip.
                    /*
                    div.transition()
                      .duration(200)
                      .style("opacity", .9);
                    div.html("Country: " + d.key + "<br/>" + "Export: " + d.value.get("Export") + "<br/>" + "Import: " + d.value.get("Import"))
                      .style("left", (d3.event.pageX) + "px")
                      .style("top", (d3.event.pageY - 28) + "px");
                    */

                    return "rgb(125, 203, 121)";
                } else {
                    return "rgb(121,134,203)";
                }
            })
            .style("fill", function(d) {
                if (d.key == config.hoveredCountry) {
                    return "rgb(125, 203, 121)";
                } else {
                    return "rgba(0, 0, 0, 0)";
                }
            })
            .attr("cx", function(d){
                if(d.value.get("Export") != null) {
                    return ( 15 + exportX(d.value.get("Export")) ) }
                else { return 15 };
            })
            .attr("cy", function(d) {
                if(d.value.get("Import") != null) {
                    return ( importY(d.value.get("Import")) - 10) }
                    else { return 10 };
            });

        // -- Remove --
        datapoints.exit().remove();
    }

    // ---- Return the values --------------------------------------------------
    return scatterplot;
}
