import React from 'react';
import Chart from "./Chart";
import {stackedHistogramChart, stackedHistogramLayout} from '../lib/charts/stackedHistogram';

function StackedHistogram(props){
    const isFull = Object.values(props).every(x => (x !== null & x !== ''));
    if(isFull){
        const callbacks = {"handleMouseOver":d=>console.log(d), "handleMouseOut":d=>console.log("left")};

         const [laidOutData,laidOutScales] = stackedHistogramLayout(props.data,props.scales,props.callbacks);//d=>d.location);
         return(
            <Chart  chartGeom={props.chartGeom} 
                  chart = {stackedHistogramChart} 
                  scales={laidOutScales}
                  data={laidOutData}
                  callbacks = {callbacks}/>
            )}else{
                return(null)
        }

}


export default StackedHistogram;
