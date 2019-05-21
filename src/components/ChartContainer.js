import React, {useState,useCallback} from 'react';
import bins from '../examples/dev/bins'
import Chart from "./Chart"
function ChartContainer(props){

   const [domRect,setDomRect]=useState(0);

    const measuredRef = useCallback(node => {
        if (node !== null) {
            // setDomRect({...node.getBoundingClientRect()})
            console.log(node.getBoundingClientRect())
            const handleResize = () =>  {
                setDomRect(node.getBoundingClientRect());

            }
            window.addEventListener('resize', handleResize);
            return () => {
              window.removeEventListener('resize', handleResize);
            };
        }
      });
    return(
        <div className = "timelineContainer" ref={measuredRef}>
            
        </div>
    )
    // <Chart  />
}

export default  ChartContainer;