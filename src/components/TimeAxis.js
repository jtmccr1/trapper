import React, {useCallback,useState} from 'react';
import {XTimeAxis} from '../lib/charts/axis';
import {extent} from 'd3-array';
function TimeAxis(props){
    const [axis,Setaxis]=useState(null);
    
    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const margins = {"top":20,"bottom":0,"left":50,"right":50};
                const fig = new XTimeAxis(node,extent(props.domain),margins,{axisStyle:props.axisStyle});
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
            height={50}//props.chartGeom.height}
            width={props.chartGeom.width}
        />);

};

export default TimeAxis;
