var sentence_example = [
   {
      "span":"I",
      "className":"token",
      "children":[

      ]
   },
   {
      "span":"want",
      "className":"token",
      "children":[

      ]
   },
   {
      "span":"to",
      "className":"token",
      "children":[

      ]
   },
   {
      "span":"buy",
      "className":"token",
      "children":[

      ]
   },
   {
      "span":"wine that goes well with lasagne",
      "className":"product",
      "children":[
         {
            "span":"wine",
            "className":"product",
            "children":[

            ]
         },
         {
            "span":"that",
            "className":"token",
            "children":[

            ]
         },
         {
            "span":"goes",
            "className":"token",
            "children":[

            ]
         },
         {
            "span":"well",
            "className":"token",
            "children":[

            ]
         },
         {
            "span":"with",
            "className":"token",
            "children":[

            ]
         },
         {
            "span":"lasagne",
            "className":"pairing_dish",
            "children":[

            ]
         }
      ]
   }
];

// Get the length of a box enclosing a string
function getBoxLength(str) {
  return str.length*10;
}

// Render the full tree and return the leftMargin for the next block on right
function renderTree(spansList, leftMargin, svgContainer) {
   var originalLeftMargin;
   var treeHeight = svgHeight - rectHeight;
   var childXCenters = [];
   var childHeights = [];
   for (var i = 0; i < spansList.length; i++) {
      currSpan = spansList[i];
      originalLeftMargin = leftMargin;
      if (currSpan.children.length == 0) {
         leftMargin = renderLeaf(leftMargin, currSpan.span, svgContainer);
         childHeights.push(svgHeight - rectHeight);
      } else {
         var subtreeDims = renderTree(currSpan.children, leftMargin, svgContainer);
         leftMargin = subtreeDims[0];
         childHeights.push(subtreeDims[1]);
         treeHeight = Math.min(treeHeight, subtreeDims[1]);
      }
      childXCenters.push((leftMargin + originalLeftMargin)/2);
      leftMargin += levelHorzGap;
   }
   // Draw the vertical lines that hang the child trees
   treeHeight -= levelVertGap;
   for (var i = 0; i < spansList.length; i++) {
      svgContainer.append("line")
         .attr("x1",childXCenters[i])
         .attr("y1",childHeights[i])
         .attr("x2",childXCenters[i])
         .attr("y2",treeHeight)
         .attr("stroke-width", 2)
         .attr("stroke", "black");
   }
   // Draw the horizontal line
   svgContainer.append("line")
      .attr("x1",childXCenters[0])
      .attr("y1",treeHeight)
      .attr("x2",childXCenters[spansList.length - 1])
      .attr("y2",treeHeight)
      .attr("stroke-width", 2)
      .attr("stroke", "black");
   return [leftMargin - levelHorzGap, treeHeight];
}

function renderLeaf(leftMargin, word, svgContainer) {
   // Create a group for the rectangle in the leaf and its text
   nodeGroup = svgContainer.append("g")
     .attr("transform", function(d) {return "translate(" + leftMargin + "," + svgHeight + ")";});
   // Insert a rectangle inside the group
   var boxWidth = getBoxLength(word);
   nodeGroup.append("rect")
     .attr("width", boxWidth)
     .attr("height", rectHeight)
     .attr("fill", "teal");
   // Insert text inside the group
   nodeGroup.append("text")
    .text(word)
    .attr("text-anchor", "middle")
    .attr("transform", function(d) {return "translate(" + boxWidth/2 + "," + 13 + ")";})
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr('pointer-events', 'none') // this is to prevent text selection event while dragging a rectangle
    .attr("fill", "white");
   return leftMargin + boxWidth;
}

// ================= script =============== //
var margin = {top: 20, right: 20, bottom: 20, left: 20};
var rectHeight = 20;
var levelHorzGap = 10;
var levelVertGap = 50;

var svgWidth = (window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth) - 100 - margin.right - margin.left;

var svgHeight = (window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight) - 100 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", svgWidth + margin.right + margin.left)
    .attr("height", svgHeight + margin.top + margin.bottom);

renderTree(sentence_example,0,svg);