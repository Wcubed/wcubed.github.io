/*
 * buildCharts.js
 * Part of the Team Visualization.
 * Loads the data and builds the charts.
 *
 * Authour: Wybe Westra
 * Date: 30-05-2016
 */

// Load the data and create the graph.
d3_queue.queue()
    .defer(d3.csv, "data/metalData.csv", coerceTypes)
    .defer(d3.csv, "data/continents.csv")
    .await(createGraphs);


function createGraphs(error, materialData, continentData) {
    if (error) throw error;

    // ---- Initialize configuration -------------------------------------------

    // The filter and update configuration.
    var config = {
        // ---- Data ----
        // Data nested by year -> commodity -> country -> flow.
        nestedData: nestData(materialData),
        // Data nested by commodity.
        commodityTimeData: commodityTimeData(materialData),

        continentData: convertContinentdata(continentData),

        continentMeta: {
            "Africa": {col: "rgba(255,241,118, 0.5)", i: 0},
            "Asia": {col: "rgba(0,176,255, 0.5)", i: 1},
            "Europe": {col: "rgba(0,230,118, 0.5)", i: 2},
            "North America": {col: "rgba(255,82,82, 0.5)", i: 3},
            "South America": {col: "rgba(255,87,34, 0.5)", i: 4},
            "Oceania": {col: "rgba(179,136,255, 0.5)", i: 5},
        },

        // ---- Filters ----
        year: 2012,
        commodity: "Silicon, <99.99% pure",
        hoveredCountry: "",

        // Update information.
        transitionDuration: 1000, // In milliseconds.
    }

    // Make a list of all available years, as integers.
    config.yearList = config.nestedData.keys();
    config.yearList.forEach( function(d, i) {
        this[i] = +d;
    }, config.yearList);

    // Make a list of all available commodities.
    config.commodityList = {};

    config.nestedData.values().forEach( function(d) {
        d.keys().forEach( function (k) {
            config.commodityList[k] = true;
        });
    });

    // ---- Hover/filter functions ---------------------------------------------

    var flowchartOverBar = function(d) {
        config.hoveredCountry = d.key;
        config.transitionDuration = 500;
        updatePlots(config);
    }

    var flowchartOverStream = function(d) {
        config.hoveredCountry = d[0].key;
        config.transitionDuration = 500;
        updatePlots(config);
    }

    // Change the year.
    var yearSliderInput = function() {
        config.year = this.value;
        config.transitionDuration = 1000;
        updatePlots(config);
    }

    // Changes the selected commodity.
    var commodityInput = function(d) {
        config.transitionDuration = 1000;
        config.commodity = d;
        updatePlots(config);
    }

    // ---- Build the main container -------------------------------------------

    var mainContainer = d3.select("body").append("main");

    // ---- Create the filter area ---------------------------------------------

    var filterContainer = mainContainer.append("div")
        .classed("filter-container", true);

    // Commodity selectors.
    var commoditySelector = filterContainer.selectAll("div.commodity-selector")
        .data(Object.keys(config.commodityList))
      .enter().append("div")
        //.attr("value", function(d){ return d } )
        .classed("commodity-selector", true)
        .on("click", commodityInput);

    commoditySelector.append("p")
        .html(function(d) { return d; });


    // To contain the graphs in.
    var graphContainer = mainContainer.append("div")
        .classed("graph-container", true);


    var sliderContainer = graphContainer.append("div");

    sliderContainer.append("p")
        .html("Select year:");

    var scatterContainer = mainContainer.append("div")
        .classed("scatterContainer", true);

    // Year selector.
    var yearSlider = sliderContainer.append("input")
        .classed("year-slider", true)
        .attr("type", "range")
        .attr("min", Math.min.apply(null, config.yearList))
        .attr("max", Math.max.apply(null, config.yearList))
        .attr("step", 1)
        .on("input", yearSliderInput);

    // ---- Build the plots ----------------------------------------------------

    //var flowchartImport = new Flowchart("main", config, "Import");
    //var flowchartExport = new Flowchart("main", config, "Export");

    var streamchartImport = new Streamchart(".graph-container", config, "Import");
    var streamchartExport = new Streamchart(".graph-container", config, "Export");
    var scatterplot = new Scatterplot(".scatterContainer", config);

    // Set the year slider margins to match the year axis.
    sliderContainer.style("margin-left",
        streamchartExport.size.margin.left +
        streamchartExport.size.barChartWidth +
        streamchartExport.size.margin.interChart - 12.5 + "px");
    sliderContainer.style("margin-right",
        streamchartExport.size.margin.right - 12.5 + "px");

    // Country details display.
    var detailsDisplay = mainContainer.append("div")
        .classed("details-display", true);

    var detailsCountryName = detailsDisplay.append("h2")
        .html("Details");
    var detailsCommodity = detailsDisplay.append("p");
    var detailsYear = detailsDisplay.append("p")
        .classed("details-year", true);
    var detailsImport = detailsDisplay.append("p")
        .classed("details-import", true);
    var detailsExport = detailsDisplay.append("p")
        .classed("details-export", true);


    // Continent labels box.
    var continentLabels = mainContainer.append("div")
        .classed("details-display", true);

    // Create the labels.
    for (var cont in config.continentMeta) {
        if (config.continentMeta.hasOwnProperty(cont)) {
            continentLabels.append("div")
                .classed("color-box", true)
                .style("background-color", config.continentMeta[cont].col);
            continentLabels.append("p")
                .classed("color-label", true)
                .html(cont);
        }
    }

    // ---- Plot update function -----------------------------------------------

    function updatePlots(config) {

        //flowchartImport.update(config);
        //flowchartExport.update(config);
        scatterplot.update(config);

        streamchartImport.update(config);
        streamchartExport.update(config);

        // --- Update filters --------------------------------------------------

        yearSlider.attr("value", config.year);
        commoditySelector.classed("selected", function(d) {
            return config.commodity == d;
        });

        var hoveredData = config.nestedData.get(config.year)
            .get(config.commodity)
            .get(config.hoveredCountry);

        // Details display.
        if (hoveredData) {
            detailsCountryName.html(config.hoveredCountry);
            detailsImport.html("Import: " + d3.format(',')(hoveredData.get("Import")) + " kg");
            detailsExport.html("Export: " + d3.format(',')(hoveredData.get("Export")) + " kg");
        }
        detailsCommodity.html(config.commodity);
        detailsYear.html("Year: " + config.year);

        // ---- Add the hover functions ----------------------------------------

        d3.selectAll(streamchartImport.barSelector)
            .on('mouseover', flowchartOverBar);

        d3.selectAll(streamchartImport.streamSelector)
            .on('mouseover', flowchartOverStream);

        d3.selectAll(streamchartExport.barSelector)
            .on('mouseover', flowchartOverBar);

        d3.selectAll(streamchartExport.streamSelector)
            .on('mouseover', flowchartOverStream);

        d3.selectAll(scatterplot.datapointSelector)
            .on('mouseover', flowchartOverBar);
    }

    // Run the first update.
    updatePlots(config);
}


// ---- Data functions ---------------------------------------------------------

// Coerces the data types on load.
function coerceTypes(d) {
    d.Year = +d.Year;
    d.Quantity = +d.Quantity;
    return d;
}


function nestData(data) {
    var nest = d3.nest()
        .key(function(d) { return d.Year; })
        .key(function(d) { return d.Commodity; })
        .key(function(d) { return d.Country; })
        .key(function(d) { return d.Flow; })
        .rollup(function(leaves) { return d3.sum(leaves, function(d) {  return d.Quantity; }); })
        .map(data, d3.map);

    return nest;
}

function commodityTimeData(data) {
    var nest = d3.nest()
        .key(function(d) { return d.Commodity; })
        .key(function(d) { return d.Flow; })
        .key(function(d) { return d.Country; })
        .key(function(d) { return d.Year; })
        .rollup(function(leaves) { return d3.sum(leaves, function(d) {  return d.Quantity; }); })
        .map(data, d3.map);

    return nest;
}

function convertContinentdata(data) {
    var dict = {};

    data.forEach(function(d) {
        dict[d.Country] = d.Continent;
    });

    return dict;
}
