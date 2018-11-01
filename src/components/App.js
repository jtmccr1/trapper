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
import { onlyUnique } from '../utils/commonFunctions';
import LocalEpidemic from './LocalEpidemic';
import TransmissionPanel from './TransmissionPanel';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = { byLocation: false, selectedCases: [] };
		this.addEpiData = this.addEpiData.bind(this);
		this.addTree = this.addTree.bind(this);
		this.updateView = this.updateView.bind(this);
		this.selectSample = this.selectSample.bind(this);
		this.setPhyloColors = this.setPhyloColors.bind(this);
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
		//tree.nodeList.forEach(n => (n.color = colours['grey'])); // Sets initial color
		newState['PhyloTree'] = tree;
		this.setState(newState, () => this.setPhyloColors());
	};
	updateView = () => {
		this.setState(
			{
				byLocation: !this.state.byLocation,
			},
			() => this.setPhyloColors()
		);
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
		getData('fullLineList.json', this.addEpiData);
		getData('tree.json', this.addTree);
	}

	render() {
		return (
			<div>
				<Header />
				<Panel
					title="Overview"
					child={CasesLinePlot}
					childProps={{
						caseList: this.state.EpiData,
						size: [700, 460],
						margin: { top: 0, right: 30, bottom: 50, left: 30 },
						byLocation: this.state.byLocation,
						updateView: this.updateView,
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
					child={TransmissionPanel}
					childProps={{
						size: [700, 460],
						margin: { top: 0, right: 30, bottom: 50, left: 30 },
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
						colorChange: this.state.colorChange,
						selectedCases: this.state.selectedCases,
						selectSample: this.selectSample,
					}}
				/>
			</div>
		);
	}
}

export default App;
