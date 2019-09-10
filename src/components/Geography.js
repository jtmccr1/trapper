import React, {props, useRef, useState} from 'react';
import {event, select, selectAll} from "d3";
import {geoAzimuthalEqualArea, geoPath} from "d3-geo";
import {geoCylindricalStereographic} from "d3-geo-projection"
import {feature} from "topojson";

const mouseEnter = (d, i, n)=>{
    select(n[i]).classed("hovered", true);
    // console.log(d)
    let tooltip = document.getElementById("tooltip");
    // put text to display here!
    tooltip.innerHTML =`Location: ${d.data.location}
                        <br/>
                        Cases: 0`;

    tooltip.style.display = "block";

    // this should be dynamically set (i.e., the tooltip box should always be aligned to
    // be visible in the view port).
    tooltip.style.left = event.pageX + (event.pageX > 800? -300 : + 10) + "px";
    tooltip.style.top = event.pageY + 10 + "px";

    tooltip.style.visibility ="visible";
};

const mouseExit = (d,i,n) => {
    select(n[i]).classed("hovered", false);
    const tooltip = document.getElementById("tooltip");
    tooltip.style.visibility = "hidden";
};

function Geography(props){
    const [map, setMap] = useState(null);

    const width = props.size.width;
    const height = props.size.height;
    const mapData = props.data;

    // center on UK
    // const projection = geoAzimuthalEqualArea()
    //     .center([-4, 54.5])
    //     .scale(3000)
    //     .translate([width / 2, height / 2]);

    // center on DRC
    // const projection = geoAzimuthalEqualArea()
    //     .center([29.0460, 0.7918])
    //     .scale(4000)
    //     .translate([width / 2, height / 2]);

  

    // const zoom = d3.behavior.zoom()
    //     .translate(projection.translate())
    //     .scale(projection.scale())
    //     .scaleExtent([height, 8 * height])
    //     .on("zoom", zoomed);
console.log(mapData.objects);
console.log("geo")
    const adm0 = feature(mapData, mapData.objects.adm0);
console.log(adm0);
    const adm1 = mapData.objects.adm1? feature(mapData, mapData.objects.adm1):null;
    let adm2 = mapData.objects.adm2? feature(mapData,   mapData.objects.adm2):null;
    let projection;
    let path;
    if(adm0.features.map(m=>m.id).indexOf("UGA")>-1){
        projection= geoAzimuthalEqualArea()
        .center([29.0460, 0.7918])
        .scale(4000)
        .translate([width / 2, height / 2]);

    }else if(adm1){
        projection = geoAzimuthalEqualArea()
        .center([-4, 54.5])
        .scale(3000)
        .translate([width / 2, height / 2]);

    }

    if(!adm1){
        path=geoPath();
    }else{
        path = geoPath()
            .projection(projection);
    }


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
if(adm1){
    g.append("g")
        .attr("id", "adm1")
        .selectAll("path")
        .data(adm1.features)
        .enter().append("path")
        .attr("class", "adm1")
        .attr("id", (d) => d.properties.name.replace(" ", "-"))
        .attr("d", path);
}


        if(adm2){
    g.append("g")
        .attr("id", "adm2")
        .selectAll("path")
        .data(adm2.features)
        .enter().append("path")
        .attr("class", "adm2")
        .attr("id", (d) => d.properties.name.replace(" ", "-"))
        .attr("d", path);
        }

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