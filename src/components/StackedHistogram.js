import React, {useCallback,useState} from 'react';
import {stackedHistogramChart, stackedHistogramLayout} from '../lib/charts/stackedHistogram';
import {select} from "d3-selection";
function StackedHistogram(props){
    const [histogram,setHistogram]=useState(null);
    
    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layout = new stackedHistogramLayout(props.data);
                const margins = {"top":props.chartGeom.spaceTop,"bottom":10,"left":10,"right":50};
                const settings = { hoverBorder: 4, backgroundBorder:2,
                    transitionDuration:300
                };
                const fig = new stackedHistogramChart(node,layout,margins,settings);
            fig.draw();
            const callback = {enter:function (d, i) {
                select(this).classed("hovered", true);
                console.log(this);
            },
                            exit:function (d, i) {
                                select(this).classed("hovered", false);
                                                
                            }};
            fig.onHover(callback)
            // select(node).select(".axes-layer").remove();
            setHistogram(fig);
    }else{
        histogram.update();
        const callback = {enter:function (d, i) {
            console.log(`from debugger: ${this}`);
            select(this).classed("hovered", true);
            
        },
                        exit:function (d, i) {
                            select(this).classed("hovered", false);
                                            
                        }};
                        histogram.onHover(callback)
    }
}});
const rand_id = `b${Math.random().toString(36).substring(4)}`


        return(
            <svg className="chart" id= {rand_id}
            ref={el}
            height={props.chartGeom.height}
            width={props.chartGeom.width}
        />);

};

export default StackedHistogram;
