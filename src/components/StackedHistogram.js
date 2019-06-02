import React, {useCallback,useState} from 'react';
import {stackedHistogramChart} from '../lib/charts/stackedHistogram';
import {stackedHistogramLayout} from "../lib/charts/stackedHistogramLayout"
import {select} from "d3-selection";
import {scaleTime} from "d3-scale";
import {timeWeek} from "d3-time";
import {extent} from 'd3-array';
import {event,timeFormat} from 'd3';

const formatTime = timeFormat("%B %d, %Y");

const mouseEnter = (d, i, n)=>{
    select(n[i]).classed("hovered", true);
    // console.log(d)
    let tooltip = document.getElementById("tooltip");
    // put text to display here!
    tooltip.innerHTML =`Case Id: ${d.data.id}
                        <br/>
                        Location: ${d.data.location}
                        <br/>
                        Symptom onset: ${formatTime(d.data.symptomOnset)} `;

    tooltip.style.display = "block";

    // this should be dynamically set (i.e., the tooltip box should always be aligned to
    // be visible in the view port).
    tooltip.style.left = event.pageX + (event.pageX > 800? -300 : + 10) + "px";
    tooltip.style.top = event.pageY + 10 + "px";

    tooltip.style.visibility ="visible";
};

const mouseExit = (d,i,n) => {
    select(n[i]).classed("hovered", false);
    const tooltip = document.getElementById("tooltip");
    tooltip.style.visibility = "hidden";
};

const callback = {enter:mouseEnter,exit:mouseExit};

function StackedHistogram(props){
    const [histogram,setHistogram]=useState(null);

    const el = useCallback(node => {

        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layoutSettings = {
                    horizontalRange:extent(props.dateRange),
                    horizontalTicks:props.dateRange,
                    horizontalScale:scaleTime,
                    groupingFunction:d=>d.location};

                const layout = new stackedHistogramLayout(props.data,layoutSettings);
                const settings = { hoverBorder: 4, backgroundBorder:0,transitionDuration:300};
                const fig = new stackedHistogramChart(node,layout,props.margins,settings);

                fig.draw();

                fig.onHover(callback,".rect")
                fig.onClick((d,i,n)=>alert(`clicked ${d.data.id}`))
                // fig.addToolTip('.rect-layer .rect',(d,i,n)=>"Whoop here it is!")

                select(node).select(".axes-layer").select("#x-axis").remove();
                setHistogram(fig);
            } else {
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
