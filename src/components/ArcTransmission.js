import React, {useState,useCallback} from 'react';
import ObjectChart from "./ObjectChart";
import {ArcLayout,CircleBauble}  from '../lib/figtree.js/index.js';
import { FigTree }  from '../lib/figtree.js/index.js';
import {scaleTime,scaleLinear} from "d3-scale";
import {select,selectAll} from 'd3-selection';
import {extent} from 'd3-array';
import {event,timeFormat,raise} from 'd3';
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
    
    const sourceNodes = fig.layout.graph.getIncomingEdges(d.node).map(e=>e.source);

    // sourceNodes.classed("attr",'hovered')
    // mimics highlight nodes in figtree
    for(const dataNode of [...sourceNodes]){
        const nodeGroup =  fig.svgSelection.select(`.node.id-${dataNode.id}`)
        const nodeShape = nodeGroup.select(".node-shape");
        nodeGroup.raise(); //da roof - bring to the top of the g groups.
        fig.settings.baubles.forEach((bauble) => {
            if (bauble.vertexFilter(nodeShape)) {
                bauble.updateShapes(nodeShape, fig.settings.hoverBorder);
            }
        });
        nodeShape.classed("hovered proxy", true);
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

    const sourceNodes = fig.layout.graph.getIncomingEdges(d.node).map(e=>e.source);

    // sourceNodes.classed("attr",'hovered')
    // mimics highlight nodes in figtree
    for(const source of sourceNodes){
        const node =  fig.svgSelection.select(`.node.id-${source.id}`).select(".node-shape");
        fig.settings.baubles.forEach((bauble) => {
            if (bauble.vertexFilter(node)) {
                bauble.updateShapes(node, 0);
            }
        });
        node.classed("hovered proxy", false);
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
        selectAll(".selected").classed("selected",false)

        

        select(n[i]).classed("selected", shouldSelect);
        selectAll(`.id-${d.node.id}`).classed("selected", shouldSelect);
        // potential sources
        // maybe select all to grab branches in the tree.
        fig.svgSelection.selectAll(`.branch.target-${d.node.id}`).select(".branch-path")
            .classed("selected",shouldSelect)
        
        const sourceNodes = fig.layout.graph.getIncomingEdges(d.node).map(e=>e.source);
    
        // sourceNodes.classed("attr",'hovered')
        // mimics highlight nodes in figtree
        for(const source of sourceNodes){
            const node =  fig.svgSelection.select(`.node.id-${source.id}`).select(".node-shape");
        //     fig.settings.baubles.forEach((bauble) => {
        //         if (bauble.vertexFilter(node)) {
        //             bauble.updateShapes(node, (shouldSelect?fig.settings.hoverBorder:0)); // if we're selecting use the hover border
        //         }
        //     });
            node.classed("selected by-proxy", shouldSelect);
            // on all other plots
            selectAll(`.id-${source.id}`).classed("selected by-proxy", shouldSelect);
    
        }
    }

    const [figtree,setFigtree]=useState(null);
    const xScale = scaleTime().domain(extent(props.dateRange)).range([0,1]); // pass in date domain
    const xfunc=(n,i)=>n.id==="UnsampledrootCase"? xScale(props.treeDateRange[0]):xScale(n.symptomOnset) // for setting the x postion;

    const el = useCallback(node => {
        
        if (node !== null) {
            if(node.children.length===0){ // make it the first time
                const layout = new ArcLayout(props.graph,{xFunction:xfunc,curve:props.curve});
                const settings = { hoverBorder: 4, backgroundBorder:2,
                    baubles: [new CircleBauble()],
                    transitionDuration:300,
                    // opacityFunc:e=>e.data.metaData.support,
                };
                const fig = new FigTree(node,layout,props.margins,settings);
            fig.draw();
            // fig.onHover(callback,".node")
            fig.onHoverNode(nodeCallback);
            fig.onClickNode(nodeClick);
            // fig.hilightBranches();
            fig.onHoverBranch(branchCallback);
            select(node).select(".axes-layer").remove();
            setFigtree(fig);
    }else{
        figtree.update();

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




export default ArcTransmission;