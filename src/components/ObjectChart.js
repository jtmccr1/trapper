import React, { useEffect,useRef } from 'react';
const ObjectChart = React.forwardRef((props,ref)=>{

    return (
        <svg className="chart"
        ref={ref}
        height={props.chartGeom.height}
        width={props.chartGeom.width}
    />);
});
export default  ObjectChart;