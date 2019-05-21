import {axisLeft, axisBottom} from "d3-axis";
import {select,selectAll} from "d3-selection";
import {scaleLinear} from "d3-scale";
import {easeLinear} from "d3-ease";
import {histogram,max} from "d3-array"
import {transition} from "d3-transition"

export class histogramChart{
    constructor(ref,...callBacks){
     this.svg = select(ref);
    }
    
    draw(data,scales,chartGeom){
    this.svg.selectAll("g").remove();
    
    const bar = this.svg.append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("fill", "steelblue")
        .attr("x", d => scales.x(d.x0) + 1)
        .attr("width", d => Math.max(0, scales.x(d.x1) - scales.x(d.x0) - 1))
        .attr("y", d => scales.y(d.length))
        .attr("height", d =>  scales.y(0) -  scales.y(d.length));
    
    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
      .call(axisBottom(scales.x));
    this.svg.append("g")
      .attr("class", "y axis")
      .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
        .call(axisLeft(scales.y));
    }
    
    update(data,scales,chartGeom){
      
      this.updateBars(data,scales,chartGeom);
      this.updateAxis(scales,chartGeom);
          
    }
    updateBars(data,scales,chartGeom){
      const bars = this.svg.selectAll("rect").data(data);
        bars.join()
        .attr("x", d => scales.x(d.x0) + 1)
        .attr("width", d => Math.max(0, scales.x(d.x1) - scales.x(d.x0) - 1))
        .attr("y", d => scales.y(d.length))
        .attr("height", d =>  scales.y(0) -  scales.y(d.length))
        .transition()
        .duration(300)
        .ease(easeLinear)
    }
    updateAxis(scales,chartGeom){
          // update axis
      // this.svg.selectAll(".axis").remove()
  
      this.svg.select(".x.axis")
        .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
        .call(axisBottom(scales.x))
        .transition()
        .duration(300)
        .ease(easeLinear)
        ;
      
      this.svg.select(".y.axis")
        .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
        .call(axisLeft(scales.y).ticks(5))
        .transition()
        .duration(300)
        .ease(easeLinear)
    }
    
  }
export function histogramLayout(data,scales,callback=(d)=>d){
    const bins = histogram()
       .domain(scales.x.domain())
       .thresholds(scales.weeks)(data.map(callback))
    const y= scaleLinear().range([...scales.y.range()]).domain([0,max(bins,d=>d.length)]);
    const newScales ={...scales,...{"y":y}};
    return([bins,newScales]);
   }

