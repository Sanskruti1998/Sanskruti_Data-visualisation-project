var mapSvg;
var mapData, csvData, centered , IslandText;

// This will run when the page loads
document.addEventListener('DOMContentLoaded', () => {
    mapSvg = d3.select('#map');

    // C:\xampp\htdocs\interactive choropleth\data\VisualDon donne╠ües One Piece  - Feuille 1.csv
    // Load both files before doing anything else
    Promise.all([d3.json('data/MapOnePieceFinale.geojson'),
                 d3.csv('data/data.csv')])
                 .then(function(values){

        
        mapData = values[0];
        csvData = values[1];

        d3.select('#tooltip').style("opacity", 0)
        
        drawMap();
       
    });
});

// Draw the map in the #map svg
function drawMap() {
    

    var  num;

    d3.select("div#wrapper svg#map g").remove();
    // create the map projection and geoPath
    let Projection = d3.geoMercator()
                          .fitSize([+mapSvg.style('width').replace('px',''),
                                    +mapSvg.style('height').replace('px','')], 
                                    mapData);
    let geoPath = d3.geoPath()
                    .projection(Projection);

    //on spacebar click
    document.body.onkeyup = function(e){
                        if(e.keyCode == 32){
                            if(mapData.features[num].properties.id == 200000000){  num = 0}
                            num = num+1
                            drawCircles(map, (mapData.features[num]) , geoPath)
                       

                        }
                    }
    
        var groupedData = d3.nest()
        .key(function (d) { return d.No; })
        .entries(csvData);

        IslandText = {}
        groupedData.forEach(element => {
        tooltipText =  ""
        element.values.forEach(d =>{
        tooltipText = tooltipText  +"Villages: "+d.Villages+ "\n" + "Iles: " + d.Iles +"\n"+ "Description: " + d.Description+"\n"
        })
        IslandText[element.key] = tooltipText
        });

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
            .attr('id', d => `${d.properties.id}`)
            .attr('fill' , 'white')
            .on('mouseover', function(d,i) {
                
                d3.select(this).attr("stroke-width" , '4px')
                d3.select('#tooltip').style("opacity", 1)
            })           
            .on('mousemove', function(d,i) {
                
                d3.select("#tooltip").style("opacity", 1)
                .html("Id:" + d.properties.id + "\n" +IslandText[d.properties.id] )
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
            })
            .on('mouseout', function(d,i) {
               d3.select(this).attr("stroke-width" , '1px')
               d3.select('#tooltip').style("opacity", 0)
            })
            .on('click', function(d,i) {
                mapData.features.forEach(function (element , i){
                    if(element == d){
                        num = i +1 }
                    
                    
                });

                drawCircles(map,d , geoPath)
            })

            
        
 
    
}

// Draw the line chart in the #linechart svg using 
// the provided state (e.g., `Arizona')
function drawCircles(map , d , geoPath) {

    d3.selectAll('#map g g circle').remove();

    var x, y, k;


    var centroid = geoPath.centroid(d);

    //move circle to the selected point
            map.append('circle').attr('cx', centroid[0])
            .attr('cy', centroid[1])
            .attr('r', 5).attr('fill' , 'red');

    var width = 800, height = 400;
    if (d && centered !== d) {
      
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    d3.select("#tooltip").style("opacity", 1)
    .html("Id:" + d.properties.id + "\n" +IslandText[d.properties.id] )
    .style("left", (centroid[0]-100) + "px")
    .style("top", (centroid[1]) + "px");
  
    map.selectAll("g path")
    .classed("active", centered && function(d) { return d === centered; })
    
    

map.transition()
    .duration(750)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

    
 
}