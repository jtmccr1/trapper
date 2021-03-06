import React, { Component } from 'react';
import * as d3 from 'd3v4';
import { Tree,FigTree,transmissionLayout,rectangularLayout }  from '../lib/figtree.js/index.js';
// import "../styles/figtree.css"


/**
 * A component that takes in a tree a fig tree settings object, and 
 * an id for the svg and draws the tree. easy peasy
 */

class FigTreeComponent extends Component {
  constructor(props) {
		super(props);

  this.drawTree = this.drawTree.bind(this);
  }
  componentDidMount() {
    this.drawTree()
  }
  componentDidUpdate(){
    const layout = this.props.transmissionLayout? transmissionLayout:rectangularLayout;
    this.state.FigTree.treeLayout = layout;    
    this.state.FigTree.update()
  }
  
  drawTree(){
    const tree = Tree.parseNewick(this.props.treeString);
    const treeSVG = document.getElementById(this.props.svgId);
    const figTree = new FigTree(treeSVG, tree, { top: 10, bottom: 60, left: 10, right: 50}, { nodeRadius: 4,   xAxisTitle: ""});
    d3.select(treeSVG).selectAll(".internal-node").attr("display","none")
    d3.select(treeSVG).selectAll(".axis").remove()

    const annotations= {};
    
    this.props.caseData.nodes.forEach(node=>{
      if(tree.nodes.map(node=>node.name).indexOf(node.id)>-1){
      annotations[node.id]={
       "Date of Sampling":node.dateOfSampling?node.dateOfSampling.toISOString().substring(0, 10):"",
       "Location":node.metaData.Location? node.metaData.Location:"",
       "Outcome":node.metaData.Outcome? node.metaData.Outcome:"",
       "dataSource":node.metaData.dataSource? node.metaData.dataSource:"",
      }
    }
    })
   
    tree.annotateTips(annotations);
    figTree.setNodeLabels();
    figTree.addToolTip('.node', FigTree.nodeInfo);
    
    figTree.onClickBranch(FigTree.reroot);
    figTree.hilightExternalNodes();
    figTree.onClickNode(FigTree.rotate);

    tree.annotateNodesFromTips("Location");
    tree.order(tree.rootNode,false)

    if(this.props.transmissionLayout){
    figTree.treeLayout = transmissionLayout;
    }







    figTree.update();

    this.setState({FigTree:figTree,Tree:tree})
  
  }




  render() {
    return (
      <div>
      <div id="tooltip"></div>

          <svg id={this.props.svgId} width={this.props.width} height={this.props.height} />
          </div>
    );
  }
}

export default FigTreeComponent;
