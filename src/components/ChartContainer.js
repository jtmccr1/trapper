import React, {useState,useCallback,useEffect} from 'react';
import{max} from 'd3-array';
import StackedHistogram from './StackedHistogram';
// import ArcTransmission from "./ArcTransmission";
import PhyloChart from './PhyloChart';
import AreaPlot from './AreaPlot';
import ArcTransmission from './ArcTransmission';
import TimeAxis from './TimeAxis';
import { RectangularLayout, TransmissionLayout } from '../lib/figtree.js/index.js';


const ChartContainer = React.forwardRef((props, ref)=>{
  

      const [chartGeom,setChartGeom]=useState({height:300,width:1200});
      const margins = {"top":10,"bottom":10,"left":50,"right":50};
    
      //Update chart sizes
    useEffect(()=>{
      if(props.timelineSize!==null){
      const parentBaseDim={"height":300,"width":props.timelineSize.width*0.9};
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
       <div className = "timelineContainer" ref={ref} >
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
          </div>  
          <div className = "chartContainer">
          <AreaPlot  
          margins = {margins}
          epidemic={props.epidemic} 
          dateRange ={props.dateRange}
          chartGeom={chartGeom}/>
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
          setSelected={props.setSelected}
          selected={props.selected}/>
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
    </div>  
    </div>
)}
    // <Chart  />
});

export default  ChartContainer;
