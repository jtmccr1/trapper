import React, {useRef,useEffect,useState} from 'react';
import {select,selectAll} from 'd3-selection';
import {fishLayout} from "../lib/charts/fishplotLayout"
import {areaPlot} from "../lib/charts/areaPlot";
import {timeWeek} from "d3-time";
import {scaleTime} from "d3-scale";
import {extent} from 'd3-array';
import {event,timeFormat,max} from 'd3';
import {epidemic, Epidemic} from "../lib/outbreak/Epidemic";
import { Graph } from '../lib/figtree.js';
const formatTime = timeFormat("%B %d, %Y");
const getAllCases=(o,a)=>{
    a.push(...o.cases)
    for(const child of o.children){
        getAllCases(child,a);
    } 
    ;
}

const mouseEnter = (d, i, n)=>{
    const outbreak = d[0].data;
    const allAreas = selectAll(n);
    
    allAreas.filter((d2,i2,n2)=>n2[i2]!==n[i]).classed("not-hovered", true);
    select(n[i]).classed("hovered", true);

    selectAll(".rect").classed("hidden",true)
    selectAll(".node").classed("hidden",true)
    selectAll(".node-background").classed("hidden",true)
    selectAll(".branch").classed("hidden",true)
    const bringBack = [];
    getAllCases(outbreak,bringBack)
    console.log(bringBack)
    // bringBack.forEach(c=>selectAll(`.node .id-${c.id}`).classed("hidden",false))
    bringBack.forEach(c=>selectAll(`.id-${c.id}`).classed("hidden",false))
    bringBack.forEach(c=>selectAll(`.source-${c.id}`).classed("hidden",false))
    bringBack.forEach(c=>selectAll(`.target-${c.id}`).classed("hidden",false))


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
        selectAll(".rect").classed("hidden",false)
        selectAll(".node").classed("hidden",false)
        selectAll(".node-background").classed("hidden",false)
        selectAll(".branch").classed("hidden",false)
    };

const callback = {enter:mouseEnter,exit:mouseExit};


function AreaPlot(props){
    const [plot,setPlot]=useState(null);
    const areaClick=(d,i,n)=>{
        const outbreak = d[0].data;
        const selectedEpidemic = new Epidemic(outbreak.indexCase,props.epidemic.graph,mostProbableTransphyloEdgeCondition)
        // select edges in graph 
        const newCases = selectedEpidemic.Cases;
        const goodEdges = [];
        for(const Case of newCases){
            // incoming
            const incoming = selectedEpidemic.graph.getIncomingEdges(Case);
            incoming.forEach(e=>newCases.indexOf(e.source)>-1&&goodEdges.push({source:e.source.id,target:e.target.id,metaData:e.metaData}));
            // outgoing
            const outgoing = selectedEpidemic.graph.getOutgoingEdges(Case);
            outgoing.forEach(e=>newCases.indexOf(e.target)>-1&&goodEdges.push({source:e.source.id,target:e.target.id,metaData:e.metaData}));
        }
        selectedEpidemic.graph = new Graph(selectedEpidemic.Cases,goodEdges)
        props.selectArea(selectedEpidemic)
    }
        const el = useRef();
        useEffect(()=>{
            // const layout = new fishLayout(props.epidemic,layoutSettings);
            const fig = new areaPlot(el.current,props.layout,props.margins, { hoverBorder: 4, backgroundBorder:2,tranitionDuration:0});
            fig.draw();
            
            fig.onHover(callback,".fishArea")
            // fig.onClick(areaClick,".fishArea")
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


// Set the epidemic data
function mostProbableTransphyloEdgeCondition(graph){
    const actualFilterFunction = (edge)=>{
        const target = edge.target;
        // get incoming edges
        const incomingEdges = graph.getIncomingEdges(target);
        const maxTransphyloProb = max(incomingEdges.filter(e=>e.metaData.dataSource==="transphylo"), e =>e.metaData.support);
        return (edge === incomingEdges.find(e=> e.metaData.dataSource==="transphylo" && e.metaData.support===maxTransphyloProb))
    }
    return actualFilterFunction
}
export default AreaPlot;