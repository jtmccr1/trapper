import React, {useCallback,useState} from 'react';
import {TransmissionLayout, RectangularLayout, Tree} from 'figtree';
import { FigTree, CircleBauble } from 'figtree';
import {select} from 'd3-selection';
import {nest} from "d3-collection"

function PhyloChart(props){
    const [figtree,setFigtree]=useState(null);

    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
            // const attributes = nest().key(d=>d.id).entries(props.attributes[0]);
            // const flattenedAttributes={};
            // for(const entry of attributes){
            //     // can't handle transmission key yet
            //     delete entry.values[0].transmissions;
            //     flattenedAttributes[entry.key]=entry.values[0] //should be just one node for each id;
            // }


            // props.phylogeny.annotateTips(flattenedAttributes);
            const layout = new TransmissionLayout(props.phylogeny);
            
            const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":10,"right":50};
            const fig = new FigTree(node,layout,margins, { hoverBorder: 4, backgroundBorder:2,
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

        // useEffect(()=>{
        //     if(figtree!==null){
        //         figtree.update()
        //     }
        // },[props.chartGeom,props.phylogeny])

         return(
                <svg className="chart"
                ref={el}
                height={props.chartGeom.height}
                width={props.chartGeom.width}
            />);
         
};



export default PhyloChart;