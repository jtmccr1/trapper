import {Outbreak} from './Outbreak.js';

export class Epidemic{
 constructor(indexCase,graph,edgeConditionFactory = e=>true){
   this.outbreaks=[];
   this.outbreakMap= new Map();
   this.graph = graph;
   this.edgeCondition =edgeConditionFactory(this.graph);
   this.setOutbreaks(indexCase);

 }
  setOutbreaks(indexCase){
    // If the location of the index is unknow set to the most common location of the childrent;
    const firstOutbreak = new Outbreak(`${indexCase.location}-${indexCase.id}`,indexCase.location,[indexCase]);
    
    this.rootOutbreak = firstOutbreak;
    this.outbreakMap.set(indexCase,firstOutbreak);
    this.outbreaks.push(firstOutbreak);
    const children = this.graph.getOutgoingEdges(indexCase).filter(this.edgeCondition).map(e =>      ({edge:e,Case:e.target}))
    
    for(const child of children){
      this.outbreakTraversal(child)
    }    
  }
  outbreakTraversal(CaseEdge){
   const Case = CaseEdge.Case;
   const edge = CaseEdge.edge;
   const parent =   edge.source;
   const parentOutbreak = this.outbreakMap.get(parent);
    // Removes possiblity of circular traversal and certain death
    if(this.outbreakMap.has(Case)){
      return
    }
   let currentOutbreak;
  if(Case.location === parent.location){
    // add case to parent outbreak
    parentOutbreak.addCase(Case);
    Case.outbreakId=parentOutbreak.id;
    this.outbreakMap.set(Case,parentOutbreak);

    currentOutbreak = parentOutbreak;
    
  }else{
    const startAnotherOutbreak = new Outbreak(`${Case.location}-${Case.id}`,Case.location,[Case]);
    Case.outbreakId=startAnotherOutbreak.id;
    parentOutbreak.addChild(startAnotherOutbreak);
    this.outbreakMap.set(Case,startAnotherOutbreak);
    this.outbreaks.push(startAnotherOutbreak);
    currentOutbreak = startAnotherOutbreak;
  }
   const children = this.graph.getOutgoingEdges(Case).filter(e=>(this.edgeCondition))
     .map(e => ({edge:e,Case:e.target}))
    .filter(c=>!this.outbreakMap.has(c.Case));
    //avoids circlular loop when edge condition is not sufficient.
  for(const child of children){
    this.outbreakTraversal(child)
  }
}
get Cases(){
  return this.graph.nodes;
}


  
  
}