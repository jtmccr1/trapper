import React, {useState,useCallback,useEffect} from 'react';
import{max} from 'd3-array';
import StackedHistogram from './StackedHistogram';
// import ArcTransmission from "./ArcTransmission";
import PhyloChart from './PhyloChart';
import AreaPlot from './AreaPlot';
import ArcTransmission from './ArcTransmission';
import TimeAxis from './TimeAxis';
import { RectangularLayout, TransmissionLayout } from '../lib/figtree.js/index.js';

import 'react-perfect-scrollbar/dist/css/styles.css';
import PerfectScrollbar from 'react-perfect-scrollbar'
import {event, select} from "d3-selection";

// callbacks for the vertical timeline bar
const mouseEnter = (event, i, n)=>{
    // console.log(event)
    let timeline = document.getElementById("timeline");
    if (event.altKey) {
        timeline.style.left = event.pageX + "px";
        timeline.style.transition = "none";
        timeline.style.opacity = "1";
        timeline.style.visibility ="visible";
    } else {
        // -webkit-transition: 0.5s;
        // -moz-transition: 0.5s;
        // -o-transition: 0.5s;
        // transition: 0.5s;
        timeline.style.transition = "0.5s";
        timeline.style.opacity = "0";
        timeline.style.visibility = "hidden";
    }
};

const mouseExit = (d,i,n) => {
    const timeline = document.getElementById("timeline");
    timeline.style.visibility = "hidden";
};

const ChartContainer = React.forwardRef((props, ref)=>{


    const [chartGeom,setChartGeom]=useState({height:300,width:1200});
    const margins = {"top":10,"bottom":10,"left":50,"right":50};

    //Update chart sizes
    useEffect(()=>{
        if(props.timelineSize!==null){
            const parentBaseDim={"height":300,"width":props.timelineSize.width*0.94};
            setChartGeom(parentBaseDim)
        }

    },[props.timelineSize]);

    //Ensure we don't render before we have scales ect.
    const isFull = Object.values(props)
        .every(x => (x !== null & x !== ''));

    if(!isFull){
        return(
            <div className = "timelineContainer" ref={ref}>
            </div>
        )
    }else{
        return(
            <div className = "timelineContainer" ref={ref} onMouseMove={mouseEnter} onMouseLeave={mouseExit}>
                <div id="timeline"></div>
                <div className="hoverInfo" id="tooltip"></div>
                <div className = "mockChartContainer">
                    <TimeAxis dateRange ={props.dateRange}
                              margins = {margins}
                              chartGeom = {chartGeom}
                              domRect = {props.timelineSize}/>
                </div>
                <div className = "chartContainer">
                    <StackedHistogram  data={props.epidemic.Cases}
                                       margins = {margins}
                                       chartGeom={chartGeom}
                                       dateRange ={props.dateRange}
                                       callbacks={{groups:d=>d.location}}/>
                    <div className="chartTitle">Case plot</div>
                </div>
                <div className = "chartContainer">
                    <AreaPlot
                        margins = {margins}
                        epidemic={props.epidemic}
                        dateRange ={props.dateRange}
                        chartGeom={{...chartGeom,...{"height":400}}}/>
                    <div className="chartTitle">Outbreaks</div>
                </div>
                <div className = "chartContainer">
                    <ArcTransmission
                        margins = {margins}
                        treeDateRange={props.treeDateRange}
                        phylogeny={props.phylogeny}
                        graph={props.epidemic.graph}
                        dateRange ={props.dateRange}
                        curve ={"bezier"}
                        chartGeom={chartGeom}
                        setSelectedCases={props.setSelectedCases}
                        selectedCases={props.selectedCases}/>
                    <div className="chartTitle">Case connections</div>
                </div>
                <div className = "chartContainer">
                    <PhyloChart
                        margins = {margins}
                        dateRange ={props.dateRange}
                        treeDateRange={props.treeDateRange}
                        phylogeny={props.phylogeny}
                        layout = {RectangularLayout}
                        // attributes = {phyloAttributes}
                        chartGeom={{...chartGeom,...{"height":600}}}/>
                    <div className="chartTitle">Transmission tree</div>
                </div>
            </div>
        )}
    // <Chart  />
});

export default  ChartContainer;
