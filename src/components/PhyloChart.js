import React, {useCallback,useState} from 'react';
import ObjectChart from "./ObjectChart";
import {ArcLayout, RectangularLayout, Tree} from 'figtree';
import { FigTree, CircleBauble } from 'figtree';
import {select} from 'd3-selection';

function PhyloChart(props){
    const isFull = Object.values(props).every(x => (x !== null & x !== ''));
    const [figtree,setFigtree]=useState(null);
    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
            const tree = Tree.parseNewick("((A:2,B:3):1,C:5);")
            const layout = new RectangularLayout(tree);
            const margins = {"top":props.chartGeom.spaceTop,"bottom":50,"left":props.chartGeom.spaceLeft,"right":100};
            const fig = new FigTree(node,layout,margins,        { hoverBorder: 2, backgroundBorder: 2,
                baubles: [
                    new CircleBauble(),
                ]
            });
            fig.draw();
            fig.hilightInternalNodes();
            fig.onClickInternalNode();//layout.rotate());

            fig.hilightBranches();
            fig.onClickBranch(layout.reroot());
            
            select(node).select(".axes-layer").remove();
            setFigtree(fig);
        }else{
            figtree.update();
        }

        }});

    if(isFull){
        // const callbacks = {"handleMouseOver":d=>console.log(d), "handleMouseOut":d=>console.log("left")};
         return(
            <ObjectChart  chartGeom={props.chartGeom} 
                  ref={el}/>
         )}else{
                return(null)
        }

};



export default PhyloChart;