import React, {useState,useCallback} from 'react';
import bins from '../examples/dev/bins'
import Chart from "./Chart"
function ChartContainer(props){

   const [domRect,setDomRect]=useState({});

    const measuredRef = useCallback(node => {
        if (node !== null) {
            setDomRect({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width})
            console.log({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width})
            const handleResize = () =>  {
                setDomRect({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width});

            }
            window.addEventListener('resize', handleResize);
            return () => {
              window.removeEventListener('resize', handleResize);
            };
        }
      },[]);
    return(
        <div className = "timelineContainer" ref={measuredRef}>
            <Chart  parentDimensions={domRect}/>
        </div>
    )
    // <Chart  />
}

export default  ChartContainer;