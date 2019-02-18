import * as d3 from 'd3v4';
export class tranmissionLayout{
    constructor(nodes,edges) {
        this.rawData['nodes']=nodes;
        this.rawData['edges']=edges;
    };

    layOutNodes(xFunction){
        const xDomain=d3.range(this.rawData.nodes,d=>xFunction(d));
        this.nodes=this.rawData.nodes.map(d=>{
            return {"id":d.id,
                    "x":xFunction(d)
                }
    })
    this.edges = this.rawData.edges.forEach(edge=>{
        const source = this.nodes.filter(d=>d.id==edge.source)[0];
        const target = this.nodes.filter(d=>d.id==edge.source)[0];
        return {source:source,
                target:target}
    })
    //to set the y we need the number of external nodes this is the number nodes
    // that are not targets

    const externalNodes = this.nodes.filter(d=>this.edges.map(edge=>edge.source.id).indexOf(d.id)===-1);
    externalNodes.forEach((node,index)=>{
        node.y=index
    })

};

    


    // make trees




}