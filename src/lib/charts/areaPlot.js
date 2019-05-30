import {axisLeft, axisBottom} from "d3-axis";
import {select,selectAll} from "d3-selection";
import {scaleLinear,scaleTime} from "d3-scale";
import {easeLinear} from "d3-ease";
import {max,min} from "d3-array";
import {area,curveBasis} from "d3-shape";
import {timeWeek} from "d3-time"
import {transition} from "d3-transition"
import { d3Plot } from "./d3Plot";

export class areaPlot extends d3Plot{
  static DEFAULT_SETTINGS() {
        return {
      hoverBorder: 2,
      transitionDuration:300,
      curve:curveBasis,
        }
      }
      /**
       * The constructor
       * @param {*} svg 
       * @param {*} layout 
       * @param {*} margins top,bottom,left,right
       * @param {*} settings 
       */
    constructor(svg, layout, margins, settings = {}){
        super()
      this.layout = layout;
      this.margins = margins;

      // merge the default settings with the supplied settings
      this.settings = {...d3Plot.DEFAULT_SETTINGS(),...areaPlot.DEFAULT_SETTINGS(), ...settings};
      this.svg=svg;
      }
    
        addDataLayers(){
            this.svgSelection.append("g").attr("class", "area-layer");
        }
        update(){
        // get new positions
        this.points = []; // rest to so will be filled
        this.layout.layout(this.points);
        // svg may have changed sizes
        let width,height;
        if(Object.keys(this.settings).indexOf("width")>-1){
            width =this.settings.width;
        }else{
            width = this.svg.getBoundingClientRect().width;
        }
        if(Object.keys(this.settings).indexOf("height")>-1){
            height =this.settings.height;
        }else{
            height = this.svg.getBoundingClientRect().height;
        }
        // update the scales' domains
        this.scales.x.domain(this.layout.horizontalRange).range([this.margins.left, width - this.margins.right-this.margins.left]);
        this.scales.y.domain(this.layout.verticalRange).range([height -this.margins.bottom-this.margins.top,this.margins.top]);
        this.scales.width=width;
        this.scales.height=height;

        // updateAxis.call(this);

      updateAreas.call(this);
      this.updateAxis();
      // this.updateAxisBars();

    }
/**
 * Add a hover callback
 * @param {*} action  - object which has 2 functions enter and exit each takes 3 arguments d,i,n d is data n[i] is `this`
 * @param {*} selection  - what to select defaults to .rect class
 */
  // onHover(action,selection=null){
  //     const selected = this.svgSelection.selectAll(`${selection ? selection : "path"}`);
  //     selected.on("mouseover", (d,i,n) => {
  //         action.enter(d,i,n);
  //     });
  //     selected.on("mouseout", (d,i,n) => {
  //         action.exit(d,i,n);
  //     });
  // }
//   onClick(action,selection=null){
//     const selected = this.svgSelection.selectAll(`${selection ? selection : "path"}`);
//     selected.on("click", (d,i,n) => {
//         action(d,i,n);
//     });
//   }
}

function updateAreas(){
    const areaMaker = area()
    .x(d => this.scales.x(new Date(d.time)))
    .y0(d=> this.scales.y(d.y0*d.total))
    .y1(d => this.scales.y(d.y1*d.total))
    .curve(curveBasis)
  // DATA JOIN
    // Join new data with old elements, if any.
    const areas = this.svgSelection.select(".area-layer")
        .selectAll("path")
        .data(this.points,d=>d[0].data.id);
    // ENTER
    // Create new elements as needed.
       const newAreas=areas.enter()
        .append("path")
        .attr("class", (d) => ["fishArea",...this.getAnnotations(d[0].data)].join(" ")) // add attribute classes here
        .attr("stroke-width",4)
        .attr("stroke",d=>"black")
        .attr("d", d => areaMaker(d))
       // update the existing elements
    areas
    .transition()
    .duration(this.settings.transitionDuration)
    .attr("d", d => areaMaker(d));
     // EXIT
    // Remove old elements as needed.
    areas.exit().remove();
};

function updateAxis(){
        // update axis
    
    this.svgSelection.select("#y-axis")
    .attr("transform", `translate(${this.margins.left.height },0)`)
    .call(axisLeft(this.scales.y).ticks(5))
      .transition()
      .duration(this.settings.transitionDuration)
      .ease(easeLinear)
  }
  