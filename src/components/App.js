import React, { Component } from 'react';
import Header from './Header';
import Panel from './CollapsablePanel';
import CasesHistogram from './CasesHistogram';
import PhyloTree from './PhyloTree';
//Styles from Rampart
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import '../styles/temporary.css'; // TODO
import TransmissionPanel from './TransmissionPanel';
import {parseCaseData, readData,parseEdgeData} from "../utils/dataParsers.js";
import {Graph} from "../utils/Graph";
import * as d3 from 'd3v4';
import {OptionBar} from "./OptionBar"
import "../styles/App.css"
import {onlyUnique} from "../utils/commonFunctions";
import {csv}  from 'd3-fetch'
import FigTreeComponent from "./FigTreeComponent"

class App extends Component {
	constructor(props) {
		super(props);
		this.state = { byLocation: false, selectedCases: [], counter: 0 ,data:new Graph(),resolved:false};
		// this.addTree = this.addTree.bind(this);
		this.selectSample = this.selectSample.bind(this);
		this.addCases=this.addCases.bind(this);
		this.addEdges=this.addEdges.bind(this);
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
			const source=this.state.data.getNodeFromKeyValuePair("id",edge.source)
			const target = this.state.data.getNodeFromKeyValuePair("id",edge.target)
			this.state.data.addEdge({source:source,
									target:target,
									metaData:edge.metaData})
	})
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
		const prefix = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
		Promise.all([
			csv(`${prefix}/lineList.csv`),
			csv(`${prefix}/UnsampledTrueCases.csv`),
			csv(`${prefix}/epiContacts.csv`),
			csv(`${prefix}/PerfectGeneticLinks.csv`)
		]).then(([lineList,unSampledNodes,epiLinks,allLinks])=>{
			const parsedLineList=lineList.map(d=>parseCaseData(d));
			this.addCases(parsedLineList);

			const parsedUnsampledNodes=unSampledNodes.map(d=>parseCaseData(d));
			this.addCases(parsedUnsampledNodes);

			const parsedEpiLinks=epiLinks.map(d=>parseEdgeData(d));
			this.addEdges(parsedEpiLinks);

			const parsedAllLinks=allLinks.map(d=>parseEdgeData(d));
			this.addEdges(parsedAllLinks);
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
			<div>
				<Header />
				<OptionBar 
				nodeOptions={this.state.data.getNodes().map(d=>d.metaData.dataType).filter(onlyUnique)}
				transmissionOptions={this.state.data.getEdgeList().map(d=>d.metaData.dataType).filter(onlyUnique)}
				edges = {this.state.data.getEdgeList()}
				/>

				<div className="Panels">
				<Panel
					title="Overview"
					child={CasesHistogram}
					childProps={{
						size: [900, 460],
						margin: { top: 0, right: 30, bottom: 50, left: 30 },
						zoomCase: this.state.zoomCase,
						cases:this.state.data.getNodes(),
						xScale:this.state.xScale
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
					}}
				/>
				<Panel
					title="Phylogeny"
					child={FigTreeComponent}
					childProps={{
						svgId: "tree",
						caseList: this.state.EpiData,
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
