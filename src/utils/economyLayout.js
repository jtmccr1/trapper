import * as d3 from 'd3v4';
export class EconomyLayout{
    constructor(graph,linkType,bezier=true) {
        // Linktype should connect all nodes
        this.linkType=linkType;
        this.graph=graph
        this.nodes=this.graph.nodes.map(node=>  {return{"key":node.key,"height":null,"spacingDimension":null}})
        this.nodeMap = new Map(this.nodes.map(node => [node.key, node]));
        this.edges = this.graph.edges.map(edge=>{
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
                this.bilinks.push([s, i, t,{"key":link.key}]);
              });

        }
        this.currentSpacing=0;

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
        
        let dataRootNode = this.graph.nodes.filter(node=>this.graph.getOutgoingEdges(node)
                                                .filter(edge=>edge.metaData.dataType===this.linkType).length>0 & this.graph.getIncomingEdges(node)
                                                                                                            .filter(edge=>edge.metaData.dataType===this.linkType).length===0);
        if(dataRootNode.length>1){
            alert("The links used to set the transmission layout should link all nodes")
        }
        const plotRoot=this.getNode(dataRootNode[0].key);
        
        
        this.setSpacingDimension(plotRoot);

    }

    setSpacingDimension(node){
        // if(node.spacingDimension){
        //     return;
        // }else{
            node.spacingDimension=this.currentSpacing
            this.currentSpacing++;
            console.log(node)
            console.log(this.getOutgoingEdges(node).filter(edge=>edge.key)
            .map(edge=>this.getDataEdge(edge.key)))

            const children = this.getOutgoingEdges(node)
                .filter(edge=>edge.key)
                .filter(edge=>this.getDataEdge(edge.key).metaData.dataType===this.linkType)
                .map(edge=>edge.target);
            children.forEach(child=>this.setSpacingDimension(child))
        // }
    }

}