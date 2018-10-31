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

class App extends Component {
	constructor(props) {
		super(props);
		this.state = { View: 'userSelect' };
		this.addEpiData = this.addEpiData.bind(this);
		this.addTree = this.addTree.bind(this);
		this.updateView = this.updateView.bind(this);
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
		newState['EpiData'] = newData;
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
			View: this.state.View === 'byLocation' ? 'userSelect' : 'byLocation',
		});
	};
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
						view: this.state.View,
						updateView: this.updateView,
					}}
				/>
				<Panel
					title="Transmission network"
					childProps={{
						size: [700, 400],
						margin: { top: 50, right: 50, bottom: 50, left: 50 },
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
						view: this.state.View,
						updateView: this.updateView,
					}}
				/>
			</div>
		);
	}
}

export default App;
