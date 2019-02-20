import React, { Component } from 'react';
import * as d3 from 'd3v4';
import { Tree,FigTree } from 'figtree';
import "../styles/figtree.css"


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
  
  drawTree(){
    const newickString =
        '(((((PHR-11:0.03236280479,(PHR-22:0.008236101579,(((PHR-79:0.09970215552,(PHR-71:0.02120821118,(PHR-101:0.04747487223,PHR-89:0.009261834107):0.03852037683):0.06128621314):0.001244658933,(((PHR-54:0.008805791998,PHR-103:0.09916573887):0.002705630442,PHR-77:0.06458448038):0.006109479933,PHR-74:0.06328553103):0.03139587348):0.002275032948,(PHR-66:0.03523565429,((PHR-87:0.02258668516,(PHR-95:0.03006351486,(PHR-92:0.04099019331,(PHR-93:0.06477644633,PHR-85:0.008236101579):0.01326142929):0.009683977933):0.002980802704):0.005227057014,PHR-91:0.04069872976):0.02694059911):0.04392146615):0.033497181):0.0405510981):0.05200148924,(((PHR-25:0.02433305884,(PHR-51:0.07593645367,(PHR-46:0.01175947281,((PHR-83:0.06707299285,PHR-94:0.1248427658):0.01070295691,PHR-78:0.07394005238):0.01644902396):0.02912013058):0.03260396316):0.04595046843,(PHR-28:0.008236101579,PHR-47:0.06993831091):0.07149750284):0.01876794677,((((PHR-39:0.008236101579,PHR-75:0.1076351731):0.01607604729,(PHR-40:0.008236101579,PHR-67:0.08906043753):0.0197029808):0.04659412365,((PHR-42:0.04274494207,PHR-27:0.008236101579):0.02816450657,PHR-30:0.03749420509):0.01937046352):0.009620299824,(PHR-36:0.02966014547,PHR-60:0.1037284259):0.04391960548):0.03254082854):0.01382520097):0.01271513282,(PHR-3:0.008236101579,(PHR-33:0.03325577041,PHR-17:0.008236101579):0.03774037732):0.06503142325):0.001364633079,((PHR-9:0.0134425289,PHR-43:0.05331633086):0.07083855593,(PHR-20:0.04891541355,((PHR-15:0.008236101579,(PHR-57:0.02184174527,PHR-98:0.1144693646):0.07736337652):0.01278006673,PHR-44:0.0627930271):0.02658698986):0.03923911746):0.02317549298):0.0109561646,PHR-6:0.08358612741);'
    const tree = Tree.parseNewick(newickString);
    const treeSVG = document.getElementById(this.props.svgId);
    const figTree = new FigTree(treeSVG, tree, { top: 10, bottom: 60, left: 10, right: 50}, { nodeRadius: 4 });
    d3.select(treeSVG).selectAll(".internal-node").attr("display","none")
    // tree.annotateTips({
    //     "virus1": { host: "camel" },
    //     "virus2": { host: "camel" },
    //     "virus3": { host: "human" },
    //     "virus4": { host: "human" },
    //     "virus5": { host: "bat" },
    //     "virus6": { host: "bat" },
    //     "virus7": { host: "bat" },
    //     "virus8": { host: "bat" },
    //     "virus9": { host: "whale" },
    //     "virus10": { host: "whale" }
    // });
    // figTree.setNodeLabels("probability");
    // figTree.addLabels('.external-node', FigTree.nodeInfo);
    // figTree.addToolTip('.node', FigTree.nodeInfo);
    
    // figTree.onClickBranch(FigTree.reroot);
    figTree.hilightInternalNodes();
    figTree.onClickNode(FigTree.rotate);
    // tree.annotateNodesFromTips("host");
    figTree.update();
  
  }




  render() {
    return (
          <svg id={this.props.svgId} width={this.props.width} height={this.props.height} />
    );
  }
}

export default FigTreeComponent;
