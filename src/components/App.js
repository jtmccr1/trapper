import React, {useState,useCallback,useRef} from 'react';
import Header from './Header';
import ChartContainer from './ChartContainer';
import LineList from "./LineList";
import Geography from "./Geography"
import "../styles/trapper.css"

function App() {

	const [optionsOpen,setOptionsOpen] = useState(false);
	const [sideBarOpen,setSideBarOpen] = useState(false);
	const [timelineSize,getTimelineSize] = useState(null);
	const [sideBarFocus,setSideBarFocus] = useState("Geography");
	//Getting the size of the container to pass to children
	// const [handleResize,setHandelResize] = useState(null);
	// const otherRef = useRef(null);
	const measuredRef = useCallback(node => {
        if (node !== null) {
			getTimelineSize({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width})
			const handleResize = () =>  {
              let resizeTimer;
              clearTimeout(resizeTimer);
              resizeTimer = setTimeout(function() {

              // Run code here, resizing has "stopped"
              getTimelineSize({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width});
              }, 250);
			}
			

            window.addEventListener('resize', handleResize);
            return () => {
              window.removeEventListener('resize', handleResize);
            };
        }
	  },[]);

	const getSizeAgain=()=>{
		let resizeTimer;
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function() {
		window.dispatchEvent(new Event('resize'))
		},0); // resize takes 0.4s
	};
	
	  
	  
		return(
			<div className="fillHorizontalSpace">
			<Header />
				<div className="mainScreen">
					<div className={`sidebar left ${optionsOpen? "open":''}`}>
					</div>
					<div className="sidebarButtonColumn">
						<div className="sidebarButtons left">
							<div className="button" onClick={()=> {setOptionsOpen(!optionsOpen);getSizeAgain();}}>
								 <h3>Options</h3>
							</div>
						</div>
					</div>
					<ChartContainer  ref = {measuredRef} timelineSize = {timelineSize}/>
					<div className="sidebarButtonColumn">
						<div className="sidebarButtons right">
							<div className="button" onClick={()=> {
																											if(sideBarOpen&&sideBarFocus!=="Geography"){
																												setSideBarFocus("Geography")
																											}else{
																												setSideBarOpen(!sideBarOpen)
																												setSideBarFocus("Geography")
																											}
																											getSizeAgain();
																											}}>
								 <h3>Map</h3>
							</div>
							<div className="button" onClick={()=> 	{
																											if(sideBarOpen&&sideBarFocus!=="LineList"){
																												setSideBarFocus("LineList")
																											}else{
																												setSideBarOpen(!sideBarOpen)
																												setSideBarFocus("LineList")
																											}
																											getSizeAgain();}}>
								 <h3>Line List</h3>
							</div>
						</div>
					</div>
					<div className={`sidebar right ${sideBarOpen? "open":''}`}>
					{sideBarFocus==="Geography"?
                        <div className = "geographyContainer">
                            <Geography data={mapTopoJSON} margins={margins} size={{height: "500px", width: "500px"}} />
                        </div>
						:<LineList/>}
					</div>
				</div>
			</div>
			)
}

export default App;
