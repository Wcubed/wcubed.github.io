/*
 * buildCharts.js
 * Loads the data and builds the charts.
 *
 * Authour: Wybe Westra
 * Date: 13-05-2016
 */


 // Load the data and create the graph.
 d3_queue.queue()
     .defer(d3.csv, "data/waterData.csv", coerceTypes)
     .defer(d3.csv, "data/gdpData.csv", coerceTypes)
     .defer(d3.csv, "data/continents.csv")
     .await(createGraphs);



function createGraphs(error, waterData, gdpData, continentData) {
    // Fiters
    var year = 2012;
        textFilter = "";
        continentFilter = {
            "Europe" : true,
            "Oceania" : true,
            "Africa" : true,
            "Asia" : true,
            "North America" : true,
            "Central America" : true,
            "South America" : true,
        };

    // Combine the water and gdp datasets.
    var rawData = d3.merge([waterData, gdpData]);
        nestData = nestData(rawData);
        data = getYearData(nestData, year);

    // Convert the continent data into a dictionary of
    //"country: continent" pairs.
    var continentData = convertContinentData(continentData);
        continentColors = {
            "Europe" : "rgb(185, 20, 67)",
            "Oceania" : "rgb(14, 128, 116)",
            "Africa" : "rgb(206, 100, 22)",
            "Asia" : "rgb(90, 183, 19)",
            "North America" : "rgb(55, 30, 142)",
            "Central America" : "rgb(117, 17, 135)",
            "South America" : "rgb(206, 173, 22)",
        }


    // ---- Controlls container ------------------------------------------------

    var controllContainer = d3.select("body").append("div")
        .classed("container", true);

    // ---- Description creation -----------------------------------------------

    var description = controllContainer.append("div")
        .classed("description", true)
        .classed("pull-left", true);

    description.append("p")
        .html(
            "The charts show the percentage of people that have acces to an improved source of water.</br>\
            Improved here means: \"Built so that it is protected against contamination.\""
        );

    description.append("p")
        .html(
            "Also shown is the difference in access between rural and urban areas."
        );

    description.append("p")
        .html(
            "Use the filters on the right to set the year, toggle continents or search for a country.</br>\
            The datapoints in the scatterplot can be hovered for more information."
        );

    // ---- Filter container ---------------------------------------------------

    var filterContainer = controllContainer.append("div")
        .classed("filters", true)
        .classed("pull-left", true);

    // ---- Button creation ----------------------------------------------------

    // Create a button for every year.
    var buttonContainer = filterContainer.append("div");
        years = nestData.keys();

    for (index = 0; index < years.length; ++index) {
        // The 'setYear' function has to be created inside another function.
        // Otherwise the variable 'index' inside the function will increment
        // with the for loop.
        var clickFunction = function(index) { return function() { setYear(+years[index]); }; };

        buttonContainer.append("button")
            .classed("year-button", true)
            .on("click", clickFunction(index))
            .text(years[index]);
    }

    // ---- Text filter --------------------------------------------------------

    var textFilterContainer = filterContainer.append("div")
        .html("Filter: ");

    textFilterContainer.append("input")
        .attr("name", "filter")
        .attr("type", "text")
        .on("input", function() {
            textFilter = this.value;
            updatePlots();
        });


    // ---- Continent filter ---------------------------------------------------

    var continentFilterContainer = filterContainer.append("div");

    for (var cont in continentColors) {
        if (continentColors.hasOwnProperty(cont)) {
            // Append the colored background.
            var checkboxContainer = continentFilterContainer.append("div")
                .classed("continent-checkbox", true)
                .classed("active", true)
                .style("background-color", continentColors[cont])
                .style("color", continentColors[cont])
                .style("border-color", continentColors[cont])
                .attr("value", cont)
                .on("click", setContinentFilter);

            checkboxContainer.append("span") // Append the label.
                .html(cont);
        }
    }

    // ---- Input functions ----------------------------------------------------


    // Continent checkbox function.
    function setContinentFilter() {
        var element = d3.select(this);

        var continent = element.attr("value");
            state = element.classed("active");

        state = !state; // Toggle the state.

        element.classed("active", state);
        element.classed("inactive", !state);

        continentFilter[continent] = state;

        updatePlots();
    }

    // Year button function.
    function setYear(y) {
        year = y;

        // Deactivate every button except the pressed one.
        d3.selectAll(".year-button")
            .classed("active", function() {
                return d3.select(this).html() == year;
            });

        updatePlots();
    }


    // ---- Build the plots ----------------------------------------------------

    var updateScatterPlot =
        buildScatterPlot(nestData, continentData, continentColors);

    var updateYearChart =
        buildYearChart(nestData, continentData, continentColors);

    var updateDifferenceChart =
        buildDifferenceChart(nestData, continentData, continentColors);

    // ---- Plot update function -----------------------------------------------

    function updatePlots() {
        // Update the data.
        data = getYearData(nestData, year);
        data = textFilterData(data, textFilter);
        data = continentFilterData(data, continentData, continentFilter);

        updateScatterPlot(data, textFilter);
        updateYearChart(year, continentFilter);
        updateDifferenceChart(data, textFilter);
    }


    // Run the first update.
    setYear(2012);
}


// ---- Data functions ---------------------------------------------------------

// Coerces the data types on load.
function coerceTypes(d) {
    d.Quantity = +d.Value; // Coerce to number.
    d.Year = +d.Year; // Coerce to number.

    return d;
}


// Converts continent data into a dictionary.
function convertContinentData(data) {
    var dict = {};

    for (var i = 0; i < data.length; i += 1)
    {
        dict[data[i].Country] = data[i].Continent;
    }

    return dict;
}


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


// Filters the data on continents.
function continentFilterData(data, continentData, continentFilter) {

    // Check if a countries continent is enabled in the filter.
    data = data.filter( function(d) {
        var continent = continentData[d.key];
        return continentFilter[continent];
    });

    return data;
}
