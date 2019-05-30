import React, {useCallback,useState} from 'react';
import {XTimeAxis} from '../lib/charts/axis';
import {scaleTime} from "d3-scale"
import {extent} from 'd3-array';
function TimeAxis(props){
    const [axis,Setaxis]=useState(null);
    
    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layoutSettings = {horizontalRange:extent(props.dateRange),
                    horizontalAxisTicks:props.dateRange,
                    horizontalScale:scaleTime};
                    const margins = {...props.margins,...{top:30,bottom:25}};
                const fig = new XTimeAxis(node,layoutSettings, margins,layoutSettings);
                fig.draw();
                const theyDetect =(d,i,n)=>{alert(`clicked ${d}`)}
                fig.onClick(theyDetect,".axis-box")
                Setaxis(fig);
            }else{
                axis.update();
            }
        }
    });
const rand_id = `b${Math.random().toString(36).substring(4)}`


        return(
            <svg id= {rand_id}
            ref={el}
            height={props.domRect.height+20+20+30}// 10px padding timecontainer 10px margin on chart 20px top margin on this 20 px bottom here
            width={props.chartGeom.width}
        />);

};

export default TimeAxis;
