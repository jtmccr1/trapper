import React, { Component } from 'react';
import Header from './Header';
import Panel from './CollapsablePanel';
import CasesHistogram from './CasesHistogram';
//Styles from Rampart
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import '../styles/temporary.css'; // TODO
import TransmissionPanel from './TransmissionPanel';
import {parseCaseData,  parseEdgeData} from "../utils/dataParsers.js";
import {Graph} from "../utils/Graph";
import {OptionBar} from "./OptionBar"
import "../styles/App.css"
import {onlyUnique} from "../utils/commonFunctions";
import {csv}  from 'd3-fetch'
import FigTreeComponent from "./FigTreeComponent"
import * as d3 from 'd3v4';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = { byLocation: false, 
			selectedCases: [], 
			counter: 0 ,
			data:new Graph(),
			transmissionLayout:false,
			resolved:false,
			// use a map here instead of 2 arrays?
			nodeDataSources:[],
			nodeDataStatuses:[]};
		// this.addTree = this.addTree.bind(this);
		this.selectSample = this.selectSample.bind(this);
		this.addCases=this.addCases.bind(this);
		this.addEdges=this.addEdges.bind(this);
		this.checkThatBox=this.checkThatBox.bind(this);
		this.checkThatBoxArray=this.checkThatBoxArray.bind(this);
	}
	
	addCases = (newData)=>{
		newData.forEach(node=>{
			this.state.data.addNode(node)
		})
		this.setState({xScale:d3
			.scaleTime()
			.domain(d3.extent(newData, d => d.dateOfSampling? d.dateOfSampling: d.metaData["Date of onset"]))
			.nice()})
	}
	addEdges = newData=>{
		newData.forEach(edge=>{
			const source=this.state.data.getNodesFromKeyValuePair("id",edge.source)
			const target = this.state.data.getNodesFromKeyValuePair("id",edge.target)
			this.state.data.makeEdge(source[0],
									target[0],
									edge.metaData)
	})
}
	checkThatBox(stateKey){
		const checkThisOne=()=>{
			const newState={};
			 newState[stateKey]=!this.state[stateKey];
			this.setState(newState)
		}
		return(checkThisOne)
	}
	checkThatBoxArray(stateKey){
		const self=this;
		const thisIndexPlease=(i)=>{
			const checkIt=()=>{
				const newState={};
				newState[stateKey]=self.state[stateKey];
				newState[stateKey][i]=!self.state[stateKey][i]
				self.setState(newState)
			}
			return(checkIt)
		}
		return(thisIndexPlease)
	}


	selectSample(node) {
		const selectedCases = this.state.selectedCases;
		if (selectedCases.map(n => n.Id).indexOf(node.Id) > -1) {
			//remove it
			const newSelectedCases = selectedCases.filter(x => x !== node);
			this.setState({ selectedCases: newSelectedCases });
		} else {
			//add it

			selectedCases.push(node);
			this.setState({ selectedCases: selectedCases });
		}
	}
	
	componentDidMount() {
		// Wait to render until the data is read
		const prefix = process.env.NODE_ENV === 'development' ? 'http://localhost:3001/' : 'https://raw.githubusercontent.com/jtmccr1/trapper/master/src/';
		// const prefix ="https://github.com/jtmccr1/trapper/tree/master/src/";
		Promise.all([
			csv(`${prefix}data/lineList.csv`),
			// csv(`${prefix}data/UnsampledTrueCases.csv`),
			csv(`${prefix}data/UnsampledTransPhyloCases.csv`),
			csv(`${prefix}data/epiContacts.csv`),
			// csv(`${prefix}data/PerfectGeneticLinks.csv`),
			csv(`${prefix}data/TransPhyloLinks.csv`),
		// ]).then(([lineList,unSampledNodes,transPhyloCases,epiLinks,allLinks,transPhyloLinks])=>{
			]).then(([lineList,transPhyloCases,epiLinks,transPhyloLinks])=>{

			const parsedLineList=lineList.map(d=>parseCaseData(d));
			this.addCases(parsedLineList);

			// const parsedUnsampledNodes=unSampledNodes.map(d=>parseCaseData(d));
			// this.addCases(parsedUnsampledNodes);

			const parsedTransPhyloCases=transPhyloCases.map(d=>parseCaseData(d));
			this.addCases(parsedTransPhyloCases);

			const parsedEpiLinks=epiLinks.map(d=>parseEdgeData(d));
			this.addEdges(parsedEpiLinks);

			// const parsedAllLinks=allLinks.map(d=>parseEdgeData(d));
			// this.addEdges(parsedAllLinks);

			const parsedtransPhyloLinks=transPhyloLinks.map(d=>parseEdgeData(d));
			this.addEdges(parsedtransPhyloLinks);

			return true
		}).then((result)=>{
			fetch(`${prefix}data/sampledTree.phy`)
			.then(response=>response.text()
							.then(text=>{
								this.setState({treeString:text})
							}))
			return true;
		}).then((result)=>{
			//annotate nodes
			const nodeAnnotations = {}
			this.state.data.nodes.forEach(n=>nodeAnnotations[n.key]={...n.metaData});
			console.log(nodeAnnotations);

			this.state.data.annotateNodes(nodeAnnotations);

			console.log(this.state.data)

			//annotate edges
			return true
		}).then((result)=>{
			this.setState({nodeDataSources:this.state.data.nodes.map(d=>d.metaData.dataType).filter(onlyUnique)});
			this.setState({nodeDataStatuses:this.state.data.nodes.map(d=>d.metaData.dataType).filter(onlyUnique).map(x=>true)})
			this.setState({edgeDataSources:this.state.data.edges.map(d=>d.metaData.dataType).filter(onlyUnique)});
			this.setState({edgeDataStatuses:this.state.data.edges.map(d=>d.metaData.dataType).filter(onlyUnique).map(x=>true)});
			return true
		}).then((result)=>{
			this.setState({resolved:result})
		})
	}




	render() {
		if (!this.state.resolved) {
			return <div>Loading...</div>;
		  } else {
			return (
			<div id="outer-contanier" style={{overflow: 'auto', height:'500%'}} >
				<Header />
				<OptionBar 
				nodeOptions={this.state.nodeDataSources}
				nodeStatus = {this.state.nodeDataStatuses}
				edgeOptions={this.state.edgeDataSources}
				edgeStatus ={this.state.edgeDataStatuses}
				nodeDataCallback ={this.checkThatBoxArray("nodeDataStatuses")}
				edgeDataCallback ={this.checkThatBoxArray("edgeDataStatuses")}
				transmissionLayout={this.state.transmissionLayout}
				transmissionCallBack={this.checkThatBox("transmissionLayout")}
				/>
				

				<div className="Panels" id="page-wrap">
				<Panel
					title="Overview"
					child={CasesHistogram}
					childProps={{
						size: [900, 460],
						margin: { top: 0, right: 30, bottom: 50, left: 30 },
						cases:this.state.data.nodes,
						xScale:this.state.xScale,
						nodeDataSources:this.state.nodeDataSources,
						nodeDataStatuses:this.state.nodeDataStatuses,

					}}
				/>
				
				<Panel
					title="Transmission network"
					child={TransmissionPanel}
					childProps={{
						size: [900, 460],
						margin: { top: 0, right: 30, bottom: 80, left: 30 },
						selectedCases: this.state.selectedCases,
						selectSample: this.selectSample,
						data:this.state.data,
						xScale:this.state.xScale,
						nodeDataSources:this.state.nodeDataSources,
						nodeDataStatuses:this.state.nodeDataStatuses,
						edgeDataSources:this.state.edgeDataSources,
						edgeDataStatuses:this.state.edgeDataStatuses,
					}}
				/>
				<Panel
					title="Phylogeny"
					child={FigTreeComponent}
					childProps={{
						svgId: "tree",
						caseData:this.state.data,
						treeString:this.state.treeString,
						transmissionLayout:this.state.transmissionLayout,
						width: 700,
						height:500
						
					}}
				/>
				</div>
			</div>
		);
	}
}
}

export default App;
