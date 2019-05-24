import React from 'react';
import Chart from "./Chart";
import {histogramChart, histogramLayout} from '../lib/charts/histogram';

function Histogram(props){
    const isFull = Object.values(props).every(x => (x !== null & x !== ''));
    if(isFull){
         const [laidOutData,laidOutScales] = histogramLayout(props.data,props.scales,d=>d.symptomOnset);
         return(
            <Chart  chartGeom={props.chartGeom} 
                  chart = {histogramChart} 
                  scales={laidOutScales}
                  data={laidOutData}/>
            )}else{
                return(null)
        }

}


export default Histogram;
