import React, {useState,useCallback,useEffect} from 'react';
import {csv} from "d3-fetch";
import Case from "../lib/outbreak/Case";
import Link from "../lib/outbreak/Link";
import {dateParse,mode} from "../utils/commonFunctions"
import {scaleTime,scaleLinear} from 'd3-scale';
import {timeWeek,timeDay} from "d3-time";
import {max,min,extent} from "d3-array";
import {nest} from "d3-collection"
import Header from './Header';
import ChartContainer from './ChartContainer';
import LineList from "./LineList";

// icons
import { IoIosSettings } from "react-icons/io";
import { IoIosMap } from "react-icons/io";
import { IoIosListBox } from "react-icons/io";

import Geography from "./Geography"
import {Epidemic} from "../lib/outbreak/Epidemic";
import { Graph,Tree} from '../lib/figtree.js/index.js';
import {summarizeLinks} from '../utils/dataParsers.js'


import{stackedHistogramLayout} from "../lib/charts/stackedHistogramLayout"
import{fishLayout} from "../lib/charts/fishplotLayout"
import{ArcLayout} from "../lib/figtree.js/arcLayout"

import 'react-table/react-table.css';
import "../styles/trapper.css"


function App() {
    /*----------- Managing option bars and sizes 	------------------*/

    const [optionsOpen,setOptionsOpen] = useState(false);
    const [sideBarOpen,setSideBarOpen] = useState(false);
    const [timelineSize,getTimelineSize] = useState(null);
    const [sideBarFocus,setSideBarFocus] = useState("Geography");
    //Getting the size of the container to pass to children
    // const [handleResize,setHandelResize] = useState(null);
    // const otherRef = useRef(null);
    const measuredRef = useCallback(node => {
        if (node !== null) {
            getTimelineSize({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width})
            const handleResize = () =>  {
                let resizeTimer;
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {

                    // Run code here, resizing has "stopped"
                    getTimelineSize({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width});
                }, 250);
            }

            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    },[]);
    const getSizeAgain=()=>{
        let resizeTimer;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            window.dispatchEvent(new Event('resize'))
        },0); // resize takes 0.4s
    };

    /*----------------------- Data management----------------------------------*/
    const prefix = process.env.NODE_ENV === 'development' ? 'http://localhost:4001' : 'https://raw.githubusercontent.com/jtmccr1/trapper/master/examples/simulated';

    //------------ Data processing ------------------------

    // hardcoding in data processing - magic number


    const [phylogeny,setPhylogeny] = useState(null);
    const [dateRange,setDateRange] = useState(null)
    const [epidemic,setEpidemic] = useState(null);
    const [treeDateRange,setTreeDateRange] = useState(null);
    const [mapTopoJSON,setMapTopoJSON] =useState(null);
    const [selectedCases,setSelectedCases] = useState([]);
    const [areaLayout,setAreaLayout] = useState(null);
    const [transmissionLayout,setTransmissionLayout] = useState(null)
    const[stackedLayout,setStackedLayout] = useState(null);
    const [setArea,setAreaFunc] = useFunctionAsState(()=>console.log("test"))
    //Load the data at the start
    useEffect(()=>{
        console.log("reading in the data")
        // read in lineList, links,tree,treeAnnotations
        Promise.all([csv(`${prefix}/lineList.csv`),csv(`${prefix}/links.csv`),fetch(`${prefix}/tree.nwk`),fetch(`${prefix}/treeAnnotations.json`)])
            .then(([lineList,links,treeStringPromise,treeAnnotationsPromise])=>{
                // Make the graph object that connects the casea and links
                const parsedLineList = lineList.map(d=>{
                    const dataPoint = {
                        id:d.id,
                        symptomOnset:dateParse(d.symptomOnset),
                        sampleDate:[dateParse(d.sampleDate)],
                        location:d.location,
                        resolution:d.Outcome,
                    }
                    return new Case(dataPoint);
                })
                const parsedLinks = links.map(d=>new Link(d));
                //todo link for each datatype
                let summarizedLinks = summarizeLinks(parsedLinks);
                // get and source cases that weren't in the line list ie the unsampled root;
                const sources =  summarizedLinks.map(l=>l.source).reduce((acc,curr)=>{
                    if(acc.indexOf(curr)===-1){
                        return(acc.concat(curr));
                    }
                    return(acc);
                },[]);
                const targets =  summarizedLinks.map(l=>l.target).reduce((acc,curr)=>{
                    if(acc.indexOf(curr)===-1){
                        return(acc.concat(curr));
                    }
                    return(acc);
                },[]);
                const cases = [...parsedLineList];
                for(const source of [...sources,...targets]){
                    if(cases.filter(d=>d.id===source).length===0){
                        console.log(`${source} present in links but not lineList all links are removed`)
                        if(source.includes("root")){
                        const newCase = new Case({"id":source});
                        cases.push(newCase);
                        }else{

                        
                        // remove the link if the case is not in the line list
                        summarizedLinks= summarizedLinks.filter(l=>l.source!==source);
                        summarizedLinks= summarizedLinks.filter(l=>l.target!==source);
                    }
                }
            }   // filtering the links that have low support
                const filtedLinks=summarizedLinks.filter(l=>l.metaData.support>0.02);
                //The graph!
                const outbreakGraph = new Graph(cases,filtedLinks);
                const indexCase = outbreakGraph.nodes.find(n=>outbreakGraph.getOutgoingEdges(n).length>0&&outbreakGraph.getIncomingEdges(n).length===0);
                if(indexCase.location==="Unknown"){
                    // Sets index location to most common location of children
                    indexCase.symptomOnset=null;
                    const childLocations = outbreakGraph.getOutgoingEdges(indexCase)
                        .filter(e=>mostProbableTransphyloEdgeCondition(outbreakGraph)(e))
                        .map(e=>e.target.location)
                    indexCase.location = mode(childLocations);
                }
                const outbreakEpidemic = new Epidemic(indexCase,outbreakGraph,mostProbableTransphyloEdgeCondition);
                setEpidemic(outbreakEpidemic);

                // Handle the Tree
                Promise.all([treeStringPromise.text(),treeAnnotationsPromise.json()])
                    .then(([treeString,treeAnnotations])=>{
                        //Todo annotate Tree.
                        const tree = Tree.parseNewick(treeString);
                        //locations from tips
                        
                        tree.annotateNodesFromLabel(treeAnnotations);
                        
                        // if there are no locations in the annotations we do one from the tips.
                        if(!tree.annotations.hasOwnProperty("location")){
                        const tipLocations={};
                        parsedLineList.forEach(t=>{tipLocations[t.id]={location:t.location}})
                        tree.annotateTips(tipLocations)
                        tree.annotateNodesFromTips("location")
                        }
                        tree.order();
                        setPhylogeny(tree);
                        // get initial time range
                        const casesRange = extent(outbreakGraph.nodes,d=>d.symptomOnset);
                        const treeMaxTipLength = max(tree.nodes,n=>tree.rootToTipLength(n));

                        const treeMaxTip = tree.nodes.find(n=>tree.rootToTipLength(n)===treeMaxTipLength);
                        const treeMaxDate = max(outbreakGraph.getNode(treeMaxTip.name).sampleDate); // names must match case id's in line list; sampleDate is an array.

                        const treeRootDate = timeDay.offset(treeMaxDate,(-1*treeMaxTipLength*365)); // not exact
                        const totalExtent = extent([treeRootDate,...casesRange,treeMaxDate]);
                        const week0 = timeWeek.offset(timeWeek.floor(totalExtent[0]),-1);
                        // add an extra one for the range function [,)
                        const weekEnd = timeWeek.offset(timeWeek.ceil(totalExtent[1]),2);
                        setDateRange(timeWeek.range(week0,weekEnd));
                        setTreeDateRange([treeRootDate,treeMaxDate]);
                    // layouts
                        const layoutSettings = {
                            horizontalRange:extent(timeWeek.range(week0,weekEnd)),
                            horizontalTicks:timeWeek.range(week0,weekEnd),
                            horizontalScale:scaleTime,
                            groupingFunction:d=>d.location};
                            // setLayoutSettings(layoutSettings)
                            setStackedLayout( new stackedHistogramLayout(outbreakEpidemic.Cases,layoutSettings));
                        
                            setAreaLayout(new fishLayout(outbreakEpidemic,layoutSettings))
                            const xScale = scaleTime().domain(layoutSettings.horizontalRange).range([0,1]); // pass in date domain
                            const xfunc=(n,i)=>n.id==="UnsampledrootCase"? xScale(treeRootDate[0]):xScale(n.symptomOnset) // for setting the x postion;
                        
                    
                            // const selectAreaFact=()=>{
                                const selectArea=(epidemic)=>{
                                setEpidemic(epidemic);
                                setStackedLayout( new stackedHistogramLayout(outbreakEpidemic.Cases,layoutSettings));
                                setAreaLayout(new fishLayout(outbreakEpidemic,layoutSettings))
                                const xScale = scaleTime().domain(layoutSettings.horizontalRange).range([0,1]); // pass in date domain
                                const xfunc=(n,i)=>n.id==="UnsampledrootCase"? xScale(treeRootDate[0]):xScale(n.symptomOnset) // for setting the x postion;
                            
                                setTransmissionLayout( new ArcLayout(outbreakEpidemic.graph,{xFunction:xfunc,curve:'bezier'}));
                                }

                            // }
                            setAreaFunc(selectArea)
                            setTransmissionLayout( new ArcLayout(outbreakEpidemic.graph,{xFunction:xfunc,curve:'bezier'}));

                        })


            })
        // get map
        fetch(`${prefix}/map.json`).then(mapResponse=>mapResponse.json()).then(mapJSON=>setMapTopoJSON(mapJSON))

    },[])


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
    const mapMargins = {"top":5,"bottom":5,"left":5,"right":5};
    const mapSize = {"height": 500, width: 500};



    //    layouts


    /*---------------------- Rendering -------------------------*/

    return(
        <div className="fillHorizontalSpace">
            <Header />
            <div className="mainScreen">
                <div className={`sidebar left ${optionsOpen? "open":''}`}>
                </div>
                <div className="sidebarButtonColumn">
                    
                    <div className="sidebarButtons left">
                        <h3 className="button" onClick={()=> {setOptionsOpen(!optionsOpen);getSizeAgain();}}>
                            <div className="button-icon"><IoIosSettings/></div>
                            <div className="rotate-plus-ninety">Options</div>
                        </h3>
                    </div>
                </div>
                <ChartContainer
                    ref = {measuredRef}
                    timelineSize = {timelineSize}
                    dateRange={dateRange}
                    treeDateRange={treeDateRange}
                    epidemic={epidemic}
                    phylogeny={phylogeny}
                    stackedLayout={stackedLayout}
                    areaLayout={areaLayout}
                    transmissionLayout = {transmissionLayout}
                    setSelectedCases={setSelectedCases}
                    selectedCases={selectedCases}
                    selectArea={setArea}/>
                <div className="sidebarButtonColumn">
                    <div className="sidebarButtons right">
                        <h3 className={`button ${sideBarOpen && sideBarFocus === "Geography" ? "selected" : ""}`} onClick={()=> {
                            if(sideBarOpen&&sideBarFocus!=="Geography"){
                                setSideBarFocus("Geography")
                            }else{
                                setSideBarOpen(!sideBarOpen)
                                setSideBarFocus("Geography")
                            }
                            getSizeAgain();
                        }}>
                            <div className="button-icon"><IoIosMap/></div>
                            <div className="button-text rotate-minus-ninety">Map</div>
                        </h3>

                        <h3 className={`button ${sideBarOpen && sideBarFocus === "LineList" ? "selected" : ""}`} onClick={()=> {
                            if(sideBarOpen && sideBarFocus !== "LineList"){
                                setSideBarFocus("LineList")
                            }else{
                                setSideBarOpen(!sideBarOpen)
                                setSideBarFocus("LineList")
                            }
                            getSizeAgain();
                        }}>
                            <div className="button-icon"><IoIosListBox/></div>
                            <div className="button-text rotate-minus-ninety">Line List</div>
                        </h3>
                    </div>
                </div>
                <div className={`sidebar right ${sideBarOpen? "open":''}`}>
                    {sideBarFocus==="Geography"?
                        <div className = "geographyContainer">
                            {mapTopoJSON?
                                <Geography data={mapTopoJSON} margins={mapMargins} size={mapSize} />
                                :<h3>Loading Map</h3>}
                        </div>
                        :<LineList epidemic= {epidemic} selectedCases={selectedCases}/>}
                </div>
            </div>
        </div>
    )
}
//https://github.com/facebook/react/issues/14087
function useFunctionAsState(fn) {

    const [val, setVal] = useState(() => fn);
  
    function setFunc(fn) {
      setVal(() => fn);
    }
  
    return [val, setFunc];
    
  }

export default App;
