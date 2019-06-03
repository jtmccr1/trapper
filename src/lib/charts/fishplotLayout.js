import {Outbreak} from "../outbreak/Outbreak.js";
import {max, sum,min,extent} from 'd3-array';
import {timeWeek} from 'd3-time';
import {scaleLinear} from 'd3-scale';
import { d3PlotLayout } from "./d3PlotLayout.js";

/**
 * The Fishplot layout
 * This takes an epidemic object and calculates the total number of cases at each time point and the relative contribution
 * of each outbreak. It returns a points arrary with with a y0 and y1 for each x for each outbreak in the epidemic.
 */


export class fishLayout extends d3PlotLayout{  
  static DEFAULT_SETTINGS() {
    return {
        horizontalRange:null,
        horizontalTicks:null,
        horizontalScale:scaleLinear,
    }
}
  /**
   * The constructor 
   * @param {Epidemic} And epidemic object Epidemic 
   * @param {*} settings 
   */
    constructor (Epidemic,settings){
      super();
      this.settings = {...fishLayout.DEFAULT_SETTINGS(), ...settings};
      this.backgroundOutbreak=new Outbreak("background",null,[]);
      this.backgroundOutbreak.addChild(Epidemic.rootOutbreak)
      this.gapMap = new Map();
      this.setGapMap();
      this.points = [];
      // Defualt ranges
      this._horizontalRange = [0.0, 1.0];
      this._verticalRange = [1.0, 0];
      this._horizontalTicks= this.settings.horizontalScale()
      .domain(this._horizontalRange).ticks(5)
     }
    // This adds a parent entry to each outbreak that has one.
    

    /**
     * creates a map that has each outbreak as a key. with values that are maps with timepoints as the key
     * And values that are arrays of [space on top, ... space between child 1 and child 2, space between child2& 3 ..., space between childLast and bottom]
     */
    setGapMap(){
      // get every time point
      const totalCourse = this.backgroundOutbreak.timeCourse;
      for(const outbreak of [...this.backgroundOutbreak.preorder()]){
        const timeGap = new Map();
        const timeCourse = outbreak.timeCourse;
       for(const time of outbreak.timePoints){
          const timePoint = timeCourse.has(time)? timeCourse.get(time): {time:new Date(time), cases:0,totalDescendents:0}
          // The % of total cases at this time point that can be attributed the this outbreak and it's dependents.
         timePoint.percent = totalCourse.get(time)["totalDescendents"]!==0?timePoint.totalDescendents/totalCourse.get(time)["totalDescendents"]:0;
         // what percent of this outbreak's space is attributed to it's children in raw total percent
         const childrenSpace = timePoint.totalDescendents!==0? ((timePoint.totalDescendents-timePoint.cases)/timePoint.totalDescendents)*timePoint.percent:0;
         
         let activeChildren = 0;
         if( childrenSpace>0){
            //how many children have cases at this time
           activeChildren =  outbreak.children
                                .filter(chap=>chap.timeCourse.has(time) && chap.timeCourse.get(time).totalDescendents>0).length
         }
         
         // how much space is there to divy up between the top, bottom and between children
        const innerSpace =(timePoint.percent-childrenSpace);///(activeChildren+1);
         // we want most of the space to be on top so the children curves aren't pulled up buy the parent
         // ~75% of gap on top. ~20% at bottom 5% between children
         // an array of 0.05/# of children
        //  const kidGaps = Array(max([(activeChildren-1),0])).fill(0.05/(activeChildren-1));
        //  the line above was causing issues I'm just doing how many children.
        
        //  const innerSpaceArray = [0.85,...kidGaps,(1-0.85-sum(kidGaps))].map(d=>d*innerSpace);
         const numberOfKidGaps = outbreak.children?outbreak.children.length:0;
         const kidGaps = Array(max([(numberOfKidGaps-1),0])).fill(0.05/(numberOfKidGaps-1));
        const innerSpaceArray = [0.85,...kidGaps,(1-0.85-0.1)].map(d=>d*innerSpace);
         // inner space Arrary is [space on top, ... space between child 1 and child 2, space between child2& 3 ..., space between childLast and bottom]
          timeGap.set(time,innerSpaceArray);
       }
      this.gapMap.set(outbreak,timeGap);   
      }
      
    }
    /** Sets the points the child outbreak of the provided outbreak. This is called 
     * recursively.
    */

    setPoints(outbreak = this.backgroundOutbreak){
      // Get all the time points of the data
      const totalCourse = this.backgroundOutbreak.timeCourse;
      // Get the gapMap of the of the outbreak. 
      const gapMap = this.gapMap.get(outbreak);
      // will be updated overtime to account for the space from the top outbreak
      // that has been taken up at each point.
      let i=0;
      const spaceFilled= new Map(outbreak.timePoints.map(t=>[t,gapMap.get(t)[i]]));
       // starts as just the top gaps.
      // fillPoints 
      for(const childOutbreak of outbreak.children){
         let points = [];
         const timeCourse = childOutbreak.timeCourse;
        for(const time of childOutbreak.timePoints){
          const timePoint = timeCourse.get(time);
          //Each time point has the total descendents of that outbreak at this time and the cases in this particular outbreak.
          timePoint.percent = totalCourse.get(time)["totalDescendents"]>0?timePoint.totalDescendents/totalCourse.get(time)["totalDescendents"]: 0;
          const parentTop =getStartingDistance.call(this,childOutbreak,time);
          const point = {time:time,y1:parentTop-spaceFilled.get(time),
                         y0:parentTop-spaceFilled.get(time)-timePoint.percent,
                         data:childOutbreak,
                         total:totalCourse.get(time).totalDescendents}
          this.addAnnotations({outbreakId:childOutbreak.id,location:childOutbreak.location})
          points.push(point) 
          spaceFilled.set(time,spaceFilled.get(time)+timePoint.percent+gapMap.get(time)[i+1]);
        }
        // clean up final point.
        //
        if(points.length>0){ // if there is no time data for this then we can't place it.
        const first0T = max(points.filter(p=>p.y1===p.y0),d=>d.time);
        const first0 = points.filter(p=>p.time===first0T)[0];
        const lastTP= max(points.filter(p=>p.y1!==p.y0),d=>d.time);
        const lastT = points.filter(p=>p.time===lastTP)[0];

        points = points.filter(p=>p.time<first0.time);
        
        const smoothingPoint = {time : first0.time, 
                                y1:(lastT.y1+lastT.y0)/2, 
                                y0:(lastT.y1+lastT.y0)/2,
                                data:lastT.data,
                                total:first0.total};
                                
        points.push(smoothingPoint);
        
        //add smoothStart
        const firstTP = min(points,d=>d.time);
        
        const firstT = points.filter(p=>p.time===firstTP)[0];
        
        const newFirstTP = timeWeek.offset(firstTP,-1).getTime();
        
        const totalAtTheTime = totalCourse.has(newFirstTP)&&totalCourse.get(newFirstTP)["totalDescendents"]>0?totalCourse.get(newFirstTP)["totalDescendents"]:0
        
        const easyStart =  {time : newFirstTP, 
                                y1:(firstT.y1+firstT.y0)/2, 
                                y0:(firstT.y1+firstT.y0)/2,
                                data:firstT.data,
                                total:totalAtTheTime};
        
        
        points.unshift(easyStart);
        }else{
          console.log(`no time points found for outbreak ${childOutbreak.id} The samples may be missing data`)
        }
        points.sort((a,b)=>a.time-b.time);
        this.points.push(points);
        i+=1;
        this.setPoints(childOutbreak);
      }
      
    }

    layout(input_points){
      this.points = [];
      this.setPoints();
      input_points.push(...this.points);

      if(!this.settings.horizontalRange){
        this._horizontalRange = extent(this.points.reduce((acc,curr)=>[...acc,...curr],[]),k=>new Date(k.time));
      }else{
        this._horizontalRange=this.settings.horizontalRange;
    }
    
    if(!this.settings.horizontalTicks){
        this._horizontalTicks= this.settings.horizontalScale()
            .domain(this._horizontalRange).ticks(5)
    }else{
        this._horizontalTicks=this.settings.horizontalTicks;
    }
      this._verticalRange = extent(this.points.reduce((acc,curr)=>[...acc,...curr],[]),k=>k.total*k.y1)
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
    get horizontalAxisTicks(){
      return this._horizontalTicks;
  }
  }

  
  function getStartingDistance(outbreak,t){
    // points is an array of arrays each inner array is an oubreak we want the one with the parent.
    const parentPoints = this.points.find(d=>d[0].data===outbreak.parent);
    if(typeof parentPoints==='undefined'){
      // The parent outbreak is the background outbreak
      return 1;
    }
    const atThisTime = parentPoints.find(p=>p.time===t)
    return(atThisTime.y1);
  }