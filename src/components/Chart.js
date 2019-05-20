import React, { useEffect, useRef } from 'react';
import {histogramChart} from '../lib/charts/histogram';
import {bins} from '../examples/dev/bins';
import {scaleTime,scaleLinear} from 'd3-scale';
import {timeWeek} from "d3-time";
import {max,min} from "d3-array";
import {select} from "d3-selection";
const calcChartGeom = (DOMRect) => ({
    width: DOMRect.width,
    height: DOMRect.height - 20, // title line
    spaceLeft: 60,
    spaceRight: 0,
    spaceBottom: 60,
    spaceTop: 10
});

function Chart(props){


    const el = useRef(null);

    const chartGeom ={ width: 700,
        height: 200, // title line
        spaceLeft: 60,
        spaceRight: 0,
        spaceBottom: 60,
        spaceTop: 10} //calcChartGeom(this.boundingDOMref.getBoundingClientRect())
        // Hardcoding to be replaced;
        
        const startWeek= timeWeek(new Date("1900-01-14"));
        const endWeek = timeWeek(new Date("1900-05-13"));
        const scales={
            x:scaleTime().domain([startWeek,endWeek]).range([chartGeom.spaceLeft,(chartGeom.width-chartGeom.spaceRight)]),
            y:scaleLinear().domain([0,max(bins,d=>d.length)]).range([(chartGeom.height - chartGeom.spaceBottom), chartGeom.spaceTop])
        }

        const bin2 = bins.map(d=>({"length":d.length,"x0":timeWeek.floor(min(d,x=>new Date(x))),"x1":timeWeek.ceil(max(d,x=>new Date(x)))}))
    useEffect(()=>{
        console.log(select(el.current))        
        const chart = new histogramChart(el.current);
        chart.draw(bin2,scales,chartGeom)
    },[el])


    return (
        <div className={props.className} style={{width: 900,height:200}}>
        <svg
        ref={el}
        height={chartGeom.height || 0}
        width={chartGeom.width || 0}
    />
    </div>
);
}
export default  Chart;