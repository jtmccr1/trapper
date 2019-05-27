import {easeLinear} from 'd3-ease';
import {transition} from "d3-transition";
import {select} from 'd3-selection';
import {scaleTime} from 'd3-scale';
import {axisBottom} from "d3-axis";
/** 
 * time Axis
 * settings 
 */
export class XTimeAxis{
    static DEFAULT_SETTINGS() {
      return {
        transitionDuration:500,
        axisStyle:axisBottom,
      };
  }
  /**
   * The constuctor
   * @param {*} domain array of first and last dates in axis
   * @param {*} settings ticksUnit : timeWeek is default
   */

constructor(svg,domain,margins,settings = { }){
  this.settings = {...XTimeAxis.DEFAULT_SETTINGS(), ...settings};
  // default ranges - these should be set in layout()
  this._horizontalRange = domain;
  this.svg = svg;
  this.margins = margins;
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
       this.scales={x:scaleTime().domain(this._horizontalRange).range([0,width-this.margins.left-this.margins.right]),
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
        .attr("class", "x axis")
        .attr("id", "x-axis")
        .call(this.settings.axisStyle(this.scales.x));

    
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
           this.scales={x:scaleTime().domain(this._horizontalRange).range([0,width-this.margins.left-this.margins.right]),
                        width:width,
                        height:height}
        this.svgSelection.select("#x-axis")
                        .call(this.settings.axisStyle(this.scales.x))
                        .transition()
                        .duration(this.settings.transitionDuration)
                        .ease(easeLinear);

}
get horizontalRange(){
    return this._horizontalRange;
}
}
export default XTimeAxis;