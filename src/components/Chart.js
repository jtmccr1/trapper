import React, { useEffect,useRef } from 'react';
function Chart(props){

    const el = useRef(null);     

    useEffect(()=>{
        const chart = new props.chart(el.current);
        chart.draw(props.data,props.scales,props.chartGeom,props.callbacks)
    },[]);

    useEffect(()=>{
        const chart = new props.chart(el.current);
        chart.update(props.data,props.scales,props.chartGeom,props.callbacks)
    },[props.data,props.scales,props.chartGeom]);

    return (
        <svg className="chart"
        ref={el}
        height={props.chartGeom.height}
        width={props.chartGeom.width}
    />);
}
export default  Chart;