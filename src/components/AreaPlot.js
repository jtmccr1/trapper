import React, {useCallback,useState} from 'react';
import {select} from 'd3-selection';
import {fishLayout} from "../lib/charts/fishplotLayout"
import {areaPlot} from "../lib/charts/areaPlot"

function AreaPlot(props){
    const [plot,setPlot]=useState(null);

    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time

            const layout = new fishLayout(props.epidemic);
            const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":50,"right":50};
            const fig = new areaPlot(node,layout,margins, { hoverBorder: 4, backgroundBorder:2,transitionDuration:300});
            fig.draw();
            // select(node).select(".axes-layer").remove();
            setPlot(fig);
            console.log(fig.points)
        }else{
            plot.update();
        }
        }});
        const rand_id = `b${Math.random().toString(36).substring(4)}`

        // useEffect(()=>{
        //     if(figtree!==null){
        //         figtree.update()
        //     }
        // },[props.chartGeom,props.phylogeny])

         return(
                <svg className="chart" id={rand_id}
                ref={el}
                height={props.chartGeom.height}
                width={props.chartGeom.width}
            />);
         
};



export default AreaPlot;