import React, { Component } from 'react';
import Header from './Header';
import Panel from './CollapsablePanel';
import getData from '../utils/getData';
import CasesHistogram from './CasesHistogram';
import PhyloTree from './PhyloTree';
import Tree from '../utils/figtree';
//Styles from Rampart
import { colours } from '../styles/colours';
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import '../styles/temporary.css'; // TODO
import { onlyUnique, curry } from '../utils/commonFunctions';
import TransmissionPanel from './TransmissionPanel';
import {parseCaseData, readData,parseEdgeData} from "../utils/dataParsers.js";
import TransmissionGraph from './TransmissionGraph';
import {Graph} from "../utils/Graph";
import { line } from 'd3v4';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = { byLocation: false, selectedCases: [], colorChange: 0 ,data:new Graph()};
		this.addEpiData = this.addEpiData.bind(this);
		this.addTree = this.addTree.bind(this);
		this.updateColor = this.updateColor.bind(this);
		this.selectSample = this.selectSample.bind(this);
		this.setPhyloColors = this.setPhyloColors.bind(this);
		this.zoomToNode = this.zoomToNode.bind(this);
		this.resetZoom = this.resetZoom.bind(this);
		this.addCases=this.addCases.bind(this);
		this.addEdges=this.addEdges.bind(this);
	}
	addEpiData = newData => {
		

		let newState = this.state;
		//parse dates - maybe in the future check for different formats or specify
		newData.forEach(person => {
			const onset = new Date(person.Onset);
			const sampleTime = new Date(person.SampleTime);
			person.Onset = onset;
			person.SampleTime = sampleTime;
		});
		//add parent key
		for (const node of newData) {
			node.children = [];

			if (node.Contact && node.Contact.length > 0) {
				// donor in this dataset
				node.parent = newData.filter(n => n.Id === node.Contact[0])[0];
			}
		}
		//add children array
		for (const node of newData) {
			if (node.parent) {
				node.parent.children.push(node);
			}
		}
		newData.forEach(node => (node.length = node.parent ? node.Onset - node.parent.Onset : 0));
		newData.forEach(node => (node.children = node.children.length > 0 ? node.children : null));

		const indexCase = newData.filter(node => !node.parent)[0];
		indexCase.level = 0;
		const transmissionTree = new Tree(indexCase);
		[...transmissionTree.preorder()]
			.filter(node => node.parent)
			.forEach(node => (node.level = node.parent.level + 1));
		newState['EpiData'] = newData;
		newState['transmissionTree'] = transmissionTree;
		newState['zoomCase'] = transmissionTree.rootNode;

		this.setState(newState);
	};


	addCases = (newData)=>{
		newData.forEach(node=>{
			this.state.data.addNode(node)
		})
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


	
	addTree = newData => {
		let newState = this.state;
		const tree = Tree.parseNewick(newData.newick);
		//tree.nodeList.forEach(n => (n.color = colours['grey'])); // Sets initial color
		newState['PhyloTree'] = tree;
		newState['zoomPhylo'] = tree.rootNode;

		this.setState(newState, () => this.setPhyloColors());
	};
	updateColor = () => {
		this.setState(
			{
				byLocation: !this.state.byLocation,
			},
			() => this.setPhyloColors()
		);
	};
	resetZoom() {
		this.setState({
			zoomCase: this.state.transmissionTree.rootNode,
			zoomPhylo: this.state.PhyloTree.rootNode,
		});
	}
	zoomToNode(type, node) {
		if (type === 'case') {
			// need to get the phylo node that matches (is the mrca of the captured nodes)
			const descendents = [...this.state.transmissionTree.postorder(node)];
			// get phylo nodes that have same name as these samples
			const otherTips = this.state.PhyloTree.externalNodes.filter(
				n => descendents.map(d => d.Id).indexOf(n.name) > -1
			);
			const mrca = this.state.PhyloTree.MRCA(otherTips);
			this.setState({
				zoomPhylo: mrca,
				zoomCase: node,
				colorChange: this.state.colorChange + 1,
			});
		} else {
			// need to get the phylo node that matches (is the mrca of the captured nodes)
			const descendents = [...this.state.PhyloTree.postorder(node)];
			// get phylo nodes that have same name as these samples
			const otherNodes = this.state.transmissionTree.nodeList.filter(
				n => descendents.map(d => d.name).indexOf(n.Id) > -1
			);
			const mrca = this.state.transmissionTree.MRCA(otherNodes);
			this.setState({
				zoomPhylo: node,
				zoomCase: mrca,
				colorChange: this.state.colorChange + 1,
			});
		}
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
	setPhyloColors() {
		if (this.state.byLocation) {
			// color get location of nodes
			const locations = this.state.EpiData.map(d => d.Location).filter(onlyUnique);

			this.state.PhyloTree.externalNodes.forEach(node => {
				// Get location from metadata
				const metaData = this.state.EpiData.filter(x => x.Id === node.name)[0];
				node.color = metaData ? colours['test'][locations.indexOf(metaData.Location)] : colours['grey'];
			});
			[...this.state.PhyloTree.postorder()].forEach(node => {
				if (node.children) {
					const childColors = node.children.map(n => n.color).filter(onlyUnique);
					node.color = childColors.length === 1 ? childColors[0] : childColors; // save for a tie breaker
				}
			});
			// tie break where possible
			const needAttention = [...this.state.PhyloTree.postorder()].filter(node => Array.isArray(node.color));

			for (const trouble of needAttention) {
				// check if the sybling has one of the colors
				const sybling = trouble.parent ? trouble.parent.children.filter(x => x.key !== trouble.key)[0] : false;
				if (sybling && !Array.isArray(sybling.color) && trouble.color.indexOf(sybling.color) > -1) {
					trouble.color = sybling.color;
				} else {
					trouble.color = colours['grey'];
				}
			}
		} else {
			// hard coding in 4 clades for this data set.
			this.state.PhyloTree.externalNodes.forEach((node, i) => {
				// Get location from metadata

				node.color =
					i <= 3
						? colours['test'][0]
						: i <= 13
							? colours['test'][1]
							: i <= 19
								? colours['test'][2]
								: colours['test'][3];
			});
			[...this.state.PhyloTree.postorder()].forEach(node => {
				if (node.children) {
					const childColors = node.children.map(n => n.color).filter(onlyUnique);
					node.color = childColors.length === 1 ? childColors[0] : childColors; // save for a tie breaker
				}
			});
			// tie break where possible
			const needAttention = [...this.state.PhyloTree.postorder()].filter(node => Array.isArray(node.color));

			for (const trouble of needAttention) {
				// check if the sybling has one of the colors
				const sybling = trouble.parent ? trouble.parent.children.filter(x => x.key !== trouble.key)[0] : false;
				if (sybling && !Array.isArray(sybling.color) && trouble.color.indexOf(sybling.color) > -1) {
					trouble.color = sybling.color;
				} else {
					trouble.color = colours['grey'];
				}
			}
		}
		this.setState({ colorChange: this.state.colorChange + 1 });
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
						transmissionTree: this.state.transmissionTree,
						size: [700, 460],
						margin: { top: 0, right: 30, bottom: 50, left: 30 },
						byLocation: this.state.byLocation,
						updateColor: this.updateColor,
						tree: this.state.PhyloTree,
						zoomCase: this.state.zoomCase,
						cases:this.state.data.getNodes()
					}}
				/>
				{/*<Panel
					title="Cases by location"
					child={LocalEpidemic}
					childProps={{
						size: [700, 250],
						margin: { top: 50, right: 50, bottom: 50, left: 50 },
						caseList: this.state.EpiData,
					}}
				/>*/}

				<Panel
					title="Transmission network"
					child={TransmissionGraph}
					childProps={{
						size: [700, 460],
						margin: { top: 0, right: 30, bottom: 50, left: 30 },
						transmissionTree: this.state.transmissionTree,
						selectedCases: this.state.selectedCases,
						selectSample: this.selectSample,
						byLocation: this.state.byLocation,
						tree: this.state.PhyloTree,
						updateColor: this.updateColor,
						zoomToNode: this.zoomToNode,
						zoomCase: this.state.zoomCase,
						resetZoom: this.resetZoom,
						edges:this.state.edges,
						cases:this.state.case,
						data:this.state.data,
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
