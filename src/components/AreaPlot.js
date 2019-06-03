import React, {useRef,useEffect,useState} from 'react';
import {select,selectAll} from 'd3-selection';
import {fishLayout} from "../lib/charts/fishplotLayout"
import {areaPlot} from "../lib/charts/areaPlot";
import {timeWeek} from "d3-time";
import {scaleTime} from "d3-scale";
import {extent} from 'd3-array';
import {event,timeFormat} from 'd3';

const formatTime = timeFormat("%B %d, %Y");


const mouseEnter = (d, i, n)=>{
    const allAreas = selectAll(n);

    allAreas.filter((d2,i2,n2)=>n2[i2]!==n[i]).classed("not-hovered", true);
    select(n[i]).classed("hovered", true);


    let tooltip = document.getElementById("tooltip");
    const exportEvents = d[0].data.children
                    .map(c=>`${c.location} - ${formatTime(c.cases[0].symptomOnset)}`)
                    .join("<br/>");

    // put text to display here!
    tooltip.innerHTML = `Local circulation
                        <br/>
                        Location: ${d[0].data.location}
                        <br/>
                        Cases: ${d[0].data.cases.length}
                        ${(d[0].data.parent.location!==null?
                             `<br/>
                             Source: ${d[0].data.parent.location}`:"")}
                        ${d[0].data.children.length>0?`<br/>Export Events<br/>${exportEvents}`:""}
                        `

                        ;

    tooltip.style.display = "block";
    tooltip.style.left = event.pageX + (event.pageX > 800? -300 : + 10) + "px";
    tooltip.style.top = event.pageY + 10 + "px";
    tooltip.style.visibility ="visible";
};
const mouseExit = (d,i,n) => {
        selectAll(n).classed("not-hovered", false);
        select(n[i]).classed("hovered", false);

        const tooltip = document.getElementById("tooltip");
        tooltip.style.visibility = "hidden";
    };

const callback = {enter:mouseEnter,exit:mouseExit};


function AreaPlot(props){
    const [plot,setPlot]=useState(null);
        
        const el = useRef();
        useEffect(()=>{
                const layoutSettings = {horizontalRange:extent(props.dateRange),
                                    horizontalTicks:props.dateRange,
                                    horizontalScale:scaleTime};
            // const layout = new fishLayout(props.epidemic,layoutSettings);
            const fig = new areaPlot(el.current,props.layout,props.margins, { hoverBorder: 4, backgroundBorder:2,tranitionDuration:0});
            fig.draw();
            
            fig.onHover(callback,".fishArea")
            setPlot(fig);
            },[]);

        const rand_id = `b${Math.random().toString(36).substring(4)}`

        useEffect(()=>{
            if(plot!==null){
                plot.update()
            }
        },[props.chartGeom,props.epidemic])

         return(
                <svg className="chart" id={rand_id}
                ref={el}
                height={props.chartGeom.height}
                width={props.chartGeom.width}
            />);
         
};



export default AreaPlot;