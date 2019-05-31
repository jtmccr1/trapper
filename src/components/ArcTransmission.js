import React, {useState,useCallback} from 'react';
import ObjectChart from "./ObjectChart";
import {ArcLayout,CircleBauble}  from '../lib/figtree.js/index.js';
import { FigTree }  from '../lib/figtree.js/index.js';
import {scaleTime,scaleLinear} from "d3-scale";
import {select,selectAll} from 'd3-selection';
import {extent} from 'd3-array';
import {event} from 'd3';

const mouseEnter = (d, i, n)=>{
    const allAreas = selectAll(n);

    allAreas.filter((d2,i2,n2)=>n2[i2]!==n[i]).classed("not-hovered", true);
    select(n[i]).classed("hovered", true);


    let tooltip = document.getElementById("tooltip");
    // put text to display here!
    tooltip.innerHTML = "Whoop!";

    tooltip.style.display = "block";
    tooltip.style.left =event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
    tooltip.style.visibility ="visible";
};
const mouseExit = (d,i,n) => {
        selectAll(n).classed("not-hovered", false);
        select(n[i]).classed("hovered", false);

        const tooltip = document.getElementById("tooltip");
        tooltip.style.visibility = "hidden";
    };


const callback = {enter:mouseEnter,exit:mouseExit};
function ArcTransmission(props){
    const [figtree,setFigtree]=useState(null);
    const xScale = scaleTime().domain(extent(props.dateRange)).range([0,1]); // pass in date domain
    const xfunc=(n,i)=>n.id==="UnsampledrootCase"? xScale(props.treeDateRange[0]):xScale(n.symptomOnset) // for setting the x postion;

    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layout = new ArcLayout(props.graph,{xFunction:xfunc,curve:props.curve});
                const settings = { hoverBorder: 4, backgroundBorder:2,
                    baubles: [
                        new CircleBauble(),
                    ],
                    transitionDuration:300
                };
                const fig = new FigTree(node,layout,props.margins,settings);
            fig.draw();
            
            fig.onClickNode();
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