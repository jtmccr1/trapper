import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {axisBottom,axisLeft} from 'd3-axis';
import {easeLinear} from 'd3-ease';
import {Type} from '../figtree.js/index.js';
/**
 * A master class for each plot that requires each plot implement a draw
 * update, onclick and onhover method.
 */

export class d3Plot{
    static DEFAULT_SETTINGS() {
        return {
      transitionDuration:300,
      xScaleType:scaleLinear,
      yScaleType:scaleLinear,
      yAxisType:axisLeft,
      xAxisType:axisBottom,
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
      this.settings = {...d3Plot.DEFAULT_SETTINGS(), ...settings};
      this.svg=svg;
      }
      /**
       * set up the svg get the size of the svg, translate it to the top
       * left, remove all 'g' and add a g to hold the plot. make a this.svgSelection
       * for easy access later.
       */
      draw(){
            // get the size of the svg we are drawing on
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
 
        //remove the tree if it is there already
        select(this.svg).select("g").remove();
 
        // add a group which will contain the new plot
        select(this.svg).append("g")
            .attr("transform",`translate(${this.margins.left},${this.margins.top})`);
 
         //to selecting every time
         this.svgSelection = select(this.svg).select("g");

         this.svgSelection.append("g").attr("class", "axes-layer");

         this.addDataLayers();
         
         // create the scales
         const xScale = this.settings.xScaleType()
         .domain(this.layout.horizontalRange)
         .range([this.margins.left, width - this.margins.right-this.margins.left]);
         
         //height is total 
         const yScale = this.settings.yScaleType()
             .domain(this.layout.verticalRange)
             .range([height -this.margins.bottom-this.margins.top,this.margins.top]);
 
         this.scales = {x:xScale, y:yScale, width, height};
         this.addAxis();
 
         // Called whenever the layout changes...
           this.layout.updateCallback = () => {
                 this.update();
             }
     
             this.update();
      }
      // adds layers to hold data here. They are the layers referenced in the update call
      addDataLayers(){
      }
      /**
       * An update function to be overwritten by member classes. This takes the svg selection
       * and goes through the join, enter, exit cycle.
       */

      update(){
      }

      /**
     * Add a hover callback
     * @param {*} action  - object which has 2 functions enter and exit each takes 3 arguments d,i,n d is data n[i] is `this`
     * @param {*} selection  - what to select defaults to
     */
    onHover(action,selection=null){
        const selected = this.svgSelection.selectAll(`${selection}`);
        selected.on("mouseover", (d,i,n) => {
            action.enter(d,i,n);
        });
        selected.on("mouseout", (d,i,n) => {
            action.exit(d,i,n);
        });
    }
    onClick(action,selection=null){
    const selected = this.svgSelection.selectAll(`${selection}`);
    selected.on("click", (d,i,n) => {
        action(d,i,n);
    });
    }

    addAxis(){
        const axesLayer = this.svgSelection.select(".axes-layer");  
        if(this.settings.xAxisType){
            axesLayer.append("g")
            .attr("class", "x axis")
            .attr("id", "x-axis")
            .attr("transform", `translate(0, ${this.scales.height - this.margins.bottom + 5})`)
            .call(axisBottom(this.scales.x).tickValues(this.layout.horizontalAxisTicks));
        }
        if(this.settings.yAxisType){
            axesLayer.append("g")
            .attr("class", "y axis")
            .attr("id", "y-axis")
            .attr("transform", `translate(${this.margins.left/2},0)`)
            .call(axisLeft(this.scales.y).ticks(5));
        }
    }
    updateAxis(){
        this.svgSelection.select("#x-axis")
            .call(axisBottom(this.scales.x).tickValues(this.layout.horizontalAxisTicks))
            .attr("transform", `translate(0, ${this.scales.height - this.margins.bottom + 5})`)
            .transition()
            .duration(this.settings.transitionDuration)
            .ease(easeLinear);

        
        this.svgSelection.select("#y-axis")
        .attr("transform", `translate(${this.margins.left/2},0)`)
        .call(axisLeft(this.scales.y).ticks(5))
        .transition()
        .duration(this.settings.transitionDuration)
        .ease(easeLinear)
    }

    updateAxisBars(){
        const axesLayer = this.svgSelection.select(".axes-layer");  
        const ticks = []
        for(let i=0;i<(this.layout.horizontalAxisTicks.length-1);i++){
            ticks.push({x0:this.layout.horizontalAxisTicks[i],
                        x1:this.layout.horizontalAxisTicks[i+1]})
        }
    // DATA JOIN
    // Join new data with old elements, if any.
        const axisBoxes = axesLayer.selectAll(".axis-box")
            .data(ticks)
    // ENTER
    // Create new elements as needed.
    const newBoxes = axisBoxes.enter()
                    .append('rect')
                    .attr("x", d => this.scales.x(d.x0))
                    .attr("width", d =>this.scales.x(d.x1) - this.scales.x(d.x0))
                    .attr("y", d => 0)
                    .attr("height", d => this.scales.height-this.margins.bottom-this.margins.top)
                    .attr("class", (d,i) => i%2===0? `axis-box even`:`axis-box odd`);
    
        axisBoxes
        .transition()
        .duration(this.settings.transitionDuration)
        .attr("x", d => this.scales.x(d.x0))
        .attr("width", d => this.scales.x(d.x1) - this.scales.x(d.x0))
        .attr("y", d => 0)
        .attr("height", d => this.scales.height-this.margins.bottom-this.margins.top)
        .attr("class", (d,i) => i%2===0? `axis-box even`:`axis-box odd`);


        axisBoxes.exit().remove();
    }

    getAnnotations(datum){
       const annotationClasses=[ ...Object.entries(datum)
                            .filter(([key]) => {
                                if(!this.layout.annotations[key]){
                                    return false;
                                }
                                return this.layout.annotations[key].type === Type.DISCRETE ||
                                    this.layout.annotations[key].type === Type.BOOLEAN ||
                                    this.layout.annotations[key].type === Type.INTEGER;
                            })
                            .map(([key, value]) => `${key}-${value}`)];
        return annotationClasses
    }
    
    
}
