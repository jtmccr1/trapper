import React, {useState} from 'react';
import bins from '../examples/dev/bins'
import Chart from "./Chart"
function ChartContainer(props){

    return(
        <div className = "timelineContainer">
            <Chart  />

        </div>
    )


}

export default  ChartContainer;