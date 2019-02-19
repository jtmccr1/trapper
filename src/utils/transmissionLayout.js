import * as d3 from 'd3v4';
export class TranmissionLayout{
    constructor(graph) {
        this.graph=graph
        this.nodes=this.graph.getNodes().map(node=>  {return{"key":node.key,"height":null,"spacingDimension":null}})
        this.nodeMap = new Map(this.nodes.map(node => [node.key, node]));
        this.edges = this.graph.getEdgeList().map(edge=>{
                                                        return{"key":edge.key,
                                                            "source":this.getNode(edge.source.key),
                                                            "target":this.getNode(edge.target.key)};
                                                        });

    };
    
    getNode(key){
        return this.nodeMap.get(key);
    }
    getDataNode(key){
        return this.graph.getNode(key);
    }
    getOutgoingEdges(node){
        return [...this.edges.filter(edge=>edge.source===node)]
    }
    getDataEdge(key){
        return this.graph.getEdge(key);
    }
    layOutNodes(heigthFunction){
        this.nodes.forEach(node=>node.height=heigthFunction(this.getDataNode(node.key)))
        // each time we go back from going fowards count an external tip.
        // set height based on that.
        const clusters = this.graph.getClusters();
        // Set y of external nodes
        clusters.sort((a,b)=>{
            if(b.nodes.length===1&a.nodes.length>1){
                return -1;
            }else{
                return(d3.min(a.nodes,d=>heigthFunction(d))-d3.min(b.nodes,d=>heigthFunction(d)))
            }
   
        });
        let i=1;
        for(const cluster of clusters){
            for(const externalNode of cluster.externalNodes){
                const plotNode=this.getNode(externalNode.key)//plot node
                plotNode.spacingDimension=i;
                i++;
            }
        }
        // fix overplotting
        // Set the y of internal nodes as the mean of their children.
        this.nodes.forEach(node=>this.setSpacingDimension(node));
    }

    setSpacingDimension(node){
        if(node.spacingDimension){
            return;
        }else{
            const children = this.getOutgoingEdges(node).map(edge=>edge.target);
            children.forEach(child=>this.setSpacingDimension(child))
            node.spacingDimension=d3.mean(children,child=>child.spacingDimension)
        }
    }

}