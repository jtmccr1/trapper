import React, {useCallback,useState} from 'react';
import {stackedHistogramChart} from '../lib/charts/stackedHistogram';
import {stackedHistogramLayout} from "../lib/charts/stackedHistogramLayout"
import {select} from "d3-selection";
import {scaleTime} from "d3-scale";
import {timeWeek} from "d3-time";
import {extent} from 'd3-array';

function StackedHistogram(props){
    const [histogram,setHistogram]=useState(null);
    
    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layoutSettings = {horizontalRange:extent(props.dateRange),
                                        horizontalTicks:props.dateRange,
                                        horizontalScale:scaleTime};
                const layout = new stackedHistogramLayout(props.data,layoutSettings);
                const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":50,"right":50};
                const settings = { hoverBorder: 4, backgroundBorder:0,transitionDuration:300};
                const fig = new stackedHistogramChart(node,layout,margins,settings);
                fig.draw();
                const mouseEnter = (d, i, n)=>{select(n[i]).classed("hovered", true);};
                const mouseExit = (d,i,n) => {select(n[i]).classed("hovered", false);};

                const callback = {enter:mouseEnter,exit:mouseExit};
                fig.onHover(callback)
                fig.onClick((d,i,n)=>alert(`clicked ${d.data.id}`))

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
