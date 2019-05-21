import React, { useEffect, useCallback,useState,useRef } from 'react';
function Chart(props){


    const el = useRef(null);     

    const [laidOutData,laidOutScale] = props.layout(props.data,props.scales,props.layoutAccessor);
    useEffect(()=>{
        const chart = new props.chart(el.current);
        chart.draw(laidOutData,laidOutScale,props.chartGeom)
    },[]);

    useEffect(()=>{
        const chart = new props.chart(el.current);
        chart.update(laidOutData,laidOutScale,props.chartGeom)
    },[laidOutData,laidOutScale,props.chartGeom]);

    return (
        <div className="chartContainer" height={`100%`}>
        <svg className="chart"
        ref={el}
        height={props.chartGeom.height}
        width={props.chartGeom.width}
    />
    </div>
);
}
export default  Chart;