import {easeLinear} from 'd3-ease';
import {transition} from "d3-transition";
import {select} from 'd3-selection';
import {scaleLinear,scaleTime} from 'd3-scale';
import {axisBottom,axisTop} from "d3-axis";
import { d3Plot } from './d3Plot';
/** 
 * time Axis
 * settings 
 */
export class XTimeAxis extends d3Plot{
    static DEFAULT_SETTINGS() {
      return {
        transitionDuration:0,
        horizontalRange:[0,1],
        horizontalAxisTicks:[0,0.5,1],
        horizontalScale:scaleLinear
        }
    }
  /**
   * The constuctor
   * @param {*} domain array of first and last dates in axis
   * @param {*} settings ticksUnit : timeWeek is default
   */

constructor(svg,layout,margins,settings = { }){
    super();
    this.layout = layout;

  this.settings = {...XTimeAxis.DEFAULT_SETTINGS(), ...settings};
  // default ranges - these should be set in layout()
  this._horizontalRange = this.settings.horizontalRange;
  this.svg = svg;
  this.margins = margins;
  // To appease the 
}
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
       //
       this.scales={x:this.settings.horizontalScale()
        .domain(this._horizontalRange)
        .range([this.margins.left, width - this.margins.right-this.margins.left]),
        width:width,
        height:height}

       //remove the tree if it is there already
       select(this.svg).select("g").remove();

       // add a group which will contain the new plot
       select(this.svg).append("g")
           .attr("transform",`translate(${this.margins.left},${this.margins.top})`);
        //to selecting every time
        this.svgSelection = select(this.svg).select("g");
        this.svgSelection.append("g").attr("class", "axes-layer");
        
        this.svgSelection.select(".axes-layer")
        .append("g")
        .attr("class", "top axis")
        .attr("id", "x-axis-top")
        .call(axisTop(this.scales.x).tickValues(this.layout.horizontalAxisTicks));

        this.svgSelection.select(".axes-layer")
        .append("g")
        .attr("transform",`translate(0,${(this.scales.height-this.margins.bottom-this.margins.top-50)})`)
        .attr("class", "bottom axis")
        .attr("id", "x-axis-bottom")
        .call(axisBottom(this.scales.x).tickValues(this.layout.horizontalAxisTicks));

}
update(){
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
           //
        this.scales={x:this.settings.horizontalScale()
                        .domain(this._horizontalRange)
                        .range([this.margins.left, width - this.margins.right-this.margins.left]),
                        width:width,
                        height:height}

        this.svgSelection.select("#x-axis-top")
                        .call(axisTop(this.scales.x).tickValues(this.layout.horizontalAxisTicks.map((x,i)=>i%2===0?x:"")))
                        .transition()
                        .duration(this.settings.transitionDuration)
                        .ease(easeLinear);

    this.svgSelection.select("#x-axis-bottom")
                        .attr("transform",`translate(0,${(this.scales.height-this.margins.bottom-this.margins.top)})`)
                        .call(axisBottom(this.scales.x).tickValues(this.layout.horizontalAxisTicks.map((x,i)=>i%2===0?x:"")))
                        .transition()
                        .duration(this.settings.transitionDuration)


                        this.updateAxisBars();
}


get horizontalRange(){
    return this._horizontalRange;
}
}
export default XTimeAxis;