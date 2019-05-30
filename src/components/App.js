import React from 'react';
import Header from './Header';
import ChartContainer from './ChartContainer';
import "../styles/trapper.css"

function App() {
		return(
			<div className="fillHorizontalSpace">
			<Header />
				<div className="mainScreen">
					<div className="sidebar left">
					<div className="sidebarButton" id="options">
							<h2>Options</h2>
					</div>
					</div>
				<ChartContainer className="fillHorizontalSpace" />
				<div className="sidebar right">
					<div className="sidebarButton" id="map">
						<h2  >Map</h2>
					</div>
					<div className="sidebarButton" id="lineList">
					<h2> Line List</h2>

					</div>
					</div>
				</div>
			</div>
			)
}

export default App;
