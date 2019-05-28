import {Outbreak} from "../outbreak/Outbreak";
import {max, sum,min,extent} from 'd3-array';
import {timeWeek} from 'd3-time';

/**
 * The Fishplot layout
 * This takes an epidemic object and calculates the total number of cases at each time point and the relative contribution
 * of each outbreak. It returns a points arrary with with a y0 and y1 for each x for each outbreak in the epidemic.
 */


export class fishLayout {  
  /**
   * The constructor 
   * @param {Epidemic} And epidemic object Epidemic 
   */
    constructor (Epidemic){
      this.backgroundOutbreak=new Outbreak("background",null,[]);
      this.backgroundOutbreak.addChild(Epidemic.rootOutbreak)
      this.gapMap = new Map();
      this.setGapMap();
      this.points = [];
      // Defualt ranges
      this._horizontalRange = [0.0, 1.0];
      this._verticalRange = [1.0, 0];
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
         const kidGaps = Array(max([(activeChildren-1),0])).fill(0.05/(activeChildren-1));
         const innerSpaceArray = [0.85,...kidGaps,(1-0.85-sum(kidGaps))].map(d=>d*innerSpace);
         // inner space Arrary is [space on top, ... space between child 1 and child 2, space between child2& 3 ..., space between childLast and bottom]
          timeGap.set(time,innerSpaceArray);
       }
      this.gapMap.set(outbreak,timeGap);   
      }
      
    }
    
    setPoints(outbreak = this.backgroundOutbreak){
      // Get all the time points of the data
      const totalCourse = this.backgroundOutbreak.timeCourse;
      // Get the gapMap of the background outbreak - should be of the outbreak.
      const gapMap = this.gapMap.get(outbreak);
      // will be updated overtime to account for the space that has been taken up.
      let i=0;
      const spaceFilled= new Map(outbreak.timePoints.map(t=>[t,gapMap.get(t)[i]])); // starts as just the top gaps.
      // fillPoints 
      for(const childOutbreak of outbreak.children){
         let points = [];
         const timeCourse = childOutbreak.timeCourse;
        for(const time of childOutbreak.timePoints){
          const timePoint = timeCourse.get(time);
          
          timePoint.percent = totalCourse.get(time)["totalDescendents"]>0?timePoint.totalDescendents/totalCourse.get(time)["totalDescendents"]: 0;
          const parentTop =1 - getStartingDistance.call(this,childOutbreak,time);
          const point = {time:time,y1:parentTop-spaceFilled.get(time),
                         y0:parentTop-spaceFilled.get(time)-timePoint.percent,
                         outbreak:childOutbreak,
                         total:totalCourse.get(time).totalDescendents}
          points.push(point) 
          spaceFilled.set(time,spaceFilled.get(time)+timePoint.percent+gapMap.get(time)[i+1]);
        }
        // clean up final point.
  
        const first0T = max(points.filter(p=>p.y1===p.y0),d=>d.time);
        const first0 = points.filter(p=>p.time===first0T)[0];
        const lastTP= max(points.filter(p=>p.y1!==p.y0),d=>d.time);
        const lastT = points.filter(p=>p.time===lastTP)[0];
              
        points = points.filter(p=>p.time<first0.time);
        
        const smoothingPoint = {time : first0.time, 
                                y1:(lastT.y1+lastT.y0)/2, 
                                y0:(lastT.y1+lastT.y0)/2,
                                outbreak:lastT.outbreak,
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
                                outbreak:firstT.outbreak,
                                total:totalAtTheTime};
        
        
        points.unshift(easyStart);
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

      this._verticalRange = extent(this.points.reduce((acc,curr)=>[...acc,...curr],[]),k=>k.total*k.y1)
      this._horizontalRange = extent(this.points.reduce((acc,curr)=>[...acc,...curr],[]),k=>new Date(k.time));
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

  
  function getStartingDistance(outbreak,t){
    let currentOutbreak= outbreak;
    let thereAreGrandparents = currentOutbreak.parent.parent?true:false;
    let gap = 0;
 currentOutbreak=currentOutbreak.parent;
   while(thereAreGrandparents){
      currentOutbreak= currentOutbreak.parent;
     gap += this.gapMap.get(currentOutbreak).get(t)[0];
     thereAreGrandparents = currentOutbreak.parent?true:false
  }
    return gap;
  }