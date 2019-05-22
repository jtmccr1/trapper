import React, {useRef} from 'react';
import ObjectChart from "./ObjectChart";
import {ArcLayout} from 'figtree';
import { FigTree } from 'figtree';

function ArcTransmission(props){
    const isFull = Object.values(props).every(x => (x !== null & x !== ''));
    const el = useRef(null);     

    if(isFull){
        // const callbacks = {"handleMouseOver":d=>console.log(d), "handleMouseOut":d=>console.log("left")};
        const layout = new ArcLayout(props.graph);
        const figtree = new FigTree(el.current,layout);

         return(
            <ObjectChart  chartGeom={props.chartGeom} 
                  chart = {el.current===null? null: figtree} 
                  ref={el}/>
         )}else{
                return(null)
        }

};



export default ArcTransmission;