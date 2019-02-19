import * as d3 from 'd3v4';
export class TranmissionLayout{
    constructor(graph) {
        this.graph=graph
        this.nodes=this.graph.getNodes().map(node=>  {return{"key":node.key,"x":null,"y":null}})
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
    layOutNodes(xFunction){
        this.nodes.forEach(node=>node.x=xFunction(this.getDataNode(node.key)))
        // each time we go back from going fowards count an external tip.
        // set height based on that.
        const clusters = this.graph.getClusters();
        // Set y of external nodes
        clusters.sort((a,b)=>b.externalNodes.length-a.externalNodes.length);
        let i=1;
        for(const cluster of clusters){
            for(const externalNode of cluster.externalNodes){
                const plotNode=this.getNode(externalNode.key)//plot node
                plotNode.y=i;
                i++;
            }
        }
        
        // Set the y of internal nodes as the mean of their children.
        this.nodes.forEach(node=>this.setY(node));
    }

    setY(node){
        if(node.y){
            return;
        }else{
            const children = this.getOutgoingEdges(node).map(edge=>edge.target);
            children.forEach(child=>this.setY(child))
            node.y=d3.mean(children,child=>child.y)
        }
    }

}