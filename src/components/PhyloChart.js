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
            const layout = new RectangularLayout(props.phylogeny);
            const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":10,"right":50};
            const fig = new FigTree(node,layout,margins,        { hoverBorder: 4, backgroundBorder:2,
                baubles: [
                    new CircleBauble(),
                ]
            });
            fig.draw();
            fig.hilightInternalNodes();
            fig.hilightExternalNodes();
            fig.hilightBranches();
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