import * as d3 from 'd3v4';
export class TranmissionLayout{
    constructor(graph,bezier=true) {
        this.graph=graph
        this.nodes=this.graph.getNodes().map(node=>  {return{"key":node.key,"height":null,"spacingDimension":null}})
        this.nodeMap = new Map(this.nodes.map(node => [node.key, node]));
        this.edges = this.graph.getEdgeList().map(edge=>{
                                                        return{"key":edge.key,
                                                            "source":this.getNode(edge.source.key),
                                                            "target":this.getNode(edge.target.key)};
                                                        });
        // adding intermediate nodes for Bezier curves
        this.bilinks=[];
        // https://bl.ocks.org/mbostock/4600693
        if(bezier){
            this.edges.forEach((link)=> {
                var s = link.source,
                    t = link.target,
                    i = {}; // intermediate node
                this.nodes.push(i);
                this.edges.push({source: s, target: i}, {source: i, target: t});
                this.bilinks.push([s, i, t]);
              });

        }

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
        const nodesFromData=this.nodes.filter(node=>node.key);
        nodesFromData.forEach(node=>node.height=heigthFunction(this.getDataNode(node.key)))
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
        nodesFromData.forEach(node=>this.setSpacingDimension(node));
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