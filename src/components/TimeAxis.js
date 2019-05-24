import React, {useCallback,useState} from 'react';
import {XTimeAxis} from '../lib/charts/axis';
function TimeAxis(props){
    const [axis,Setaxis]=useState(null);
    
    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":50,"right":50};
                const fig = new XTimeAxis(node,props.domain,margins);
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
