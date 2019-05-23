import React, {useState,useCallback} from 'react';
import ObjectChart from "./ObjectChart";
import {ArcLayout,CircleBauble} from 'figtree';
import { FigTree } from 'figtree';
import {scaleTime} from "d3-scale";
import {select,selectAll} from 'd3-selection';


function ArcTransmission(props){

    const [figtree,setFigtree]=useState(null);
    const xscale = scaleTime().domain([new Date("2018-08-29"),new Date("2018-12-01")]).range([0,1]); // pass in date domain
    const xfunc=(n,i)=>xscale(n.symptomOnset) // for setting the x postion;

    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layout = new ArcLayout(props.graph,{xFunction:xfunc});
                const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":10,"right":50};

                const fig = new FigTree(node,layout,margins,{ hoverBorder: 4, backgroundBorder:2,
                    baubles: [
                        new CircleBauble(),
                    ],
                    transitionDuration:300
                });
            fig.draw();
            fig.hilightBranches();
            fig.hilightInternalNodes();
            fig.hilightExternalNodes();
            select(node).select(".axes-layer").remove();
            setFigtree(fig);
    }else{
        figtree.update();
    }
}});


        return(
            <svg className="chart"
            ref={el}
            height={props.chartGeom.height}
            width={props.chartGeom.width}
        />);

};




export default ArcTransmission;