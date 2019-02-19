import React, { Component } from 'react';
import Header from './Header';
import Panel from './CollapsablePanel';
import getData from '../utils/getData';
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

class App extends Component {
	constructor(props) {
		super(props);
		this.state = { byLocation: false, selectedCases: [], colorChange: 0 ,data:new Graph()};
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
			.domain(d3.extent(newData, d => d.dateOfSampling))
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


	
	// addTree = newData => {
	// 	let newState = this.state;
	// 	const tree = Tree.parseNewick(newData.newick);
	// 	//tree.nodeList.forEach(n => (n.color = colours['grey'])); // Sets initial color
	// 	newState['PhyloTree'] = tree;
	// 	newState['zoomPhylo'] = tree.rootNode;

	// 	this.setState(newState, () => this.setPhyloColors());
	// };


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
		readData("http://localhost:3001/lineList.csv",parseCaseData,this.addCases);
		readData("http://localhost:3001/epiContacts.csv",parseEdgeData,this.addEdges);

		getData('fullLineList.json', this.addEpiData);
		getData('tree.json', this.addTree);
	}

	render() {
		return (
			<div>
				<Header />
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
						margin: { top: 0, right: 30, bottom: 60, left: 30 },
						selectedCases: this.state.selectedCases,
						selectSample: this.selectSample,
						data:this.state.data,
						xScale:this.state.xScale,
					}}
				/>
				<Panel
					title="Phylogeny"
					child={PhyloTree}
					childProps={{
						tree: this.state.PhyloTree,
						caseList: this.state.EpiData,
						size: [700, 470],
						margin: { top: 10, right: 60, bottom: 60, left: 50 },
						byLocation: this.state.byLocation,
						updateColor: this.updateColor,
						colorChange: this.state.colorChange,
						selectedCases: this.state.selectedCases,
						selectSample: this.selectSample,
						zoomToNode: this.zoomToNode,
						zoomPhylo: this.state.zoomPhylo,
						resetZoom: this.resetZoom,
					}}
				/>
			</div>
		);
	}
}

export default App;
