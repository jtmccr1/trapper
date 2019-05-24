import {axisLeft, axisBottom} from "d3-axis";
import {select,selectAll} from "d3-selection";
import {scaleLinear,scaleTime} from "d3-scale";
import {easeLinear} from "d3-ease";
import {max,min} from "d3-array";
import {nest} from "d3-collection";
import {timeWeek} from "d3-time"
import {transition} from "d3-transition"

export class stackedHistogramChart{
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
      this.layout = layout;
      this.margins = margins;

      // merge the default settings with the supplied settings
      this.settings = {...stackedHistogramChart.DEFAULT_SETTINGS(), ...settings};
      this.svg=svg;
      }
    
    draw(){
       // get the size of the svg we are drawing on
       let width,height;
       if(Object.keys(this.settings).indexOf("width")>-1){
           width =this. settings.width;
       }else{
           width = this.svg.getBoundingClientRect().width;
       }
       if(Object.keys(this.settings).indexOf("height")>-1){
           height =this.settings.height;
       }else{
           height = this.svg.getBoundingClientRect().height;
       }

       //remove the tree if it is there already
       select(this.svg).select("g").remove();

       // add a group which will contain the new plot
       select(this.svg).append("g")
           .attr("transform",`translate(${this.margins.left},${this.margins.top})`);

        //to selecting every time
        this.svgSelection = select(this.svg).select("g");

        this.svgSelection.append("g").attr("class", "axes-layer");
        if (this.settings.backgroundBorder > 0) {
            this.svgSelection.append("g").attr("class", "rect-background-layer");
        }
        this.svgSelection.append("g").attr("class", "rect-layer");
        // create the scales
        const xScale = scaleTime()
        .domain(this.layout.horizontalRange)
        .range([this.margins.left, width - this.margins.right-this.margins.left]);
        //height is total 
        const yScale = scaleLinear()
            .domain(this.layout.verticalRange)
            .range([height -this.margins.bottom-this.margins.top,this.margins.top]);

        this.scales = {x:xScale, y:yScale, width, height};
        addAxis.call(this, this.margins);

        this.bins=[]; 
        // Called whenever the layout changes...
          this.layout.updateCallback = () => {
                this.update();
            }
    
            this.update();
        }

        update(){
        // get new positions
        this.bins = []; // rest to so will be filled
        this.layout.layout(this.bins);
        // svg may have changed sizes
        let width,height;
        if(Object.keys(this.settings).indexOf("width")>-1){
            width =this. settings.width;
        }else{
            width = this.svg.getBoundingClientRect().width;
        }
        if(Object.keys(this.settings).indexOf("height")>-1){
            height =this. settings.height;
        }else{
            height = this.svg.getBoundingClientRect().height;
        }
        // update the scales' domains
        this.scales.x.domain(this.layout.horizontalRange).range([this.margins.left, width - this.margins.right-this.margins.left]);
        this.scales.y.domain(this.layout.verticalRange).range([height -this.margins.bottom-this.margins.top,this.margins.top]);
        this.scales.width=width;
        this.scales.height=height;

        updateAxis.call(this);

        if (this.settings.backgroundBorder > 0) {
          updateRectBackgrounds.call(this);
      }

      updateRects.call(this);

    }
/**
 * Add a hover callback
 * @param {*} action  - object which has 2 functions enter and exit each takes 3 arguments d,i,n d is data n[i] is `this`
 * @param {*} selection  - what to select defaults to .rect class
 */
  onHover(action,selection=null){
      const selected = this.svgSelection.selectAll(`${selection ? selection : ".rect"}`);
      console.log(selected);
      selected.on("mouseover", (d,i,n) => {
          action.enter(d,i,n);
      });
      selected.on("mouseout", (d,i,n) => {
          action.exit(d,i,n);
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
      .attr("class", (v) => ["rect"].join(" ")) // add attribute classes here
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
    .attr("class", (v) => ["rect-background"].join(" ")) // add attribute classes 
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
function addAxis(){
  const axesLayer = this.svgSelection.select(".axes-layer");
    axesLayer.append("g")
      .attr("class", "x axis")
      .attr("id", "x-axis")
      .attr("transform", `translate(0, ${this.scales.height - this.margins.bottom + 5})`)
      .call(axisBottom(this.scales.x));

      axesLayer.append("g")
      .attr("class", "y axis")
      .attr("id", "y-axis")
        .attr("transform", `translate(${this.margins.left },0)`)
        .call(axisLeft(this.scales.y));
    }
    

  function updateAxis(){
          // update axis
  
      this.svgSelection.select("#x-axis")
        .call(axisBottom(this.scales.x))
        .transition()
        .duration(this.settings.transitionDuration)
        .ease(easeLinear)
        ;
      
      this.svgSelection.select("#y-axis")
      .attr("transform", `translate(${this.margins.left.height },0)`)
      .call(axisLeft(this.scales.y).ticks(5))
        .transition()
        .duration(this.settings.transitionDuration)
        .ease(easeLinear)
    }
    
  
/** 
 * StackedHisogram layout
 * settings 
 */
export class stackedHistogramLayout{
      static DEFAULT_SETTINGS() {
        return {
            groupingFunction:d=>1,
            binnedFunction:d=>timeWeek.floor(d.symptomOnset),
            keyToXFunction:{x0:d=>timeWeek(new Date(d.key)),x1: d=>timeWeek.offset(new Date(d.key),1)}
            
        };
    }
    /**
     * The constuctor
     * @param {*} data which will be binned and  grouped 
     * @param {*} settings functions that will bin and group (color) the data
     *                    groupingFunction:d=>1 - given the data assign it a group for coloring
     *                    binnedFunction:d=>timeWeek.floor(d.symptomOnset), - given the data point return category for binning will be used as key in d3.nest
                          keyToXFunction:{x0:d=>timeWeek(new Date(d.key)), -given the key (from above) convert to x0 and x1 on axis.
                                          x1: timeWeek.offset(new Date(d.key),1)
     */
  constructor(data,settings = { }){
    this.settings = {...stackedHistogramLayout.DEFAULT_SETTINGS(), ...settings};
    this.data = data;
    // default ranges - these should be set in layout()
    this._horizontalRange = [0.0, 1.0];
    this._verticalRange = [1.0, 0];
}
  /**
   * Layout the data. Given a bins array population the arrary with one entry per datapoint with x0,x1 positions and y0,y1
   * This will stack the data from each bin ordered by group.
   * @param {*} bins 
   */
  layout(bins){
            const dateBins = nest().key(d=>timeWeek.floor(d.symptomOnset))
            .entries(this.data)
            .map(d=>({"x0":timeWeek(new Date(d.key)),"x1":timeWeek.offset(new Date(d.key),1),"values":d.values}));    
       
       //get the keys used to group the data within each bin

        const groupKeys= this.data.map(d=>this.settings.groupingFunction(d)).reduce((acc,curr) =>{
                                            if(acc.indexOf(curr)===-1){
                                                acc.push(curr)
                                            };
                                            return(acc)},[]);
                                        
        let currentCount=0;
        let maxCount=0;
        for(const time of dateBins){
        currentCount=0;
        for(const k of groupKeys){
        const kEntry = time.values.filter(w=>this.settings.groupingFunction(w)===k);
        const entry = {"x0":time.x0,"x1":time.x1,"colorKey":k}; // key is used for color
        if(kEntry.length>0){
        for(const data of kEntry){
          const caseEntry = {...entry,...{"data":data}};
          caseEntry.y0=currentCount;
          caseEntry.y1=currentCount+1;
          currentCount+=1;
          bins.push(caseEntry);
          }
          }
        }
        maxCount=max([maxCount,currentCount])
        }
        this._horizontalRange = [min(dateBins,d=>d.x0),max(dateBins,d=>d.x1)];
        this._verticalRange = [0,maxCount];
      }
      update() {
        this.updateCallback();
    }
    get horizontalRange() {
      return this._horizontalRange;
  }

  get verticalRange() {
      return this._verticalRange;
  }
          
  }

