import React, {useCallback, useState} from 'react';
import 'react-table/react-table.css';
import {select} from "d3-selection";

function Geography(){
    const [map, setMap] = useState(null);

    const width = props.size.width;
    const height = props.size.height;
    const mapData = props.data;

    // center on UK
    const projection = d3.geo.mercator()
        .center([3.4360, 55.3781])
        .scale(1000)
        .translate([width / 2, height / 2]);

    const path = d3.geo.path()
        .projection(projection);

    const zoom = d3.behavior.zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .scaleExtent([height, 8 * height])
        .on("zoom", zoomed);

    const adm0 = topojson.feature(mapData, mapData.objects.adm0);
    const adm1 = topojson.feature(mapData, mapData.objects.adm1);

    const el = useCallback(svgNode => {

        if (svgNode !== null) {

            if(svgNode.children.length===0) { // make it the first time

                //to selecting every time
                const svg = select(svgNode);

                const g = svg.append("g")
                    .call(zoom);

                g.append("rect")
                    .attr("class", "background")
                    .attr("width", width)
                    .attr("height", height);

                g.append("g")
                    .attr("id", "adm1")
                    .selectAll("path")
                    .data(adm1.features)
                    .enter().append("path")
                    .attr("class", "adm1")
                    .attr("id", (d) => d.properties.name)
                    .attr("d", path);

                g.append("g")
                    .attr("id", "adm0")
                    .selectAll("path")
                    .data(adm0.features)
                    .enter().append("path")
                    .attr("class", "adm0")
                    .attr("id", (d) => d.properties.name)
                    .attr("d", path);

            // }else{
            //     update?
            }
        }});

    return(
        <svg className="chart" id={"map"}
             ref={el}
             height={props.size.height}
             width={props.size.width}
        />);
}

export default Geography;