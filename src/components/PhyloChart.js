import React, {useCallback,useState} from 'react';
import {TransmissionLayout, RectangularLayout, Tree} from '../lib/figtree.js/index.js';
import { FigTree, CircleBauble } from '../lib/figtree.js/index.js';
import {select} from 'd3-selection';
import {scaleTime,scaleLinear} from "d3-scale";
import {extent} from "d3-array";

function PhyloChart(props){
    const [figtree,setFigtree]=useState(null);

    const el = useCallback(node => {

        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const dateRangeScale = scaleTime().domain(extent(props.dateRange)).range([0,1]); // converts date to final domain (horizontal scale)
                const treeRange = props.treeDateRange.map(d=>dateRangeScale(d)); // horizontal range of tree within date range converted to [0,1]
                const rootToTipScale = scaleLinear().domain(extent([0,...props.phylogeny.rootToTipLengths()])).range(treeRange) // converts root to tip distance to horizontal range of tree on [0,1]
                const layout = new props.layout(props.phylogeny,{horizontalScale:rootToTipScale});

                const fig = new FigTree(node,layout,props.margins, { hoverBorder: 4, backgroundBorder:2,
                    baubles: [
                        new CircleBauble(),
                    ],
                    transitionDuration:300
                });
                fig.draw();
                fig.hilightInternalNodes();
                fig.hilightExternalNodes();
                fig.hilightBranches();
                fig.onClickNode(d=>console.log(d))
                select(node).select(".axes-layer").remove();
                setFigtree(fig);

            }else{
                figtree.update();
            }
        }});

    const rand_id = `b${Math.random().toString(36).substring(4)}`

    // useEffect(()=>{
    //     if(figtree!==null){
    //         figtree.update()
    //     }
    // },[props.chartGeom,props.phylogeny])

    return(
        <svg className="chart" id={"phylogeny"}
             ref={el}
             height={props.chartGeom.height}
             width={props.chartGeom.width}
        />);

};



export default PhyloChart;