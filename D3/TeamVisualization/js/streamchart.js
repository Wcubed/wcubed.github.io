/*
 * streamchart.js
 * Part of the Team Visualization.
 * Shows the flow between exporting and importing countries.
 *
 * Authour: Wybe Westra
 * Date: 04-06-2016
 */

// -----------------------------------------------------------------------------
// ---- Constructor ------------------------------------------------------------
// -----------------------------------------------------------------------------

function Streamchart(container, config, flowDirection) {
    this.flowDirection = flowDirection;

    // Determine sizes.
    this.size = {margin: {
        top: 30,
        bottom: 40,
        left: 80,
        right: 70,
        label: 10, // Margin between bars and labels.
    }};
    this.size.totalWidth = 940;
    this.size.totalHeight = 400;
    this.size.width = this.size.totalWidth - this.size.margin.left - this.size.margin.right;
    this.size.height = this.size.totalHeight - this.size.margin.top - this.size.margin.bottom;

    this.size.barChartWidth = this.size.width * 0.1;
    this.size.margin.interChart = this.size.width * 0.1;
    this.size.streamChartStartX = this.size.barChartWidth + this.size.margin.interChart;
    this.size.streamChartWidth = this.size.width - this.size.barChartWidth - this.size.margin.interChart;

    this.class = "streamchart" + this.flowDirection;
    this.barSelector = "." + this.class + " .bar";
    this.streamSelector = "." + this.class + " .stream";

    this.fontSize = 15;

    // Scales.
    this.barYscale = d3.scale.linear()
        .range([0, this.size.height]);

    this.flowXscale = d3.scale.linear()
        .range([this.size.streamChartStartX,
            this.size.streamChartStartX + this.size.streamChartWidth])
        .domain([config.yearList[0], config.yearList[config.yearList.length-1]]);

    this.flowYscale = d3.scale.linear()
        .range([0, this.size.height]);

    // Axis.
    this.xAxis = d3.svg.axis()
        .scale(this.flowXscale)
        .orient("bottom")
        .ticks(10, "g");

    // ---- Build the chart svg ------------------------------------------------
    d3.select(container).append("h2")
        .html(this.flowDirection);

    this.chart = d3.select(container).append("svg")
        .classed(this.class, true)
        .classed("streamchart", true)
        .attr("width", this.size.totalWidth)
        .attr("height", this.size.totalHeight)
      .append("g") // Add the margin offset.
        .attr("transform", "translate(" + this.size.margin.left + "," + this.size.margin.top + ")");

    // Background.
    this.chart.append("rect")
        .classed("background", true)
        .attr("x", -this.size.margin.left)
        .attr("y", -this.size.margin.top)
        .attr("width", this.size.totalWidth)
        .attr("height", this.size.totalHeight);

    // Add the containers.
    this.streamContainer = this.chart.append("g"); // Contains the streams.
    this.flowContainer = this.chart.append("g"); // Contains the bars.
    this.labelContainer = this.chart.append("g"); // Contains labels.
    this.lineContainer = this.chart.append("g"); // Contains reference lines.

    // Year indicator.
    this.yearLine = this.lineContainer.append("line")
        .classed("year-line", true);

    // Year total label.
    this.yearTotalLabel = this.lineContainer.append("text")
        .classed("year-total-label", true);

    // X axis.
    this.chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0 ," + this.size.height + ")")
        .call(this.xAxis);
}

// -----------------------------------------------------------------------------
// ---- Update function --------------------------------------------------------
// -----------------------------------------------------------------------------

Streamchart.prototype.update = function(config) {
    // ---- Get the data -------------------------------------------------------
    this.wrangleData(config);
    this.setStackData(config);

    //console.log(this.layers);

    // Set scale domain.
    this.barYscale.domain([0, this.maxDataValue]);

    this.flowYscale.domain([0, this.maxFlowValue]);

    //console.log("---- Updating" + this.flowDirection + " ----");

    // ---- Datapoint location functions ---------------------------------------

    barPos = function(c) {
        return function(d) {
            return "translate(0," + c.barYscale(d.y0) + ")";
        }
    };
    barHeight = function(c) {
        return function(d) {
            return c.barYscale(d.y1 - d.y0);
        }
    };

    labelPos = function(c) {
        return function(d) {
            return "translate(0," + (c.barYscale(d.y0) + c.barYscale(d.y1 - d.y0)/2 ) + ")";
        }
    };

    // Checks if the label fits within the height of the bar
    // and adjusts the opacity accordingly.
    labelOpacity = function(c, hoveredCountry) {
        return function(d) {
            if (c.barYscale(d.y1 - d.y0) > c.fontSize ||
                d.key == hoveredCountry) {
                return 1;
            } else {
                return 0;
            }
        }
    };

    // Flow x position.
    flowX = function(c) {
        return function(d) {
            return c.flowXscale(d.x);
        }
    }

    // Flow y position.
    flowY0 = function(c) {
        return function(d) {
            return c.flowYscale(d.y0);
        }
    }

    // Flow y size.
    flowY1 = function(c) {
        return function(d) {
            return c.flowYscale(d.y0 + d.y);
        }
    }

    pathArea = function(c) {
        return function(d) {
            return c.area(d);
        }
    }


    // Setup the area parameters.
    this.area = d3.svg.area()
        .interpolate("basis")
        .x(flowX(this))
        .y0(flowY0(this))
        .y1(flowY1(this));

    // ---- Datapoints ---------------------------------------------------------

    // Key function.
    var keyFn = function(d) {
        return d.key;
    };

    var streamKeyFn = function(d) {
        return d[0].key;
    }

    var stream = this.streamContainer.selectAll("path")
        .data(this.layers, streamKeyFn);

    var datapoint = this.flowContainer.selectAll("g")
        .data(this.data, keyFn);

    var label = this.labelContainer.selectAll("g")
        .data(this.data, keyFn);

    // ---- Enter ----

    var newStream = stream.enter().append("path")
        .classed("stream", true);

    var newDatapoint = datapoint.enter().append("g")
        .attr("transform", barPos(this))
        .style("opacity", 1);

    newDatapoint.append("rect")
        .classed("bar", true)
        .attr("height", 0)
        .style("fill", function(d) {
            var continent = config.continentData[d.key];
            if (continent) {
                return config.continentMeta[continent].col;
            };
        })
        .style("stroke", "rgb(33, 33, 33)");

    var newLabel = label.enter().append("g")
        .attr("transform", barPos(this))
        .style("opacity", labelOpacity(this));

    newLabel.append("text")
        .classed("label", true)
        .classed("label-name", true)
        .attr("x", this.size.barChartWidth + this.size.margin.label)
        .html(function(d) { return d.key; })
    newLabel.append("text")
        .classed("label", true)
        .classed("label-percentage", true)
        .attr("x", -this.size.margin.label)
        .html(function(d) { return d.value; });

    newLabel.append("line")
        .classed("label-separator", true)
        .attr("x1", this.size.barChartWidth + 2)
        .attr("y1", 0)
        .attr("x2", this.size.barChartWidth + this.size.margin.label - 2)
        .attr("y2", 0);
    newLabel.append("line")
        .classed("label-separator", true)
        .attr("x1", -2)
        .attr("y1", 0)
        .attr("x2", -this.size.margin.label + 2)
        .attr("y2", 0);

    // ---- Update ----

    stream.transition()
        .duration(config.transitionDuration)
        .attr("d", pathArea(this))
        .style("fill", function(d) {
            if (d[0].key == config.hoveredCountry) {
                return "rgba(255,255,255, 0.9)";
            } else {
                var continent = config.continentData[d[0].key];
                if (continent) {
                    return config.continentMeta[continent].col;
                };
            }
        })
        .style("stroke", function(d) {
            var continent = config.continentData[d[0].key];
            if (continent) {
                return config.continentMeta[continent].col;
            };
        });

    datapoint.transition()
        .duration(config.transitionDuration)
        .attr("transform", barPos(this))
        .style("opacity", 1);

    datapoint.select(".bar").transition()
        .duration(config.transitionDuration)
        .attr("height", barHeight(this))
        .attr("width", this.size.barChartWidth)
        .style("fill", function(d) {
            if (config.hoveredCountry == d.key) {
                return "rgba(255, 255, 255, 0.9)";
            } else {
                var continent = config.continentData[d.key];
                if (continent) {
                    return config.continentMeta[continent].col;
                };
            }
        });

    label.transition()
        .duration(config.transitionDuration)
        .attr("transform", labelPos(this))
        .style("opacity", labelOpacity(this, config.hoveredCountry));

    label.select(".label-percentage")
        .html(function(d) { return Math.round(d.percentage * 10) / 10 + "%"; });

    // Year line.
    this.yearLine.transition()
        .duration(config.transitionDuration)
        .attr("x1", this.flowXscale(config.year))
        .attr("y1", 0)
        .attr("x2", this.flowXscale(config.year))
        .attr("y2", this.size.height);

    // Year total label.

    this.yearTotalLabel.transition()
        .duration(config.transitionDuration)
        .attr("x", this.flowXscale(config.year))
        .attr("y", -5);

    this.yearTotalLabel.html("Total: " + d3.format(',')(this.yearTotals[config.year]) + " kg");

    // ---- Remove ----

    stream.exit().remove()

    datapoint.exit().transition()
        .duration(config.transitionDuration)
        .style("opacity", 0)
        .remove();

    label.exit().transition()
        .duration(config.transitionDuration)
        .style("opacity", 0)
        .remove();
}

// -----------------------------------------------------------------------------
// ---- Data wrangling function ------------------------------------------------
// -----------------------------------------------------------------------------

Streamchart.prototype.wrangleData = function(config) {
    var rawData = config.nestedData.get(config.year)
        .get(config.commodity).entries();

    var data = [];
        y0 = 0;
        flowDirection = this.flowDirection;

    rawData.sort(function(a, b) {
        contA = config.continentData[a.key];
        contB = config.continentData[b.key];
        iA = 0;
        iB = 0;

        if (contA) {
            iA = config.continentMeta[contA].i;
        }
        if (contB) {
            iB = config.continentMeta[contB].i;
        }

        return iA - iB;
    });

    // Calculate the start and ending points of the data bars.
    rawData.forEach(function(e, i) {
        var d = {};

        d.key = e.key;
        d.value = e.value.get(flowDirection);

        if (d.value) {
            d.y0 = y0;
            y0 += d.value;
            d.y1 = y0;

            data.push(d); // Add the point to the dataset.
        }
    });

    // Calculate the percentages.
    data.forEach(function(d) {
        d.percentage = (d.value / y0) * 100;
    });

    this.data = data;
    this.maxDataValue = y0;
}


Streamchart.prototype.setStackData = function(config) {
    // Setup the stack parameters.
    this.stack = d3.layout.stack()
        .offset("silhouette")
        .values(function(d) { return d; });

    this.stackData = config.commodityTimeData.get(config.commodity)
        .get(this.flowDirection).entries();

    // Order by continent.
    this.stackData.sort(function(a, b) {
        contA = config.continentData[a.key];
        contB = config.continentData[b.key];
        iA = 0;
        iB = 0;

        if (contA) {
            iA = config.continentMeta[contA].i;
        }
        if (contB) {
            iB = config.continentMeta[contB].i;
        }

        return iA - iB;
    });

    // We need to fill in the gaps in the data.
    var stackData = this.stackData;
    var filledStackData = [];

    // Count the totals per year.
    var yearTotals = {};
    var maxValue = 0;

    config.yearList.forEach(function(d) {
        yearTotals[d] = 0;
    });

    this.stackData.forEach(function(d, i) { // For every country.

        filledStackData.push([]);

        config.yearList.forEach(function(y) { // For every year.

            var value = d.value.get(y);

            // If there is no data here: default to 0.
            if (value) {
                filledStackData[i].push({'x': y, 'y': value, 'key': d.key});
                yearTotals[y] += value;

                if (yearTotals[y] > maxValue) {
                    maxValue = yearTotals[y];
                }
            } else {
                filledStackData[i].push({'x': y, 'y': 0, 'key': d.key});
            }
        });
    });

    this.yearTotals = yearTotals;
    this.maxFlowValue = maxValue;

    this.stackData = filledStackData;

    this.layers = this.stack(this.stackData);
}
