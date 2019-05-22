import {axisLeft, axisBottom} from "d3-axis";
import {select,selectAll} from "d3-selection";
import {scaleLinear} from "d3-scale";
import {easeLinear} from "d3-ease";
import {max} from "d3-array";
import {nest} from "d3-collection";
import {timeWeek} from "d3-time"
import {createReferenceColours} from "../../utils/colours"
import {transition} from "d3-transition"

export class stackedHistogramChart{
    constructor(ref){
     this.svg = select(ref);
     this.referenceColours= createReferenceColours();
    }
    
    draw(data,scales,chartGeom,callbacks={}){
    this.svg.selectAll("g").remove();
    
    const bar = this.svg.append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("fill", d=>this.referenceColours[scales.keys.indexOf(d.key)])
        .attr("x", d => scales.x(d.x0) + 1)
        .attr("width", d => Math.max(0, scales.x(d.x1) - scales.x(d.x0) - 1))
        .attr("y", d => scales.y(d.y1))
        .attr("height", d =>  scales.y(d.y0) -  scales.y(d.y1));

        if(Object.keys(callbacks).indexOf("handleMouseOver")>-1){
          bar.on("mouseover", d=>callbacks.handleMouseOver(d))
          bar.on("mouseout", d=>callbacks.handleMouseOut(d));
        }
        if(Object.keys(callbacks).indexOf("handleClick")>-1){
          bar.on("click", d=>callbacks.handleClick(d))
        }
    
    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
      .call(axisBottom(scales.x));
    this.svg.append("g")
      .attr("class", "y axis")
      .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
        .call(axisLeft(scales.y));
    }
    
    update(data,scales,chartGeom,callbacks={}){
      
      this.updateBars(data,scales,callbacks);
      this.updateAxis(scales,chartGeom);
          
    }
    updateBars(data,scales,callbacks={}){
      const bar = this.svg.selectAll("rect").data(data);
        bar.join()
        .attr("x", d => scales.x(d.x0) + 1)
        .attr("width", d => Math.max(0, scales.x(d.x1) - scales.x(d.x0) - 1))
        .attr("y", d => scales.y(d.y1))
        .attr("height", d =>  scales.y(d.y0) -  scales.y(d.y1))
        .transition()
        .duration(300)
        .ease(easeLinear)

        if(Object.keys(callbacks).indexOf("handleMouseOver")>-1){
          bar.on("mouseover", d=>callbacks.handleMouseOver(d))
          bar.on("mouseout", d=>callbacks.handleMouseOut(d));
        }
        if(Object.keys(callbacks).indexOf("handleClick")>-1){
          bar.on("click", d=>callbacks.handleClick(d))
        }
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
export function stackedHistogramLayout(data,scales,callbacks={"groups":d=>1}){
    const dateBins = nest().key(d=>timeWeek.floor(d.symptomOnset))
                        .key(d=>callbacks.groups(d))
                        .entries(data)
                        .map(d=>({"x0":timeWeek(new Date(d.key)),"x1":timeWeek.offset(new Date(d.key),1),"values":d.values}));    
    //get the keys used to bin the data
    const keys= dateBins.reduce((acc,curr) =>{
                                    curr.values.forEach(c=>{    
                                                        if(acc.indexOf(c.key)===-1){
                                                            acc.push(c.key)
                                                        };
                                                    });
                                                    return(acc)},[]);
    const laidOutData=[];
    let currentCount=0;
    let maxCount=0;
    for(const week of dateBins){
        currentCount=0;
        for(const k of keys){
            const kEntry = week.values.filter(w=>w.key===k);
            const entry = {"x0":week.x0,"x1":week.x1,"key":k};
            if(kEntry.length===0){
                entry.cases=[];
                entry.y0=currentCount;
                entry.y1=currentCount;
            }else{
                entry.cases=kEntry[0].values;
                entry.y0=currentCount;
                entry.y1=currentCount+entry.cases.length;
                currentCount=entry.y1;
            }
            laidOutData.push(entry);
        }
        maxCount=max([maxCount,currentCount])
    }
    //updating ydomain.
    const y= scaleLinear().range([...scales.y.range()]).domain([0,maxCount]);
    const newScales ={...scales,...{"y":y,"keys":keys}};
    return([laidOutData,newScales]);
   }

