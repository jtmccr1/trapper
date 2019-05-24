import React, {useCallback,useState} from 'react';
import {stackedHistogramChart, stackedHistogramLayout} from '../lib/charts/stackedHistogram';
import {select} from "d3-selection";
function StackedHistogram(props){
    const [histogram,setHistogram]=useState(null);
    
    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layout = new stackedHistogramLayout(props.data);
                const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":50,"right":50};
                const settings = { hoverBorder: 4, backgroundBorder:0,transitionDuration:300};
                const fig = new stackedHistogramChart(node,layout,margins,settings);
                fig.draw();
                const mouseEnter = (d, i, n)=>{select(n[i]).classed("hovered", true);};
                const mouseExit = (d,i,n) => {select(n[i]).classed("hovered", false);};

                const callback = {enter:mouseEnter,exit:mouseExit};
                fig.onHover(callback)
                select(node).select(".axes-layer").select("#x-axis").remove();
                setHistogram(fig);
            }else{
                histogram.update();
            }
        }
    });
const rand_id = `b${Math.random().toString(36).substring(4)}`


        return(
            <svg className="chart" id= {rand_id}
            ref={el}
            height={props.chartGeom.height}
            width={props.chartGeom.width}
        />);

};

export default StackedHistogram;
