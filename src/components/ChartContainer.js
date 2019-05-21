import React, {useState,useCallback,useEffect} from 'react';
import bins from '../examples/dev/bins'
import Chart from "./Chart";
import {csv} from "d3-fetch";
import{timeParse} from "d3-time-format";
import Case from "../lib/outbreak/Case";
import {histogramChart, histogramLayout} from '../lib/charts/histogram';
import {scaleTime,scaleLinear} from 'd3-scale';
import {timeWeek} from "d3-time";
import {max,min} from "d3-array";
function ChartContainer(props){
  
    const prefix = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://raw.githubusercontent.com/jtmccr1/trapper/master/src';
    
    //------------ Data processing ------------------------

    // hardcoding in data processing - magic number
    const dateParse = timeParse("%Y-%m-%d");

      const [ogLineList,setOgLineList]=useState(null);
      const [scales,setScales]=useState(null);
      const [chartGeom,setChartGeom]=useState(null);
      const [domRect,setDomRect]=useState(null);


    //Get lineList
    useEffect(()=>{
        csv(`${prefix}/examples/simulated/lineList.csv`,
        d=>{
            const dataPoint = {
                   id:d.Id,
                   symptomOnset:dateParse(d.symptomOnset),
                   sampleDate:[dateParse(d.sampleDate)],
                   location:d.Location,
                   resolution:d.Outcome,
                }
            return new Case(dataPoint);
          }).then(data=>setOgLineList(data));
    },[]);// [] only run on first render otherwise we get an infinite loop.
   
    //update scale 
    useEffect(()=>{
        // epi start and stop week;
        if(ogLineList!==null&&chartGeom!==null){
        const startWeek= timeWeek(min(ogLineList,d=>timeWeek(d.getSymptomOnset())));
        const endWeek = timeWeek(max(ogLineList,d=>timeWeek(d.getSymptomOnset())));
        const scales={
            x:scaleTime().domain([timeWeek.offset(startWeek,-1),timeWeek.offset(endWeek,-1)]).range([chartGeom.spaceLeft,(chartGeom.width-chartGeom.spaceRight)]),
            y:scaleLinear().domain([0,1]).range([(chartGeom.height - chartGeom.spaceBottom), chartGeom.spaceTop]),
        }
        // scales.x.ticks(timeWeek.range(scales.x.domain()[0],scales.x.domain()[1]));
        scales.weeks=timeWeek.range(scales.x.domain()[0],scales.x.domain()[1])
        setScales(scales);

    };
    },[ogLineList,chartGeom]);

    //Update chart sizes
    useEffect(()=>{
        if(domRect!==null){
        const margins={"spaceTop":10,"spaceBottom":20,"spaceLeft":60,"spaceRight":60};
        const parentBaseDim={"height":max([domRect.height*0.25,50]),"width":max([domRect.width*0.9,50])};
        setChartGeom({...margins,...parentBaseDim})
        }
    },[domRect]);

    //Getting the size of the container to pass to children
    const measuredRef = useCallback(node => {
        if (node !== null) {
            setDomRect({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width})
            const handleResize = () =>  {
                setDomRect({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width});
            }
            window.addEventListener('resize', handleResize);
            return () => {
              window.removeEventListener('resize', handleResize);
            };
        }
      },[]);
      const isFull = Object.values([scales,ogLineList]).every(x => (x !== null & x !== ''));
      
      return(
        <div className = "timelineContainer" ref={measuredRef}>
          {isFull&&<Chart  chartGeom={chartGeom} 
          chart = {histogramChart} 
          layout = {histogramLayout}
          scales={scales}
          data={ogLineList}/>}
          {isFull&&<Chart  chartGeom={chartGeom} 
          chart = {histogramChart} 
          layout = {histogramLayout}
          scales={scales}
          data={ogLineList}/>}
          {isFull&&<Chart  chartGeom={chartGeom} 
          chart = {histogramChart} 
          layout = {histogramLayout}
          scales={scales}
          data={ogLineList}/>}
          {isFull&&<Chart  chartGeom={chartGeom} 
          chart = {histogramChart} 
          layout = {histogramLayout}
          scales={scales}
          data={ogLineList}/>}
        </div>
    )
    // <Chart  />
}

export default  ChartContainer;