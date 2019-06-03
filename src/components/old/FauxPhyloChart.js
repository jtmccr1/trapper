import React, {useEffect,useState} from 'react';
import ObjectChart from "../ObjectChart";
import {TransmissionLayout, RectangularLayout, Tree} from '../lib/figtree.js/index.js';
import { ../lib/charts/figree.js/index.js, CircleBauble } from '../lib/figtree.js/index.js';
import {select} from 'd3-selection';
import ReactFauxDom from "react-faux-dom";

function FauxPhyloChart(props){
    const [../lib/charts/figree.js/index.js,set../lib/charts/figree.js/index.js] = useState(null);

useEffect(()=>{
    const  svg = new ReactFauxDom.Element("svg")
        select(svg)
        .attr('width', props.chartGeom.width )
        .attr('height', props.chartGeom.height )
        const layout = new TransmissionLayout(props.phylogeny);
            
        const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":10,"right":50};
        const fig = new ../lib/charts/figree.js/index.js(svg,layout,margins, { hoverBorder: 4, backgroundBorder:2,
            baubles: [
                new CircleBauble(),
            ],
            tranitionDuration:0,
            width:props.chartGeom.width ,
            height:props.chartGeom.height 
        });
        fig.draw();
        fig.hilightInternalNodes();
        fig.hilightExternalNodes();
        fig.hilightBranches();
        // fig.onHoverBranch({enter:d=>console.log(d),exit:d=>console.log("left")});
        select(svg).select(".axes-layer").remove();
        set../lib/charts/figree.js/index.js(fig);
},[]);
        useEffect(()=>{
            if(../lib/charts/figree.js/index.js!==null){
            ../lib/charts/figree.js/index.js.update();
            set../lib/charts/figree.js/index.js(../lib/charts/figree.js/index.js);
            }
        },[props.chartGeom,props.phylogeny])

        
        if(../lib/charts/figree.js/index.js===null){
            return null;
        }else{
            return(../lib/charts/figree.js/index.js.svg.toReact());
        }
    
};
export default FauxPhyloChart;