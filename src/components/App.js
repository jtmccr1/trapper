import React, {useState} from 'react';
import Header from './Header';
import ChartContainer from './ChartContainer';
import "../styles/trapper.css"

function App() {

	const [optionsOpen,setOptionsOpen] = useState(false);
	const [sideBarOpen,setSideBarOpen] = useState(false);

		return(
			<div className="fillHorizontalSpace">
			<Header />
				<div className="mainScreen">
					<div className={`sidebar left ${optionsOpen? "open":''}`}>
					<div className="sidebarButton" id="options" onClick={()=> {setOptionsOpen(!optionsOpen)}}>
							<h2>Options</h2>
					</div>
					</div>
				<ChartContainer className="fillHorizontalSpace" />
				<div className={`sidebar right ${sideBarOpen? "open":''}`}>
					<div className="sidebarButton" id="map" onClick={()=> {setSideBarOpen(!sideBarOpen)}}>
						<h2 >Map</h2>
					</div>
					<div className="sidebarButton" id="lineList" onClick={()=> {setSideBarOpen(!sideBarOpen)}}>
					<h2> Line List</h2>

					</div>
					</div>
				</div>
			</div>
			)
}

export default App;
