import React, { useEffect, useCallback,useState,useRef } from 'react';
import {histogramChart} from '../lib/charts/histogram';
import {bins} from '../examples/dev/bins';
import {scaleTime,scaleLinear} from 'd3-scale';
import {timeWeek} from "d3-time";
import {max,min} from "d3-array";
import {select} from "d3-selection";


function Chart(props){

    const margins={"spaceTop":10,"spaceBottom":20,"spaceLeft":60,"spaceRight":60};
    const chartGeom = {...margins,...props.parentDimensions}
    chartGeom.height=chartGeom.height-500;
    chartGeom.width=chartGeom.width-50;

    const el = useRef(null);     
    const startWeek= timeWeek(new Date("1900-01-14"));
    const endWeek = timeWeek(new Date("1900-05-13"));
    const bin2 = bins.map(d=>({"length":d.length,"x0":timeWeek.floor(min(d,x=>new Date(x))),"x1":timeWeek.ceil(max(d,x=>new Date(x)))}))

        useEffect(()=>{
        const scales={
            x:scaleTime().domain([startWeek,endWeek]).range([margins.spaceLeft,(chartGeom.width-chartGeom.spaceRight)]),
            y:scaleLinear().domain([0,max(bins,d=>d.length)]).range([(chartGeom.height - chartGeom.spaceBottom), chartGeom.spaceTop])
        }
        const chart = new histogramChart(el.current);
        chart.draw(bin2,scales,chartGeom)
    },[bin2])
    return (
        <div className="chartContainer" height={`100%`}>
        <svg className="chart"
        ref={el}
        height={chartGeom.height}
        width={chartGeom.width}
    />
    </div>
);
}
export default  Chart;