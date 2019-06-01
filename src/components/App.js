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


import Geography from "./Geography"
import {Epidemic} from "../lib/outbreak/Epidemic";
import { Graph,Tree} from '../lib/figtree.js/index.js';
import {summarizeLinks} from '../utils/dataParsers.js'

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
	const prefix = process.env.NODE_ENV === 'development' ? 'http://localhost:4001' : 'https://raw.githubusercontent.com/jtmccr1/trapper/master/src';
    
	//------------ Data processing ------------------------

	// hardcoding in data processing - magic number


		const [phylogeny,setPhylogeny] = useState(null);
		const [dateRange,setDateRange] = useState(null)
		const [epidemic,setEpidemic] = useState(null);
		const [treeDateRange,setTreeDateRange] = useState(null);
		const [mapTopoJSON,setMapTopoJSON] =useState(null);
		const [selectedCases,setSelectedCases] = useState([]);

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
															location:d.Location,
															resolution:d.Outcome,
															}
										return new Case(dataPoint);
										})
			const parsedLinks = links.map(d=>new Link(d));
			//todo link for each datatype
			const summarizedLinks = summarizeLinks(parsedLinks);
			// get and source cases that weren't in the line list ie the unsampled root;
			const sources =  links.map(l=>l.source).reduce((acc,curr)=>{
				if(acc.indexOf(curr)===-1){
					return(acc.concat(curr));
				}
				return(acc);
			},[]);
			const cases = [...parsedLineList];
			for(const source of sources){
				if(cases.filter(d=>d.id===source).length===0){
					const newCase = new Case({"id":source});
					cases.push(newCase);
				}
			}
			//The graph!
			const outbreakGraph = new Graph(cases,summarizedLinks);
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
				const treeAnnotationsInitial= treeAnnotations[(treeAnnotations.length-1)];
				const parsedTreeAnnotationsInitial= nest()
				.key(d=>d.id)
				.rollup(d=>{
					return({...d[0],...{transmissions:d[0].transmissions.length}})
				})
				.object(treeAnnotationsInitial)
				//Todo annotate Tree.
				const tree = Tree.parseNewick(treeString);
				setPhylogeny(tree);
				// get initial time range
				const casesRange = extent(outbreakGraph.nodes,d=>d.symptomOnset);
				const treeMaxTipLength = max(tree.nodes,n=>tree.rootToTipLength(n));

				const treeMaxTip = tree.nodes.find(n=>tree.rootToTipLength(n)===treeMaxTipLength);
				const treeMaxDate = max(outbreakGraph.getNode(treeMaxTip.name).sampleDate); // names must match case id's in line list; sampleDate is an array.
				
				const treeRootDate = timeDay.offset(treeMaxDate,(-1*treeMaxTipLength*365)); // not exact
				const totalExtent = extent([treeRootDate,...casesRange]);
				const week0 = timeWeek.offset(timeWeek.floor(totalExtent[0]),-1);
				// add an extra one for the range function [,)
				const weekEnd = timeWeek.offset(timeWeek.ceil(totalExtent[1]),2);
				setDateRange(timeWeek.range(week0,weekEnd));
				setTreeDateRange([treeRootDate,treeMaxDate]);
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

	/*---------------------- Rendering -------------------------*/

	return(
			<div className="fillHorizontalSpace">
			<Header />
				<div className="mainScreen">
					<div className={`sidebar left ${optionsOpen? "open":''}`}>
					</div>
					<div className="sidebarButtonColumn">
						<div className="sidebarButtons left">
								 <h3 className="button" onClick={()=> {setOptionsOpen(!optionsOpen);getSizeAgain();}}>Options</h3>
						</div>
					</div>
					<ChartContainer  
						ref = {measuredRef} 
						timelineSize = {timelineSize}
						dateRange={dateRange}
						treeDateRange={treeDateRange}
						epidemic={epidemic}
						phylogeny={phylogeny}
						setSelectedCases={setSelectedCases}
						selectedCases={selectedCases}/> 
					<div className="sidebarButtonColumn">
						<div className="sidebarButtons right">
								 <h3 className={`button ${sideBarFocus==="Geography"?"selected":""}`} onClick={()=> {
									if(sideBarOpen&&sideBarFocus!=="Geography"){
										setSideBarFocus("Geography")
									}else{
										setSideBarOpen(!sideBarOpen)
										setSideBarFocus("Geography")
									}
									getSizeAgain();
									}}>Map</h3>

								 <h3 className={`button ${sideBarFocus==="LineList"?"selected":""}`} onClick={()=> {
									if(sideBarOpen&&sideBarFocus!=="LineList"){
										setSideBarFocus("LineList")
									}else{
										setSideBarOpen(!sideBarOpen)
										setSideBarFocus("LineList")
									}
									getSizeAgain();
									}}>Line List</h3>
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

export default App;
