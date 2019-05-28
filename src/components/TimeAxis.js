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
                const margins = {"top":20,"bottom":0,"left":50,"right":50};
                const fig = new XTimeAxis(node,layoutSettings, margins,layoutSettings);
                fig.draw();
                Setaxis(fig);
            }else{
                axis.update();
            }
        }
    });
const rand_id = `b${Math.random().toString(36).substring(4)}`


        return(
            <svg className="fixedAxis" id= {rand_id}
            ref={el}
            height={props.domRect.height}//props.chartGeom.height}
            width={props.domRect.width}
        />);

};

export default TimeAxis;
