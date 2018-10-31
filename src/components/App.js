import React, { Component } from 'react';
import Header from './Header';
import Panel from './CollapsablePanel';
import getData from '../utils/getData';
import CasesLinePlot from './CasesLinePlot';
import PhyloTree from './PhyloTree';
import Tree from '../utils/figtree';
//Styles from Rampart
import { colours } from '../styles/colours';
import '../styles/global'; // sets global CSS
import '../styles/fonts.css'; // sets global fonts
import '../styles/temporary.css'; // TODO
import FixedTransmissionNetwork from './FixedTransmissionNetwork';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = { byLocation: false, selectedCases: [] };
		this.addEpiData = this.addEpiData.bind(this);
		this.addTree = this.addTree.bind(this);
		this.updateView = this.updateView.bind(this);
		this.selectSample = this.selectSample.bind(this);
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
		newState['TransmissionTree'] = transmissionTree;
		this.setState(newState);
	};

	addTree = newData => {
		let newState = this.state;
		const tree = Tree.parseNewick(newData.newick);
		tree.nodeList.forEach(n => (n.color = colours['grey'])); // Sets initial color
		newState['PhyloTree'] = tree;
		this.setState(newState);
	};
	updateView = () => {
		this.setState({
			byLocation: !this.state.byLocation,
		});
	};

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
		getData('fullLineList.json', this.addEpiData);
		getData('tree.json', this.addTree);
	}
	render() {
		return (
			<div>
				<Header />
				<Panel
					title="Cases by location"
					childProps={{
						size: [700, 400],
						margin: { top: 50, right: 50, bottom: 50, left: 50 },
					}}
				/>
				<Panel
					title="New cases overtime"
					child={CasesLinePlot}
					childProps={{
						caseList: this.state.EpiData,
						size: [700, 450],
						margin: { top: 50, right: 50, bottom: 50, left: 50 },
						byLocation: this.state.byLocation,
						updateView: this.updateView,
					}}
				/>
				<Panel
					title="Transmission network"
					child={FixedTransmissionNetwork}
					childProps={{
						size: [700, 400],
						margin: { top: 50, right: 50, bottom: 50, left: 50 },
						transmissionTree: this.state.TransmissionTree,
						selectedCases: this.state.selectedCases,
						selectSample: this.selectSample,
						byLocation: this.state.byLocation,
						tree: this.state.PhyloTree,
						updateView: this.updateView,
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
						updateView: this.updateView,
					}}
				/>
			</div>
		);
	}
}

export default App;
