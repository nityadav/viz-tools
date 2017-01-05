var sentence_example = [
   {
      "span":"Can I get a reservation for 8:30 p.m. after the game ?",
      "className":"token",
      "children":[
         {
            "span":"Can",
            "className":"token",
            "children":[

            ]
         },
         {
            "span":"I",
            "className":"token",
            "children":[

            ]
         },
         {
            "span":"get a reservation for 8:30 p.m. after the game",
            "className":"token",
            "children":[
               {
                  "span":"get",
                  "className":"token",
                  "children":[

                  ]
               },
               {
                  "span":"a reservation",
                  "className":"token",
                  "children":[
                     {
                        "span":"a",
                        "className":"token",
                        "children":[

                        ]
                     },
                     {
                        "span":"reservation",
                        "className":"token",
                        "children":[

                        ]
                     }
                  ]
               },
               {
                  "span":"for 8:30 p.m. after the game",
                  "className":"token",
                  "children":[
                     {
                        "span":"for",
                        "className":"token",
                        "children":[

                        ]
                     },
                     {
                        "span":"8:30 p.m. after the game",
                        "className":"T.root",
                        "children":[
                           {
                              "span":"8:30 p.m.",
                              "className":"T.value",
                              "children":[
                                 {
                                    "span":"8:30",
                                    "className":"token",
                                    "children":[

                                    ]
                                 },
                                 {
                                    "span":"p.m.",
                                    "className":"token",
                                    "children":[

                                    ]
                                 }
                              ]
                           },
                           {
                              "span":"after the game",
                              "className":"token",
                              "children":[
                                 {
                                    "span":"after",
                                    "className":"token",
                                    "children":[

                                    ]
                                 },
                                 {
                                    "span":"the game",
                                    "className":"token",
                                    "children":[
                                       {
                                          "span":"the",
                                          "className":"token",
                                          "children":[

                                          ]
                                       },
                                       {
                                          "span":"game",
                                          "className":"token",
                                          "children":[

                                          ]
                                       }
                                    ]
                                 }
                              ]
                           }
                        ]
                     }
                  ]
               }
            ]
         },
         {
            "span":"?",
            "className":"token",
            "children":[

            ]
         }
      ]
   }
];

// Find depth of the tree looking at the data
function findDepth(spansList) {
    var maxDepth = 0;
    for (var i = 0; i < spansList.length; i++) {
        var currSpan = spansList[i];
        if (("children" in currSpan) && (currSpan.children.length > 0)) {
            maxDepth = Math.max(maxDepth, findDepth(currSpan.children) + 2*circleRadius + levelVertGap);
        } else {
            maxDepth = Math.max(maxDepth, rectHeight);
        }
    }
    return maxDepth;
}

// Find width of the tree looking at the data
function findWidth(spansList) {
    var totalWidth = 0;
    for (var i = 0; i < spansList.length; i++) {
        var currSpan = spansList[i];
        if (("children" in currSpan) && (currSpan.children.length > 0)) {
            totalWidth += findWidth(currSpan.children) + levelHorzGap;
        } else {
            totalWidth += getBoxLength(currSpan.span) + levelHorzGap;
        }
    }
    return totalWidth - levelHorzGap;
}

// Get the length of a box enclosing a string
function getBoxLength(str) {
  return 5 + str.length*10;
}

// Render the full tree and return the leftMargin for the next block on right
function renderTree(spansList, leftMargin, svgContainer, treeID) {
   var svgHeight = svgContainer.attr('height');
   var originalLeftMargin;
   var treeHeight = svgHeight - margin.bottom - rectHeight;
   var childXCenters = [];
   var childHeights = [];
   var currSpan;
   for (var i = 0; i < spansList.length; i++) {
      currSpan = spansList[i];
      originalLeftMargin = leftMargin;
      if (!("children" in currSpan) || (currSpan.children.length === 0)) {
         leftMargin = renderLeaf(leftMargin, currSpan.span, svgContainer, treeID.concat([treeID[treeID.length - 1] + "_" + i]));
         childHeights.push(svgHeight - circleRadius - margin.bottom - rectHeight);
      } else {
         var subtreeDims = renderTree(currSpan.children, leftMargin, svgContainer, treeID.concat([treeID[treeID.length - 1] + "_" + i]));
         leftMargin = subtreeDims[0];
         childHeights.push(subtreeDims[1]);
         treeHeight = Math.min(treeHeight, subtreeDims[1]);
      }
      childXCenters.push((leftMargin + originalLeftMargin)/2);
      leftMargin += levelHorzGap;
   }
   // Draw the vertical lines that hang the child trees and place a circle at the bottom end
   treeHeight -= levelVertGap;
   for (i = 0; i < spansList.length; i++) {
      // the vertical line
      var vline = svgContainer.append("line")
         .attr("x1",childXCenters[i])
         .attr("y1",childHeights[i])
         .attr("x2",childXCenters[i])
         .attr("y2",treeHeight)
         .attr("stroke-width", 2)
         .attr("stroke","black")
         .attr("class",treeID.join(" "));
      // the tagging circle
      svgContainer.append("circle")
         .attr("cx",childXCenters[i])
         .attr("cy",childHeights[i] - circleRadius)
         .attr("r",circleRadius)
         .attr("id",treeID[treeID.length - 1] + "_" + i)
         .on({mouseenter: mouseEnter, mouseleave: mouseLeave});
   }
   // Draw the horizontal line
   svgContainer.append("line")
      .attr("x1",childXCenters[0])
      .attr("y1",treeHeight)
      .attr("x2",childXCenters[spansList.length - 1])
      .attr("y2",treeHeight)
      .attr("stroke-width", 2)
      .attr("stroke","black")
      .attr("class",treeID.join(" "));
   return [leftMargin - levelHorzGap, treeHeight];
}

function renderLeaf(leftMargin, word, svgContainer, treeID) {
   // Create a group for the rectangle in the leaf and its text
   nodeGroup = svgContainer.append("g")
     .attr("transform", function(d) {return "translate(" + leftMargin + "," + (svgContainer.attr('height') - margin.bottom - rectHeight) + ")";});
   // Insert a rectangle inside the group
   var boxWidth = getBoxLength(word);
   nodeGroup.append("rect")
     .attr("width", boxWidth)
     .attr("height", rectHeight)
     .attr("class",treeID.join(" "))
     .attr("stroke","black")
     .attr("stroke-width", 3)
     .attr("fill", "teal");
   // Insert text inside the group
   nodeGroup.append("text")
    .text(word)
    .attr("text-anchor", "middle")
    .attr("transform", function(d) {return "translate(" + boxWidth/2 + "," + 14 + ")";})
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr('pointer-events', 'none') // this is to prevent text selection event while dragging a rectangle
    .attr("fill", "white");
   return leftMargin + boxWidth;
}

function mouseEnter() {
    d3.selectAll("." + this.id).style("stroke","orange");
}

function mouseLeave() {
    d3.selectAll("." + this.id).style("stroke","black");
}

// ================= script =============== //
var rectHeight = 20;
var circleRadius = 5;
var levelHorzGap = 10;
var levelVertGap = 40;
var margin = {top: 20, right: 20, bottom: 20, left: 20};

var svg = d3.select("body").append("svg")
    .attr("width", findWidth(sentence_example) + margin.right + margin.left)
    .attr("height", findDepth(sentence_example) + margin.top + margin.bottom);

renderTree(sentence_example, margin.left, svg, ["_"]);