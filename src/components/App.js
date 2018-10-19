import React, { Component } from 'react';
import Header from './Header';
import Panel from './CollapsablePanel';

class App extends Component {
	render() {
		return (
			<div>
				<Header />
				<Panel title="Cases by location" />
				<Panel title="Cases overtime" />
				<Panel title="Transmission network" />
				<Panel title="Phylogeny" />
			</div>
		);
	}
}

export default App;
