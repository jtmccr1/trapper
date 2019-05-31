import React, {props, useRef, useState} from 'react';
import {select, selectAll} from "d3";
import {geoAzimuthalEqualArea, geoPath} from "d3-geo";
import {feature} from "topojson";

function Geography(props){
    const [map, setMap] = useState(null);

    const width = props.size.width;
    const height = props.size.height;
    const mapData = props.data;

    // center on UK
    const projection = geoAzimuthalEqualArea()
        .center([-4, 54.5])
        .scale(3000)
        .translate([width / 2, height / 2]);

    const path = geoPath()
        .projection(projection);

    // const zoom = d3.behavior.zoom()
    //     .translate(projection.translate())
    //     .scale(projection.scale())
    //     .scaleExtent([height, 8 * height])
    //     .on("zoom", zoomed);

    const adm0 = feature(mapData, mapData.objects.adm0);
    const adm1 = feature(mapData, mapData.objects.adm1);

    // console.log("ADM1: " + JSON.stringify(path(adm1.features[24])));

    const el = useRef();

    // if (el.current !== null) {


    //to selecting every time
    const svg = select(el.current);

    const g = svg.append("g");
    // .call(zoom);

    g.append("rect")
        .attr("class", "map-background")
        .attr("width", width)
        .attr("height", height);

    g.append("g")
        .attr("id", "adm0")
        .selectAll("path")
        .data(adm0.features)
        .enter().append("path")
        .attr("class", "adm0")
        .attr("id", (d) => d.properties.name.replace(" ", "-"))
        .attr("d", path);

    g.append("g")
        .attr("id", "adm1")
        .selectAll("path")
        .data(adm1.features)
        .enter().append("path")
        .attr("class", "adm1")
        .attr("id", (d) => d.properties.name.replace(" ", "-"))
        .attr("d", path);

    // }else{
    //     update?



    return(
        <svg className="chart" id={"map"}
             ref={el}
             height={props.size.height}
             width={props.size.width}
        />);
}

export default Geography;