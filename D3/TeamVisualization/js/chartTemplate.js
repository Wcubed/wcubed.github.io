/*
 * chartTemplate.js
 * Part of the Team Visualization.
 * Template for new charts.
 *
 * Authour: Wybe Westra
 * Date: 30-05-2016
 */

 function createChart(container) {

     // The return value.
     var chart = {
         'datapoints': ".datapoints",
         'class': "chart"
     };


     // ---- Build the chart ----------------------------------------------------

     d3.select(container).append("svg")
         .classed(chart.class, true);

     // ---- Update function ----------------------------------------------------

     chart.update = function() {
         console.log("update");
     }

     // ---- Return the values --------------------------------------------------

     return chart;
 }
