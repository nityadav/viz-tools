// ================= sample data =============== //
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
// ================= functions =============== //
// submit a sentence
function submitSentence() {
  sentence = [];
  var text = document.getElementById("sentInput").value;
  var spans = text.trim().split(" ");
  for (let i = 0; i < spans.length; i++) {
    sentence.push({"span":spans[i],"className":"token",children:[]});
  }
  // redraw everything
  var nodesList = [];
  var fullWidth = computeCoords(sentence, [], 0, 0, nodesList);
  d3.select("#taggingarea").remove();
  renderAgain(nodesList);
}

// Get the width of the rectangle that will contain the #multiTree.
// Also update the #xpos, #ypos and #width of each node.
function computeCoords(multiTree, path, startCoord, level, nodesList) {
  var totalWidth = 0;
  for (let i = 0; i < multiTree.length; i++) {
    var currNode = {};
    currNode.span = multiTree[i].span;
    currNode.className = multiTree[i].className;
    currNode.path = path.slice();
    currNode.path.push(i);
    currNode.ypos = level*(rectHeight + levelGap);
    currNode.xpos = startCoord + totalWidth;
    var currChildren = multiTree[i].children;
    if (currChildren.length == 0) {
      // this means we need to compute the width here
      currNode.width = Math.max(getBoxLength(currNode.span), getBoxLength(currNode.className));
    } else {
      // this means we need to compute the coords from the children
      currNode.width = computeCoords(currChildren, currNode.path, currNode.xpos, level + 1, nodesList) - (2*collapseButtonWidth);
    }
    totalWidth = totalWidth + currNode.width + wordGap + (2*collapseButtonWidth);
    nodesList.push(currNode);
  }
  return totalWidth - wordGap;
}

// Get the length of a box enclosing a string
function getBoxLength(str) {
  return str.length*10;
}

function getNodeObject(multiTree, path) {
  var pointer = multiTree;
  for (let i = 0; i < path.length; i++) {
    var index = path[i];
    if ((index < 0) || (index > pointer.length)) { // if index is not valid
      return null; // only exit if path is bad
    }
    if (i == path.length - 1) { // if last element in the path
      return pointer[index];
    }
    pointer = pointer[index].children;
  }
  // if path is empty list
  return pointer;
}

// merge node2 in node1 and remove node2
function mergeNodes(node1, node2, parent, parentSpan, parentLabel) {
  // if one of the nodes has children or one of them is tagged
  if ((node1.children.length > 0) || (node2.children.length > 0) || (node1.className !== "token") || (node2.className !== "token")) {
    // if any node does not have children then make it its own children
    if (node1.children.length == 0) {
      let newKid = {}
      newKid.span = node1.span;
      newKid.className = node1.className;
      newKid.children = [];
      node1.children.push(newKid);
    }
    if (node2.children.length == 0) {
      let newKid = {}
      newKid.span = node2.span;
      newKid.className = node2.className;
      newKid.children = [];
      node2.children.push(newKid);
    }
    // add children of node2 to node1
    node1.children = node1.children.concat(node2.children);
  }
  // adding node2's data to node1
  node1.span = node1.span + " " + node2.span;
  node1.className = "token";
  // remove node2
  let index = parent.indexOf(node2);
  if (index > -1) {
    parent.splice(index,1);
  }
  // if as a result of merge node1 is same as its parent, then the one without the tag is taken away.
  if (parentSpan) { // parentSpan is null when it is root
    if (parentSpan === node1.span) {
      // copy node1's children to the parent
      for (let i = 0; i < node1.children.length; i++) {
        parent.push(node1.children[i]);
      }
      // remove the node1 which is the 0th child of parent
      parent.splice(0,1);
    }
  }
}

// starting the dragging of a node. All other events must stop for this node until dropped.
function startDrag(d) {
  xDisplacement = 0;
}

// when a rectangle is getting dragged move its text and rectangle
function dragRect(d) {
  d.xpos += d3.event.dx;
  xDisplacement += d3.event.dx;
  var group = d3.select(this); // the group is selected because dragListener is defined for it
  group.attr("transform", "translate(" + d.xpos + "," + d.ypos + ")");
}

// when rectangle gets dropped change the data and render again
function dropRect(d) {
  if (Math.abs(xDisplacement) > wordGap) {
    var sibPath = d.path.slice();
    var parent = getNodeObject(sentence, d.path.slice(0,-1));
    var parentSpan = null;
    var parentLabel = null;
    if (d.path.length > 1) {
      // this is needed for mergeNodes action as the root level doesn't have the children attribute
      parentSpan = parent.span;
      parentLabel = parent.className;
      parent = parent.children;
    }
    var curr = getNodeObject(sentence, d.path);
    if (xDisplacement < 0) { // merge with left sibling
      sibPath[d.path.length - 1] -= 1;
      var sibling = getNodeObject(sentence, sibPath);
      if (sibling) {
        mergeNodes(sibling, curr, parent, parentSpan, parentLabel);
        // since merge has happened, redraw everything
        var nodesList = [];
        var fullWidth = computeCoords(sentence, [], 0, 0, nodesList);
        d3.select("#taggingarea").remove();
        renderAgain(nodesList);
        return;
      }
    } else { // merge with right sibling
      sibPath[d.path.length - 1] += 1;
      var sibling = getNodeObject(sentence, sibPath);
      if (sibling) {
        mergeNodes(curr, sibling, parent, parentSpan, parentLabel);
        // since merge has happened, redraw everything
        var nodesList = [];
        var fullWidth = computeCoords(sentence, [], 0, 0, nodesList);
        d3.select("#taggingarea").remove();
        renderAgain(nodesList);
        return;
      }
    }
  }
  // make the node go back to its original position;
  d.xpos -= xDisplacement;
  var group = d3.select(this);
  group.attr("transform", "translate(" + d.xpos + "," + d.ypos + ")");
  xDisplacement = 0; // this is global variable to record node's displacement. So make it zero when dragging ends
}

function showLabels(d) {
  console.log("show labels");
  var fobj = d3.select("#" + "fo" + d.path.join("_"));
  var selectionbox = fobj.select("select");
  selectionbox.append("option").attr("value",0).text("--");
  for (let i = 0; i < tagValues.length; i++) {
    selectionbox.append("option").attr("value",i+1).text(tagValues[i]);
  }
  fobj.style("display","block");
  nodeDataForTagging = d;
}

function afterLabelSelected() {
  console.log("label selected");
  var fobj = d3.select("#" + "fo" + nodeDataForTagging.path.join("_"));
  var selectionbox = fobj.select("select");
  var selectedOption = selectionbox.options[selectionbox.selectedIndex];
  if (typeof selectedOption !== "undefined"){
    console.log(selectedOption.value);
    // find the element in the sentence for which we have a tag value
    //d3.select("#foreignObj").remove();
  }
}

function breakBelow(d) {
  var node = getNodeObject(sentence, d.path);
  // collapse when there are children present.
  // break at the below level when no children
  if (node.children.length > 0) {
    node.children = [];
  } else {
    var newSpans = node.span.split(" ");
    if (newSpans.length == 1) {
      // if can't split do nothing
      return;
    }
    for (let i = 0; i < newSpans.length; i++) {
      node.children.push({"span":newSpans[i],"className":"token",children:[]});
    }
  }
  // redraw everything
  var nodesList = [];
  var fullWidth = computeCoords(sentence, [], 0, 0, nodesList);
  d3.select("#taggingarea").remove();
  renderAgain(nodesList);
}

function breakAtLevel(d) {
  // get the required references to the tree objects
  var node = getNodeObject(sentence, d.path);
  var nodeIndex = d.path[d.path.length - 1];
  var nodeContainer = getNodeObject(sentence, d.path.slice(0,-1));
  if (d.path.length > 1) {
    nodeContainer = nodeContainer.children;
  }

  // collapse when there are children present.
  // break at the same level when no children
  if (node.children.length > 0) {
    node.children = [];
  } else {
    var newSpans = node.span.split(" ");
    if (newSpans.length == 1) {
      // if can't split do nothing
      return;
    }
    nodeContainer.splice(nodeIndex, 1);
    for (let i = 0; i < newSpans.length; i++) {
      nodeContainer.splice(nodeIndex + i, 0, {"span":newSpans[i],"className":"token",children:[]});
    }
  }
  // redraw everything
  var nodesList = [];
  var fullWidth = computeCoords(sentence, [], 0, 0, nodesList);
  d3.select("#taggingarea").remove();
  renderAgain(nodesList);
}

// drag listener for complete node
dragListener = d3.behavior.drag()
  .on("dragstart", startDrag)
  .on("drag", dragRect)
  .on("dragend", dropRect);

function renderAgain(nodesList) {

  var mainGroup = svg.append("g")
    .attr("id","taggingarea")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // create a svg group for each node
  var nodeGroup = mainGroup.selectAll("g.treenode")
      .data(nodesList)
      .enter()
      .append("g")
      .attr("class", "treenode")
      .attr("transform", function(d) {return "translate(" + d.xpos + "," + d.ypos + ")";})
      .call(dragListener);

  // put button for same level break
  nodeGroup.append("rect")
     .attr("width", collapseButtonWidth)
     .attr("height", rectHeight)
     .attr("fill", "blue")
     .on("click", breakAtLevel);

  // put rectangle for showing span
  nodeGroup.append("rect")
     .attr("width", function(d) {return d.width;})
     .attr("height", rectHeight)
     .attr("transform", function(d) {return "translate(" + collapseButtonWidth + "," + 0 + ")";})
     .attr("fill", "teal");

  // put button for bottom level break
  nodeGroup.append("rect")
     .attr("width", collapseButtonWidth)
     .attr("height", rectHeight)
     .attr("transform", function(d) {return "translate(" + (d.width + collapseButtonWidth) + "," + 0 + ")";})
     .attr("fill", "blue")
     .on("click", breakBelow);

  // put text in each group
  nodeGroup.append("text")
    .text(function(d) {return d.span;})
    .attr("text-anchor", "middle")
    .attr("transform", function(d) {return "translate(" + (d.width/2 + collapseButtonWidth) + "," + 13 + ")";})
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr('pointer-events', 'none') // this is to prevent text selection event while dragging a rectangle
    .attr("fill", "white");

  // svg group for labels
  var labelGroup = nodeGroup.append("g")
    .attr("class", "className")
    .attr("transform", function(d) {return "translate(" + 0 + "," + (rectHeight + labelGap) + ")";});

  // rectangle for the label
  labelGroup.append("rect")
    .attr("width", function(d) {return 2*collapseButtonWidth + d.width;})
    .attr("height", rectHeight)
    .attr("fill", "black")
    .on("click", showLabels);

  // foreignObject for the dropdown for choosing label
  var fo = labelGroup.append('foreignObject')
    .attr("id", function(d) {return "fo" + d.path.join("_");})
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", function(d) {return 2*collapseButtonWidth + d.width;})
    .attr("height", rectHeight)
    .attr("class", "hidden")
    .append("xhtml:select")
    .attr("id", function(d) {return "sel" + d.path.join("_");})
    .attr("onchange", "afterLabelSelected()")
    .attr("width", function(d) {return 2*collapseButtonWidth + d.width;});

  // label text
  labelGroup.append("text")
    .text(function(d) {return d.className;})
    .attr("text-anchor", "middle")
    .attr("transform", function(d) {return "translate(" + (d.width/2 + collapseButtonWidth) + "," + 13 + ")";})
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("fill", "white")
    .attr('pointer-events', 'none') // this is to prevent text selection event;
}
// ================= script =============== //
var sentence = [];
var tagValues = ["tag1", "tag2"];
var nodeDataForTagging = null;

var margin = {top: 20, right: 20, bottom: 20, left: 20};
//var width = 1060 - margin.right - margin.left,
//var height = 500 - margin.top - margin.bottom;

var width = (window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth) - 100 - margin.right - margin.left;

var height = (window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight) - 100 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

var rectHeight = 20;
var levelGap = 40;
var labelGap = 5;
var wordGap = 10;
var collapseButtonWidth = 10;

// for detecting merge condition
var xDisplacement = 0;

// this draws the tree for once in the beginning if sentence is available
var nodesList = [];
var fullWidth = computeCoords(sentence, [], 0, 0, nodesList);
renderAgain(nodesList);