var mapSvg, barSvg;
var mapData, stateData, attribute, centered;

// This will run when the page loads
document.addEventListener('DOMContentLoaded', () => {
    mapSvg = d3.select('#map').attr('width' , 1440).attr('height' , 600);
    barSvg = d3.select('#barchart').attr('width' , 30).attr('height' , 300);


    // Load both files before doing anything else
    Promise.all([d3.json('data/us.geojson'),
                 d3.csv('data/state_demographics.csv')])
                 .then(function(values){

    attribute = 'Population.Population Percent Change'
        
        mapData = values[0];
        stateData = values[1];
        d3.select('#tooltip').style("opacity", 0)
        d3.select('#bar').style("opacity", 0)
        
        drawMap(attribute);
        fillDropDown(stateData);
       
    });
});
//Fill dropdown
function fillDropDown(stateData)
{
    var dropDown = d3.select("#attribute-select")
    .append("select")
    .attr("class", "selection")
    .attr("name", "country-list");
stateData.columns.shift()
  var options = dropDown.selectAll("option")
    .data(stateData.columns)
    .enter()
    .append("option");
  options.text(function(d , i) {
      return stateData.columns[i];
    })
    .attr("value", function(d , i) {
      return stateData.columns[i];
    })

  

//   mydropDown(dataset);
  d3.select("#attribute-select select.selection")
    .on("change",function(d){
       attribute =  d3.select('#attribute-select select.selection').property('value')
                drawMap(attribute)
})

}

// Draw the map in the #map svg
function drawMap(attribute) {
   
    
    d3.select("div#wrapper svg#map g").remove();
    // create the map projection and geoPath
    let usaProjection = d3.geoAlbersUsa().fitSize([+mapSvg.style('width').replace('px',''),
                                                  +mapSvg.style('height').replace('px','')], 
                                                  mapData);
    let geoPath = d3.geoPath()
                    .projection(usaProjection);
    

    facts = { att: {} }
    for (i in stateData) {
      facts.att[stateData[i]["State"]] = +stateData[i][attribute]
}
    // Get the min and max value for the selected attribute based on the currently selected year
    let extent =d3.extent(Object.values(facts.att));    

    // Set the selected color scale based on the #color-scale-select dropdown value
    let selectedColor = 'interpolateWarm';
    selectedColor = d3['interpolateWarm'];
    let colorScale = d3.scaleSequential(selectedColor)
    .domain(extent);



    // Draw the map
    
    let g = mapSvg.append('g');
    let map = g.append("g")
    map.selectAll('.stateMap')
          .data(mapData.features)
          .enter()
          .append('path')
            .attr('d',geoPath)
            .classed('stateMap',true)
            .attr("stroke-width" , '1px')
            .attr('id', d => `${d.properties.name}_state`.replaceAll(' ','_'))
            .attr('fill' , function(d){ 
                if(facts.att[d.properties.name] === undefined){
                    return 'white' }
                else{
                    return colorScale(facts.att[d.properties.name]) } 
                })
            .on('mouseover', function(d,i) {
                d3.select(this).attr("stroke-width" , '4px')
                d3.select('#tooltip').style("opacity", 1)
            })           
            .on('mousemove', function(d,i) {
                d3.select("#tooltip").style("opacity", 1)
                .html("State: " + d.properties.name+  "<br/>" + attribute +": " +facts.att[d.properties.name] )
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
            })
            .on('mouseout', function(d,i) {
               d3.select(this).attr("stroke-width" , '1px')
               d3.select('#tooltip').style("opacity", 0)
            })
            .on('click', function(d,i) {
                drawbarChart(map, d.properties.name , stateData , attribute , d , geoPath)
                d3.select('#tooltip').style("opacity", 0)
                
            })
        
    var zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', function() {
                g.selectAll('path')
                .attr('transform', d3.event.transform);
            });
    map.call(zoom);
   
    // draw the map color key
    drawColorScale(g, attribute, colorScale);
    
}

// This function will draw the color legend below the map
function drawColorScale(g, attribute, colorScale) {
    d3.selectAll('div#wrapper svg#map g text').remove()
    d3.selectAll('div#wrapper svg#map g g.colorLegend').remove() 
    d3.selectAll('div#wrapper svg#map g defs').remove()         
    const linearGradient = g.append("defs")
                            .append("linearGradient")
                            .attr("id", "linear-gradient");
    linearGradient.selectAll("stop")
                  .data(colorScale.ticks()
                  .map((t, i, n) => ({ 
                    offset: `${100*i/n.length}%`, 
                    color: colorScale(t) })))
                  .enter()
                    .append("stop")
                    .attr("offset", d => d.offset)
                    .attr("stop-color", d => d.color);
    g.append("rect")
     .attr('transform', `translate(100,520)`)
     .attr("width", 400)
     .attr("height", 20)
     .style("fill", "url(#linear-gradient)");
    const colorAxis = d3.axisBottom(d3.scaleLinear()
                        .domain(colorScale.domain())
                        .range([0,400]))
                        .ticks(5).tickSize(-20);
    g.append('g').call(colorAxis)
     .attr('class','colorLegend')
     .attr('transform','translate(100,540)')
     .selectAll('text')
     .style('text-anchor','end')
     .attr('dx','-10px')
     .attr('dy', '0px')
     .attr('transform','rotate(-45)');
    g.append('text')
     .attr('x',100)
     .attr('y',510)
     .style('font-size','.9em')
     .text(attribute);
     
}

// Draw the bar chart in the #barchart svg using 
// the provided state (e.g., `Arizona')
function drawbarChart(map, state , dataset , attribute , d , geoPath) {

    var x, y, k;

    var width = 300, height = 200;
    var margin = {top: 20, right: 20, bottom: 30, left: 100}

    if (d && centered !== d) {
      centered = d;
      d3.select("#bar") .style("left", (d3.event.pageX + 10) + "px")
      .style("top", (d3.event.pageY - 15) + "px").style("opacity", 1);
    } else {
      centered = null;
      d3.select("#bar").style("left", "1000px")
      .style("top", (100) + "px").style("opacity", 0);
    }
  

   d3.select('#bar').attr('width' , '20px').attr('height' , '20px').style('border-radius' , '50%')
   barSvg.attr('width' , '20px').attr('height' , '20px')

   d3.select('#bar').transition().duration(1200).style('border-radius' , '0%')
   barSvg.transition().duration(1200)
              .attr('width', '350px').attr('height', '350px').style('border-radius' , '5px');


    map.selectAll("g path")
        .classed("active", centered && function(d) { return d === centered; })
        
        
  
    map.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");


    d3.select("div#wrapper svg#barchart g").remove();
    let data = dataset;
    attributesList = ["Miscellaneous.Percent Female","Ethnicities.White Alone","Ethnicities.Black Alone","Ethnicities.American Indian and Alaska Native Alone","Ethnicities.Asian Alone","Ethnicities.Native Hawaiian and Other Pacific Islander Alone","Ethnicities.Two or More Races","Ethnicities.Hispanic or Latino","Ethnicities.White Alone, not Hispanic or Latino"];
    // //filter data for selected state
    let stateData = data.filter( d => d["State"] == state);

    dataSet = []
    for (i in attributesList)
    {
      dataSet.push({name:attributesList[i] , values:parseInt(stateData[0][attributesList[i]]) })

    }

    let bar = barSvg
  .append("g")
    .attr("transform", 
    "translate(" + margin.left + "," + margin.top + ")");
    
    var x = d3.scaleBand()
    .range([0, width-80])
    .padding(0.1);
    var y = d3.scaleLinear()
    .range([height, 0]);

     // Scale the range of the data in the domains
  x.domain(dataSet.map(function(d) { return d.name; }));
  y.domain([0, d3.max(dataSet, function(d) { return d.values; })]);


  // append the rectangles for the bar chart
  bar.selectAll(".bar")
      .data(dataSet)
    .enter().append("rect")
      .attr("class", "bar")
      .attr('fill' , 'rgb(110, 64, 170)')
      .attr("x", function(d) { return x(d.name); })
      .attr("width", x.bandwidth())
      .attr("y",  d => { return height; })
      .attr("height", 0)
          .transition()
          .duration(750)
          .delay(function (d, i) {
              return i * 150;
          })
      .attr("y", function(d) { return y(d.values); })
      .attr("height", function(d) {  return height - y(d.values); });

      // add the x Axis
  bar.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x)).selectAll("text")
  .attr("transform", "translate(-10,0)rotate(-45)")
  .style("text-anchor", "end");;

// add the y Axis
bar.append("g")
  .call(d3.axisLeft(y));

  console.log("asaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  //add button for closing popup
  ract = bar.append("g")
  ract
  .append("rect")
  .attr("x", width-60)
  .attr('height' , 12)
  .attr('width' , 12)
  .attr("y", -10)
ract
  .append("text")
      .attr("x", width - 59)
      .attr("y", 0)
      .attr("fill" , 'white')
      .text('x')
      .style('cursor' , 'pointer')
      .on('click' , function(){d3.select("#bar").style("left", "1000px")
      .style("top", (100) + "px").style("opacity", 0);})

}