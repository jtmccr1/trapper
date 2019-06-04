import React, {useState,useRef,useEffect,useCallback} from 'react';
import ObjectChart from "./ObjectChart";
import {ArcLayout,CircleBauble}  from '../lib/figtree.js/index.js';
import { FigTree }  from '../lib/figtree.js/index.js';
import {scaleTime,scaleLinear} from "d3-scale";
import {select,selectAll} from 'd3-selection';
import {extent} from 'd3-array';
import {event,timeFormat,raise} from 'd3';
import { userInfo } from 'os';
const formatTime = timeFormat("%B %d, %Y");

const branchMouseEnter = (d, i, n,fig)=>{
    select(n[i]).classed("hovered", true);

    let tooltip = document.getElementById("tooltip");
    // put text to display here!
    tooltip.innerHTML = `Source: ${d.data.source.id}
                        <br/>
                        Target: ${d.data.target.id}
                        <br/>
                        Data source: ${d.data.metaData.dataSource}
                        <br/>
                        Support:${d.data.metaData.support}`;

    tooltip.style.display = "block";
    tooltip.style.left =event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
    tooltip.style.visibility ="visible";
    // mimics highlight nodes in figtree
        for(const dataNode of [d.data.source,d.data.target]){
            const nodeGroup =  fig.svgSelection.select(`.node.id-${dataNode.id}`)
            const nodeShape = nodeGroup.select(".node-shape");
            nodeGroup.raise(); //da roof - bring to the top of the g groups.
            fig.settings.baubles.forEach((bauble) => {
                if (bauble.vertexFilter(nodeShape)) {
                    bauble.updateShapes(nodeShape, fig.settings.hoverBorder);
                }
            });
            nodeShape.classed("hovered", true);
        }
};
const branchMouseExit = (d,i,n,fig) => {
        select(n[i]).classed("hovered", false);

        const tooltip = document.getElementById("tooltip");
        tooltip.style.visibility = "hidden";

            // mimics highlight nodes in figtree
        for(const terminal of [d.data.source,d.data.target]){
            const node =  fig.svgSelection.select(`.node.id-${terminal.id}`).select(".node-shape");
            fig.settings.baubles.forEach((bauble) => {
                if (bauble.vertexFilter(node)) {
                    bauble.updateShapes(node, 0);
                }
            });
            node.classed("hovered", false);
        }
    };
const branchCallback = {enter:branchMouseEnter,exit:branchMouseExit};

const nodeMouseEnter = (d, i, n,fig)=>{

    // n[i] is this - the circle that is the node-shape.


    let tooltip = document.getElementById("tooltip");
    // put text to display here!
    tooltip.innerHTML = `Case Id: ${d.node.id}
                        <br/>
                        Location: ${d.node.location}
                        <br/>
                        Symptom onset: ${formatTime(d.node.symptomOnset)}`;

    tooltip.style.display = "block";
    tooltip.style.left =event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
    tooltip.style.visibility ="visible";

    // potential sources
    //Branches 
    const incomingBranches =  fig.svgSelection.selectAll(`.branch.target-${d.node.id}`)
    incomingBranches.raise();
    incomingBranches.select(".branch-path")
        .classed("hovered",true)
    
    const outGoingBranches =  fig.svgSelection.selectAll(`.branch.source-${d.node.id}`)
    outGoingBranches.raise();
    outGoingBranches.select(".branch-path")
        .classed("hovered",true)
        
        
    

    const sourceNodes = fig.layout.graph.getIncomingEdges(d.node).map(e=>e.source);
    for(const dataNode of [...sourceNodes]){
       fig.highlightNode(dataNode.id,"source")
    }

    // Targets
    const targetNodes = fig.layout.graph.getOutgoingEdges(d.node).map(e=>e.target);
    for(const dataNode of [...targetNodes]){
        fig.highlightNode(dataNode.id,"transmission")
     }

    const thisNode = select(n[i]).classed("hovered",true);
    fig.settings.baubles.forEach((bauble) => {
        if (bauble.vertexFilter(thisNode)) {
            bauble.updateShapes(thisNode, fig.settings.hoverBorder);
        }
    });
    select(n[i].parentNode).raise();
    //raise the g group the node is in.
};
const nodeMouseExit = (d,i,n,fig) => {
    const thisNode = select(n[i]).classed("hovered",false);
    fig.settings.baubles.forEach((bauble) => {
        if (bauble.vertexFilter(thisNode)) {
            bauble.updateShapes(thisNode, 0);
        }
    });
    const tooltip = document.getElementById("tooltip");
    tooltip.style.visibility = "hidden";

    fig.svgSelection.selectAll(`.branch.target-${d.node.id}`).select(".branch-path")
       .classed("hovered",false)
    fig.svgSelection.selectAll(`.branch.source-${d.node.id}`).select(".branch-path")
       .classed("hovered",false)

    const sourceNodes = fig.layout.graph.getIncomingEdges(d.node).map(e=>e.source);
    // sourceNodes.classed("attr",'hovered')
    // mimics highlight nodes in figtree
    for(const source of sourceNodes){
        const node =  fig.svgSelection.select(`.node.id-${source.id}`).select(".node-shape");
        if(node.attr("class").includes("selected")){
           fig.unHighlightNode(source.id,"")  // leave source for selection

        }else{
            fig.unHighlightNode(source.id,"source")  // leave source for selection
        }        
    }

        // Targets
        const targetNodes = fig.layout.graph.getOutgoingEdges(d.node).map(e=>e.target);
        for(const dataNode of [...targetNodes]){
            const node =  fig.svgSelection.select(`.node.id-${dataNode.id}`).select(".node-shape");
            if(node.attr("class").includes("selected")){
                fig.unHighlightNode(dataNode.id,"")  // leave transmission for selection
     
             }else{
                 fig.unHighlightNode(dataNode.id,"transmission")  // leave source for selection
             }        
         }

    };
const nodeCallback = {enter:nodeMouseEnter,exit:nodeMouseExit};
    


function ArcTransmission(props){
    // Selection call back
    const nodeClick = (d,i,n,fig) =>{
        // remove all selections
        // is it already selected?
        const shouldSelect = !select(n[i]).attr("class").includes("selected");
        if(shouldSelect){
            // props.selectedCases is defined on first render as an empty array. This is why this append doesn't work
            // insead it replaces. 
            props.setSelectedCases([...props.selectedCases,d.node])
        }else{
            props.setSelectedCases(props.selectedCases.filter(d=>d!==d.node))
        }
        // remove all other selections
        selectAll(".selected").classed("selected source transmission",false)
        

        select(n[i]).classed("selected", shouldSelect);
        selectAll(`.id-${d.node.id}`).classed("selected", shouldSelect);
        //to get other trees
        selectAll(`.id-${d.node.id}`).select(".node-shape").classed("selected", shouldSelect);
        selectAll(`.id-${d.node.id}`).select(".branch-path").classed("selected", shouldSelect);

        // potential sources
        // maybe select all to grab branches in the tree.
        fig.svgSelection.selectAll(`.branch.target-${d.node.id}`).select(".branch-path")
            .classed("selected",shouldSelect)
        
        fig.svgSelection.selectAll(`.branch.source-${d.node.id}`).select(".branch-path")
            .classed("selected",shouldSelect)

        const sourceNodes = fig.layout.graph.getIncomingEdges(d.node).map(e=>e.source);
        for(const source of sourceNodes){
            const node =  fig.svgSelection.select(`.node.id-${source.id}`).select(".node-shape");
            node.classed("selected source", shouldSelect);
            // on all other plots
            selectAll(`.tip-${source.id}`).classed("selected source", shouldSelect);
            selectAll(`.id-${source.id} `).select(".node-shape").classed("selected source", shouldSelect);
            selectAll(`.tip-${source.id}`).select(".branch-path").classed("selected transmission", shouldSelect);

        }
        const targetNodes = fig.layout.graph.getOutgoingEdges(d.node).map(e=>e.target);
        for(const target of targetNodes){
            const node =  fig.svgSelection.select(`.node.id-${target.id}`).select(".node-shape");
            node.classed("selected transmission", shouldSelect);
            // on all other plots
            selectAll(`.tip-${target.id}`).classed("selected transmission", shouldSelect);
            selectAll(`.id-${target.id}`).select(".node-shape").classed("selected transmission", shouldSelect);
            selectAll(`.tip-${target.id}`).select(".branch-path").classed("selected transmission", shouldSelect);

        }
    }

    const [figtree,setFigtree]=useState(null);

    // const el = useCallback(node => {
        
        // if (node !== null) {
            // if(node.children.length===0){ // make it the first time
            const el = useRef();
            useEffect(()=>{   
            // const layout = new ArcLayout(props.graph,{xFunction:xfunc,curve:props.curve});
                const settings = { hoverBorder: 4, backgroundBorder:2,
                    baubles: [new CircleBauble()],
                    tranitionDuration:0,
                    opacityFunc:e=>e.data.metaData.support,
                };
                const fig = new FigTree(el.current,props.layout,props.margins,settings);
            fig.draw();
            // fig.onHover(callback,".node")
            fig.onHoverNode(nodeCallback);
            fig.onClickNode(nodeClick);
            // fig.hilightBranches();
            fig.onHoverBranch(branchCallback);
            select(el.current).select(".axes-layer").remove();
            setFigtree(fig);
            // fig.update();
            },[]);

            useEffect(()=>{
               if(figtree) figtree.update();
            },[props.chartGeom.width,props.chartGeom.height])
            // }        figtree.update();

    

const rand_id = `b${Math.random().toString(36).substring(4)}`


        return(
            <svg className="chart" id= {rand_id}
            ref={el}
            height={props.chartGeom.height}
            width={props.chartGeom.width}
        />);

};




export default ArcTransmission;