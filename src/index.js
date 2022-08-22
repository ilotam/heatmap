const d3 = require('d3');
const dscc = require('@google/dscc');
const local = require('./localMessage.js');

// change this to 'true' for local development
// change this to 'false' before deploying
export const LOCAL = false;

function split_at_index_first(value, index)
{
 return value.substring(0, index);
}
function split_at_index_last(value, index)
{
 return value.substring(index);
}
function getSize(numberofFields){
   return 390/(numberofFields);
}

String.prototype.removeCharAt = function (i) {
    var tmp = this.split(''); // convert to an array
    tmp.splice(i - 1 , 1); // remove 1 element from the array (adjusting for non-zero-indexed counts)
    return tmp.join(''); // reconstruct the string
}

// parse the style value
const styleVal = (message, styleId) => {
    if (typeof message.style[styleId].defaultValue === "object") {
      return message.style[styleId].value.color !== undefined
        ? message.style[styleId].value.color
        : message.style[styleId].defaultValue.color;
    }
    return message.style[styleId].value !== undefined
      ? message.style[styleId].value
      : message.style[styleId].defaultValue;
};

const drawViz = message => {

    if (document.querySelector("svg")) {
        let oldSvg = document.querySelector("svg");
        oldSvg.parentNode.removeChild(oldSvg);
      }
    
    //Make an SVG Container
    const svgContainer = d3.select("body").append("svg")
                                     .attr("width", 410)
                                     .attr("height", 410);
                                
    var tblList = message.tables.DEFAULT;
    var dateTable = new Array();
    var uniquedateTable = new Array();
    var hourTable = new Array();
    var uniquehourTable = new Array();
    var valueTable = new Array();
    var goodvalueTable = new Array();
    var combinedTable = new Array();
    var notSortedCombinedTable = new Array();
    var numberofFields =0;
    var rangeFrom= styleVal(message, "colorFrom");
    var rangeTo = styleVal(message, "colorTo");
    var helper= 0;
    var properDate;

    tblList.forEach(function(row) {

        properDate = (split_at_index_first(row["dimension"][0], 19))
                .removeCharAt(5).removeCharAt(7).removeCharAt(9).removeCharAt(11).removeCharAt(13);
        dateTable.push( split_at_index_first(properDate, 8));
        hourTable.push( split_at_index_first(split_at_index_last( properDate, 8),2));
        valueTable.push( row["metric"][0]);
        combinedTable.push(properDate);
        notSortedCombinedTable.push(properDate);
        numberofFields++;
    });

    uniquedateTable.push(dateTable[0]);
    for (var i = 0; i < dateTable.length; i++) {
        var exsists=0;
        for(var j = 0; j < uniquedateTable.length;j++){
           
            if(dateTable[i] == uniquedateTable[j]){
                exsists = 1;
            }
        }
        if(exsists == 0){
            uniquedateTable.push(dateTable[i]);
            exsists=0;
        }
    }

    uniquehourTable.push(hourTable[0]);
    for (var i = 0; i < hourTable.length; i++) {
        var exsists=0;
        for(var j = 0; j < uniquehourTable.length;j++){
           
            if(hourTable[i] == uniquehourTable[j]){
                exsists = 1;
            }
        }
        if(exsists == 0){
            uniquehourTable.push(hourTable[i]);
            exsists=0;
        }
    }

    var color = d3.scaleLinear()
    .domain([valueTable[valueTable.length-1], valueTable[0]])
    .range([rangeFrom, rangeTo]);

    for(var i = 1; i < uniquedateTable.length; i++){
       if(parseInt(uniquedateTable[i]) < parseInt(uniquedateTable[i-1])){
           helper = uniquedateTable[i-1]; 
           uniquedateTable[i-1] = uniquedateTable[i];
           uniquedateTable[i] = helper;
           i = 0;
       }
    }
    console.log(uniquedateTable);

    for(var i = 1; i < uniquehourTable.length; i++){
      
        if(parseInt(uniquehourTable[i]) < parseInt(uniquehourTable[i-1])){
            
            helper = uniquehourTable[i-1];
  
            uniquehourTable[i-1] = uniquehourTable[i];
            uniquehourTable[i] = helper;
            i = 0;
        }
    }

    for(var i = 1; i < combinedTable.length; i++){
        
        if(parseInt(combinedTable[i]) < parseInt(combinedTable[i-1])){
            
            helper = combinedTable[i-1];

            combinedTable[i-1] = combinedTable[i];
            combinedTable[i] = helper;
            i = 0;
        }
    }

    for(var i = 0; i < combinedTable.length; i++){
        for(var j = 0; j < notSortedCombinedTable.length; j++){
            if(notSortedCombinedTable[j] == combinedTable[i]){
                goodvalueTable.push(valueTable[j]);
            }
        }
    }

    var valueCount = 0;                    
    for(var i = 0; i < uniquedateTable.length;i++){
        
        for(var j = 0; j < uniquehourTable.length; j++){

            if(valueCount < numberofFields){
            
            svgContainer
            .data(valueTable)
            .append("rect")
            .attr("x", 20 + i*getSize(uniquedateTable.length >= uniquehourTable.length ? uniquedateTable.length : uniquehourTable.length))
            .attr("y", 20 + j*getSize(uniquedateTable.length >= uniquehourTable.length ? uniquedateTable.length : uniquehourTable.length))
            .attr("width", getSize(uniquedateTable.length >= uniquehourTable.length ? uniquedateTable.length : uniquehourTable.length)-5)
            .attr("height", getSize(uniquedateTable.length >= uniquehourTable.length ? uniquedateTable.length : uniquehourTable.length)-5)
            .style('fill', color(goodvalueTable[valueCount]))
            valueCount++;
            }

        }
    }
    if(styleVal(message, "showLabels")){
    
        for(var i = 0; i <(uniquedateTable.length);i++){
            svgContainer.append("text")
                    .attr("x",20 + i*getSize(uniquedateTable.length))
                    .attr("y",10)
                    .attr("font-family",styleVal(message, "fontFamily"))
                    .attr("font-size",10)
                    .attr("text-anchor", "right") 
                    .style("color", "black")      
                    .text(split_at_index_last( uniquedateTable[i], 6));
        }


        for(var i = 0; i < uniquehourTable.length;i++){
        svgContainer.append("text")
                    .attr("x",2)
                    .attr("y",27 + i*getSize(uniquedateTable.length))
                    .attr("font-family",styleVal(message, "fontFamily"))
                    .attr("font-size",10)
                    .attr("text-anchor", "right") 
                    .style("color", "black")      
                    .text(uniquehourTable[i]);
        }
    }

    d3.select("text").raise();
};
// renders locally
if (LOCAL) {
  drawViz(local.message);
} else {
  dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
}