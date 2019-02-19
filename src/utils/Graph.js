import * as d3 from 'd3v4'
export class Graph{
    constructor(nodes=[],edges=[]) {
           this.nodeList =nodes;
           this.nodeList.forEach(element => {
               element.key=Symbol();
           });
           this.nodeMap = new Map(this.nodeList.map(node => [node.key, node]));
        this.edgeList = edges;
        this.edgeList.forEach(element => {
            element.key=Symbol();
        });
        this.edgeMap = new Map(this.edgeList.map(edge => [edge.key, edge]));    
        this.traversalDirection="forward"
        
    };

    addNode(node){
        if(Object.keys(node).indexOf("key")===-1){
            node.key=Symbol();
        }
        this.nodeList.push(node);
        this.nodeMap.set(node.key,node);
    }
    addEdge(edge){
        if(Object.keys(edge).indexOf("key")===-1){
            edge.key=Symbol();
        }        
        this.edgeList.push(edge);
        this.edgeMap.set(edge.key,edge);
    }
    getNode(key){
        return this.nodeMap.get(key);
    }
    getNodeFromKeyValuePair(key,value){
        return this.nodeList.filter(node=>node[key]===value)[0]
    }
    getNodeHtml(node){
        // const formatDate=d3.timeFormat("%Y-%m-%d")
        let outString = `${node.id} </br>Date of Sampling: ${node.dateOfSampling.toISOString().substring(0, 10)}</br>`;
        for(const key of Object.keys(node.metaData)){
            if(key.toLowerCase().indexOf("date")>-1){
            outString = `${outString}${key}: ${node.metaData[key].toISOString().substring(0, 10)}</br>`;
            }else{
            outString = `${outString}${key}: ${node.metaData[key]}</br>`;
            }
        }
        return outString;
    }

    getNodes(){
        return this.nodeList;
    }
    removeNode(node,preserveEdges=false){
        //remove edges
        const edges = this.getEdges(node);
        edges.forEach(edge=>this.removeEdge(edge))

        const key=node.key
        this.nodeList=this.nodeList.filter(node=>node.key!==key);
        this.nodeMap.delete(key)
    }

    getEdge(key){
        return this.edgeMap.get(key);
    }
    getEdgeHtml(edge){
        // const formatDate=d3.timeFormat("%Y-%m-%d")
        let outString = `Source:${edge.source.id} </br> Target: ${edge.target.id}</br>`;
        for(const key of Object.keys(edge.metaData)){
            if(key.toLowerCase().indexOf("date")>-1){
            outString = `${outString}${key}: ${edge.metaData[key].toISOString().substring(0, 10)}</br>`;
            }else{
            outString = `${outString}${key}: ${edge.metaData[key]}</br>`;
            }
        }
        return outString;
    }
    getIncomingEdges(node){
       return [...this.edgeList.filter(edge=>edge.target===node)]
    }
    getOutgoingEdges(node){
        return [...this.edgeList.filter(edge=>edge.source===node)]
    }
    getEdges(node){
        return[...this.getOutgoingEdges(node),...this.getIncomingEdges(node)]
    }
    getEdgeList(){
        return this.edgeList;
    }
    removeEdge(edge){
        const key=edge.key
        this.edgeList=this.edgeList.filter(edge=>edge.key!==key);
        this.edgeMap.delete(key)
    }

    makeEdge(sourceNode,targetNode){
        this.addEdge({source:sourceNode,target:targetNode})
    }
    insertNode(node,edge){
        const newEdge = {source:edge.source,target:node}
        const newEdge2 = {source:node,target:edge.taget}

        this.removeEdge(edge)

        this.addEdge(newEdge)
        this.addEdge(newEdge2)
    }

    getClusters(){
        this.nodeList.forEach(node=>node.visited=false)
        let clusters=[];
        this.traversalDirection="forward";
        this.nodeList.forEach(node=>{
            if(!node.visited){
            const cluster={nodes:[node],
                            externalNodes:[]}
            node.visited=true;
            this.getEdges(node).forEach(edge=>
                this.traverse(node,edge,cluster))
                //If this is a on node cluster then add the node as
                // an external as well
                if(cluster.nodes.length===1){
                    if(cluster.externalNodes.length===0){
                        cluster.externalNodes.push(node);
                    }
                }
             clusters.push(cluster);
            }
        })
        return clusters;

    }

    traverse(currentNode,edge,cluster){
        let nodeToVisit;
        let turnBack=false;

        if(currentNode===edge.source){
             nodeToVisit = edge.target;
            this.traversalDirection="forward"
        }else{
            nodeToVisit= edge.source
            if(this.traversalDirection==="forward"){
                turnBack=true;
            }
            this.traversalDirection="backward"
        }
        if(nodeToVisit.visited){
            if(turnBack){
                cluster.externalNodes.push(currentNode);
            }
            return;
        }else{
            nodeToVisit.visited=true;
            cluster.nodes.push(nodeToVisit);
            this.getEdges(nodeToVisit).forEach(edge=>this.traverse(nodeToVisit,edge,cluster));
        }
    }
}