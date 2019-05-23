import React, {useEffect,useState} from 'react';
import ObjectChart from "./ObjectChart";
import {TransmissionLayout, RectangularLayout, Tree} from 'figtree';
import { FigTree, CircleBauble } from 'figtree';
import {select} from 'd3-selection';
import ReactFauxDom from "react-faux-dom";

function FauxPhyloChart(props){
    const [figtree,setFigtree] = useState(null);

useEffect(()=>{
    const  svg = new ReactFauxDom.Element("svg")
        select(svg)
        .attr('width', props.chartGeom.width )
        .attr('height', props.chartGeom.height )
        const layout = new TransmissionLayout(props.phylogeny);
            
        const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":10,"right":50};
        const fig = new FigTree(svg,layout,margins, { hoverBorder: 4, backgroundBorder:2,
            baubles: [
                new CircleBauble(),
            ],
            transitionDuration:300,
            width:props.chartGeom.width ,
            height:props.chartGeom.height 
        });
        fig.draw();
        fig.hilightInternalNodes();
        fig.hilightExternalNodes();
        fig.hilightBranches();
        // fig.onHoverBranch({enter:d=>console.log(d),exit:d=>console.log("left")});
        select(svg).select(".axes-layer").remove();
        setFigtree(fig);
},[]);
        useEffect(()=>{
            if(figtree!==null){
            figtree.update();
            setFigtree(figtree);
            }
        },[props.chartGeom,props.phylogeny])

        
        if(figtree===null){
            return null;
        }else{
            return(figtree.svg.toReact());
        }
    
};
export default FauxPhyloChart;