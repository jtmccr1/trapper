import {axisLeft, axisBottom} from "d3-axis";
import {select,selectAll} from "d3-selection";
import {scaleLinear,scaleTime} from "d3-scale";
import {easeLinear} from "d3-ease";
import {d3Plot} from "./d3Plot";

export class stackedHistogramChart extends d3Plot{
  static DEFAULT_SETTINGS() {
        return {
      hoverBorder: 2,
      backgroundBorder: 0,
      baubles: [],
      transitionDuration:500,
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
      super();
      this.layout = layout;
      this.margins = margins;

      // merge the default settings with the supplied settings
      this.settings = {...d3Plot.DEFAULT_SETTINGS(), ...stackedHistogramChart.DEFAULT_SETTINGS(), ...settings};
      this.svg=svg;
      }
      /**
       * @override
       * Adds rect-background and rect layers for data addition later
       */
      addDataLayers(){
          if (this.settings.backgroundBorder > 0) {
              this.svgSelection.append("g").attr("class", "rect-background-layer");
          }
          this.svgSelection.append("g").attr("class", "rect-layer");
      }
        update(){
        // get new positions
        this.bins = []; // rest to so will be filled
        this.layout.layout(this.bins);
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


        if (this.settings.backgroundBorder > 0) {
          updateRectBackgrounds.call(this);
      }

      updateRects.call(this);
      this.updateAxis();
      // this.updateAxisBars();

    }
/**
 * Add a hover callback
 * @param {*} action  - object which has 2 functions enter and exit each takes 3 arguments d,i,n d is data n[i] is `this`
 * @param {*} selection  - what to select defaults to .rect class
 */
  onHover(action,selection=null){
      const selected = this.svgSelection.selectAll(`${selection ? selection : ".rect"}`);
      selected.on("mouseover", (d,i,n) => {
          action.enter(d,i,n);
      });
      selected.on("mouseout", (d,i,n) => {
          action.exit(d,i,n);
      });
  }
  onClick(action,selection=null){
    const selected = this.svgSelection.selectAll(`${selection ? selection : ".rect"}`);
    selected.on("click", (d,i,n) => {
        action(d,i,n);
    });
  }

  }
    /**
     * adds or updates rects
     */
function updateRects(){
      const rectLayer = select(this.svg).select(".rect-layer");

    // DATA JOIN
    // Join new data with old elements, if any.
      const rects = rectLayer.selectAll(".rect")
                  .data(this.bins, (c) => `c_${c.data.id}`);
    // ENTER
    // Create new elements as needed.
    const newRects = rects.enter()
      .append("rect")
      .attr("id", (v) => v.id)
      .attr("class", (v) => ["rect",...this.getAnnotations(v.data)].join(" ")) // add attribute classes here
      .attr("x", d => this.scales.x(d.x0) + 1)
      .attr("width", d => Math.max(0, this.scales.x(d.x1) - this.scales.x(d.x0) - 1))
      .attr("y", d => this.scales.y(d.y1))
      .attr("height", d => this.scales.y(d.y0)- this.scales.y(d.y1));

       // update the existing elements
       rects
        .transition()
        .duration(this.settings.transitionDuration)
        .attr("x", d => this.scales.x(d.x0) + 1)
        .attr("width", d => Math.max(0, this.scales.x(d.x1) - this.scales.x(d.x0) - 1))
        .attr("y", d => this.scales.y(d.y1))
        .attr("height", d => this.scales.y(d.y0)- this.scales.y(d.y1));

     // EXIT
    // Remove old elements as needed.
    rects.exit().remove();
    }
function updateRectBackgrounds(){
  const rectBackgroundLayer = this.svgSelection.select(".rect-background-layer");
      // DATA JOIN
    // Join new data with old elements, if any.
    const rects = rectBackgroundLayer.selectAll(".rect-background")
    .data(this.bins, (c) => `cb_${c.data.id}`);
    // ENTER
    // Create new elements as needed.
    const newRects = rects.enter()
    .append("rect")
    .attr("id", (v) => v.id)
    .attr("class", (v) => ["rect-background",...this.getAnnotations(v.data)].join(" ")) // add attribute classes 
    .attr("x", d => this.scales.x(d.x0) + 1)
    .attr("width", d => Math.max(0, this.scales.x(d.x1) - this.scales.x(d.x0) - 1))
    .attr("y", d => this.scales.y(d.y1))
    .attr("height", d => this.scales.y(d.y0)- this.scales.y(d.y1));

    // update the existing elements
    rects
    .transition()
    .duration(this.settings.transitionDuration)
    .attr("x", d => this.scales.x(d.x0) + 1)
    .attr("width", d => Math.max(0, this.scales.x(d.x1) - this.scales.x(d.x0) - 1))
    .attr("y", d => this.scales.y(d.y1))
    .attr("height", d => this.scales.y(d.y0)- this.scales.y(d.y1));

    // EXIT
    // Remove old elements as needed.
    rects.exit().remove();

}

