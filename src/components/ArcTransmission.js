import React, {useState,useCallback} from 'react';
import ObjectChart from "./ObjectChart";
import {ArcLayout,CircleBauble} from 'figtree';
import { FigTree } from 'figtree';
import {scaleTime} from "d3-scale";
import {select,selectAll} from 'd3-selection';
import {extent} from 'd3-array';


function ArcTransmission(props){

    const [figtree,setFigtree]=useState(null);
    const xScale = scaleTime().domain(extent(props.dateRange)).range([0,1]); // pass in date domain
    const xfunc=(n,i)=>n.id==="UnsampledrootCase"? xScale.range()[0]:xScale(n.symptomOnset) // for setting the x postion;

    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layout = new ArcLayout(props.graph,{xFunction:xfunc,curve:props.curve});
                const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":50,"right":50};
                const settings = { hoverBorder: 4, backgroundBorder:2,
                    baubles: [
                        new CircleBauble(),
                    ],
                    transitionDuration:300
                };
                const fig = new FigTree(node,layout,margins,settings);
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
const rand_id = `b${Math.random().toString(36).substring(4)}`


        return(
            <svg className="chart" id= {rand_id}
            ref={el}
            height={props.chartGeom.height}
            width={props.chartGeom.width}
        />);

};




export default ArcTransmission;