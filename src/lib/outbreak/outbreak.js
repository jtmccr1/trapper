
class Outbreak{
      constructor(id,location,cases=[]){
        this.location=location;
        this.cases=cases;
        this.id=id;
        this.children=[];
      }
     
    get timeCourse(){ 
        const timePoints= this.timePoints;
      //Weeks are hardcoded in.
       const tc = new Map(timePoints.map(t=>[t,{time:new Date(t), cases:this.cases.filter(k=>d3.timeWeek(k.symptomOnset)-t===0).length}]))
        if(this.children.length===0){
          tc.forEach(d=>d.totalDescendents=d.cases)
        }else{
          const childrenTimeCourse = this.children.map(child=>child.timeCourse);
          // now get children timepoints that were misssed in this level
          
         for(const child of childrenTimeCourse){
            for(const k of child.keys()){
              if(timePoints.indexOf(k)==-1){
                timePoints.push(k);
                tc.set(k,{time:new Date(k),cases:0})
              }
            }
         }
          
         for(const timePoint of timePoints){
          const childrenCourses = childrenTimeCourse.map(child=>child.has(timePoint)?child.get(timePoint):{cases:0,totalDescendents:0})
          //https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays
           
           const childrenCases = d3.sum(childrenCourses,d=>d.totalDescendents)
           const tp = tc.get(timePoint)
           tc.set(timePoint,{...tp,...{totalDescendents:tp.cases+childrenCases}});
         }

        }
      return tc;
    }
  addChild(child){
    if(child instanceof Outbreak){
      this.children.push(child)
      child.parent=this;
    }else if(child instanceof Array){
        child.forEach(k=>this.addChild(k))
     }
  }
   get timePoints(){
     
    const firstTimePoints =[d3.min(this.cases,d=>d.symptomOnset)];
    const lastTimePoints = [d3.max(this.cases,d=>d.symptomOnset)]
    
    if(this.children.length>0){
      for(const child of this.children){
        const childTP = child.timePoints;
        firstTimePoints.push(d3.min(childTP))
        lastTimePoints.push(d3.max(childTP))
      }
    }
    // const finalWeek = d3.timeWeek(d3.max(lastTimePoin

    const tp= d3.timeWeek.range(d3.min(firstTimePoints),d3.timeWeek.offset(d3.max(lastTimePoints)),1).map(d=>d.getTime())
     
     return tp;
     
  }
  
    /**
     * A generator function that returns the nodes in a pre-order traversal.
     *
     * @returns {IterableIterator<IterableIterator<*|*>>}
     */
    *preorder() {
        const traverse = function *(node) {
            yield node;
            if (node.children) {
                for (const child of node.children) {
                    yield* traverse(child);
                }
            }
        };

        yield* traverse(this);
    }

    /**
     * A generator function that returns the nodes in a post-order traversal
     *
     * @returns {IterableIterator<IterableIterator<*|*>>}
     */
    *postorder() {
        const traverse = function *(node) {
            if (node.children) {
                for (const child of node.children) {
                    yield* traverse(child);
                }
            }
            yield node;
        };

        yield* traverse(this);
    }
}