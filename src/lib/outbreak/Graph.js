/** @module Graph */

// import {Type}  from '../lib/figtree.js/index.js';
/**
 * The graph class
 *
 * A class that takes an arrary of nodes and edges and provides a number of methods
 * for manipulating the graph.
 * @param nodes - an array of nodes
 * @param edges - an array of edges linking the nodes
 */
export class Graph{
    constructor(nodes=[],edges=[]) {
        this.nodeList =[];
        this.nodeMap = new Map();
        nodes.forEach(node=>this.addNode(node));

        this.edgeList = [];
        this.edgeMap = new Map();
        edges.forEach(edge=>this.makeEdge(edge));

        this.outGoingEdgeMap = new Map(this.nodeList.map(node=>[node,[...this.edgeList.filter(edge=>edge.source===node)]]));
        this.incomingEdgeMap= new Map(this.nodeList.map(node=>[node,[...this.edgeList.filter(edge=>edge.target===node)]]));
        // This is used in identifying terminal tips  
    };

    /**
     * @returns {*}
     */
    get nodes(){
        return this.nodeList;
    }

    /**
     * @returns {*}
     */
    get externalNodes(){
        return this.nodeList.filter(d=>this.getOutgoingEdges().length===0);
    }

    /**
     * Adds a node to the graph.
     * @param {*} node
     */
    addNode(node){
        if(!node.key){
            node.key=Symbol();
        }
        this.nodeList.push(node);
        this.nodeMap.set(node.key,node);

        this.outGoingEdgeMap.set(node,[]);
        this.incomingEdgeMap.set(node,[]);
    }

    /**
     * return a node given the key
     * @param {*} key
     */
    getNode(key){
        return this.nodeMap.get(key);
    }

    /**
     * Returns the nodes with matching values matching the key-value pair given
     * @param {*} key
     * @param {*} value
     * @returns {array} - Array of nodes with
     */
    getNodesFromKeyValuePair(key,value){
        return this.nodeList.filter(node=>node[key]===value)
    }

    /**
     * Get the edges entering a node
     * @param {*} node
     * @returns {array} array of edges that end with the node
     */
    getIncomingEdges(node){
        return [...this.incomingEdgeMap.get(node)]
    }

    /**
     * Get the edges leaving a node
     * @param {*} node
     * @returns {array} array of edges that begin with the node
     */
    getOutgoingEdges(node){
        return [...this.outGoingEdgeMap.get(node)]
    }

    /**
     * Get all the edges leaving and entering a node
     * @param {*} node
     * @returns {array} array of edges that touch node
     */
    getEdges(node){
        return[...this.getOutgoingEdges(node),...this.getIncomingEdges(node)]
    }

    getNodeHtml(node){
        // const formatDate=d3.timeFormat("%Y-%m-%d")
        let outString = `${node.id} </br>`
        // for(const key of Object.keys(node)){
        //     if(node[key]){
        //         if(key!=="id"&& key!=="metaData"&&key!=="key"){
        //             if(key.toLowerCase().indexOf("date")>-1){
        //                 outString = `${outString}${key}: ${node[key].toISOString().substring(0, 10)}</br>`;
        //                 }else{
        //                 outString = `${outString}${key}: ${node[key]}</br>`;
        //                 }            
        //             }
        //     }
        // }

        for(const key of Object.keys(node.metaData)){
            if(key.toLowerCase().indexOf("date")>-1){
                outString = `${outString}${key}: ${node.metaData[key].toISOString().substring(0, 10)}</br>`;
            }else{
                outString = `${outString}${key}: ${node.metaData[key]}</br>`;
            }
        }
        return outString;
    }

    /**
     * removes the node and incoming/outgoing edges
     * @param {object} node
     */

    removeNode(node){
        //remove edges
        const edges = this.getEdges(node);
        edges.forEach(edge=>this.removeEdge(edge))

        const key=node.key
        this.nodeList=this.nodeList.filter(node=>node.key!==key);
        this.nodeMap.delete(key);
        this.incomingEdgeMap.delete(node);
        this.outGoingEdgeMap.delete(node);
    }

    /**
     * @returns {*}
     */
    get edges(){
        return this.edgeList;
    }

    /**
     * returns the edge
     * @param {*} key
     * @returns {*} edge
     */
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
    /**
     * Adds an edge between the provide source and target nodes. It the nodes are not part of the graph they are added.
     * @param {*} sourceNode
     * @param {*} targetNode
     * @param {*} metaData - Optional object that can hold meta data concerning the connection
     */
    makeEdge(sourceNode,targetNode,metaData={}){
        if(!sourceNode.key||!this.nodeMap.has(sourceNode.key)){
            this.addNode(sourceNode)
        }
        if(!targetNode.key||!this.nodeMap.has(targetNode.key)){
            this.addNode(targetNode)
        }
        const edge = {source:sourceNode,target:targetNode,metaData:metaData,key:Symbol()};
        this.edgeList.push(edge);
        this.edgeMap.set(edge.key,edge);

        this.outGoingEdgeMap.get(sourceNode).push(edge);
        this.incomingEdgeMap.get(targetNode).push(edge);
    }


    /**
     * removes an edge from the graph
     * @param {*} edge
     */
    removeEdge(edge){
        const key=edge.key
        this.edgeList=this.edgeList.filter(edge=>edge.key!==key);

        // update edgemaps
        this.edgeMap.delete(key)
        // new outgoing
        const newOutgoing = this.getOutgoingEdges(edge.source).filter(e=>e!==edge);
        this.outGoingEdgeMap.set(edge.source,newOutgoing);
        const newIncoming = this.getIncomingEdges(edge.taget).filter(e=>e!==edge);
        this.incomingEdgeMap.set(edge.target,newIncoming);

    }

    /**
     * Inserts a node into an edge. This replaced the edge with two new edges which pass through a node.
     * @param {*} node
     * @param {*} edge
     */
    insertNode(node,edge){
        if(!node.key||this.nodeMap.has(node.key)){
            this.addNode(node)
        }
        this.makeEdge(edge.source,node);
        this.makeEdge(node,edge.taget);
        this.removeEdge(edge)
    }

    /**
     * A function to return a sub graph given an arrary of nodes.
     * @param {array} nodes - An array of nodes
     * @param {*} options - an optional object with filterEdges:function() that filters the edges used in the traversal
     * @returns {*} A graph object including the provided nodes and edges linking the node. If there is no path between all nodes the
     * object will be empty
     */
    getSubGraph(nodes,options={filterEdges:(e)=>true}){
        // check there is a path between all nodes
        const preorder= [...this.preorder(nodes[0])];
        if(nodes.some(n=>preorder.indexOf(n)===-1)){
            // If there is at least 1 node not hit in the traversal
            return new Graph();
        }
        const edges = nodes.map(n=>[...this.getOutgoingEdges(n).filter(e=>options.filterEdges(e)).filter(e=>nodes.indexOf(e.taget)>-1),
            ...this.getIncomingEdges(n).filter(e=>options.filterEdges(e)).filter(e=>nodes.indexOf(e.source)>-1)]);
        const uniqueEdges = [...new Set(edges)];
        return new Graph(nodes,uniqueEdges)

    }

    /**
     * A function returning
     * @param {*} nodes - An array of nodes
     * @param {*} options - an optional object with filterEdges:function() that filters the edges used in the traversal
     * @returns {*}
     * Not yet implimented. Should each path be a sub-graph?
     */
    getPaths(node1,node2,options={filterEdges:(e)=>true}){
        // check there is a path between all nodes
        throw new Error("Not yet implimented");


    }

// -----------  Methods from figtree.js tree object -----------------------------
    /**
     * A generator function that returns the nodes in a pre-order traversal. Starting at
     * node. An optional options objects can be used to select which edges are used in the traversal
     * @param {*} node
     * @param {object} options - an optional object with filterEdges:function() that filters the edges used in the traversal
     * @returns {IterableIterator<IterableIterator<*|*>>}
     */
    *preorder(node,options) {
        // We have to mark nodes as visited since it is possible to cycle back
        this.edgeList.forEach(e=>e.visited=false);
        this.nodeList.forEach(n => n.visited=false);
        const traverse = function *(node,options){
            yield node;
            this.getEdges(node).filter(e=>options.filterEdges(e)).forEach(edge=>{
                if(!edge.visited){
                    let nextNode;
                    if(node===edge.source){
                        nextNode = edge.target;
                    }else{
                        nextNode=edge.source;
                    }
                    if(!nextNode.visited){
                        edge.visited=true;
                        traverse(nextNode,options);
                    }else{
                        edge.visited=true; // technically a back edge
                    }
                }
            })
        };
        yield* traverse(node,options);
        this.edgeList.forEach(e=> delete e["visited"]);
        this.nodeList.forEach(n => delete n["visited"]);
    }

    /**
     * A generator function that returns the nodes in a post-order traversal. Starting at
     * node. An optional options objects can be used to select which edges are used in the traversal
     * @param {*} node
     * @param {object} options - an optional object with filterEdges:function() that filters the edges used in the traversal
     * @returns {IterableIterator<IterableIterator<*|*>>}
     */
    *postorder(node,options) {
        // We have to mark nodes as visited since it is possible to cycle back
        this.edgeList.forEach(e=>e.visited=false);
        this.nodeList.forEach(n => n.visited=false);
        const traverse = function *(node,options){
            this.getEdges(node).filter(e=>options.filterEdges(e)).forEach(edge=>{
                if(!edge.visited){
                    let nextNode;
                    if(node===edge.source){
                        nextNode = edge.target;
                    }else{
                        nextNode=edge.source;
                    }
                    if(!nextNode.visited){
                        edge.visited=true;
                        traverse(nextNode,options);
                    }else{
                        edge.visited=true; // technically a back edge
                    }
                }
            })
            yield node;

        };
        yield* traverse(node,options);
        this.edgeList.forEach(e=> delete e["visited"]);
        this.nodeList.forEach(n => delete n["visited"]);
    }

    /**
     * This is similar to annotateTips but the annotation objects are keyed by node
     * keys (Symbols).
     *
     * @param annotations a dictionary of annotations keyed by node key
     */
    annotateNodes(annotations) {
        console.log(Object.getOwnPropertySymbols(annotations));
        for (let key of Object.getOwnPropertySymbols(annotations)) {
            const node = this.getNode(key);
            const values = annotations[key];
            if (!node) {
                throw new Error(`tip with key ${key} not found in tree`);
            }
            console.log(`annotating node: ${node.id} with ${values}`)
            this.annotateNode(node, values);
        }
    }

    /**
     * This is similar to annotateTips but the annotation objects are keyed by node
     * keys (Symbols).
     *
     * @param annotations a dictionary of annotations keyed by node key
     */
    annotateEdges(annotations) {
        for (let [key, values] of Object.entries(annotations)) {
            const node = this.getEdge(key);
            if (!node) {
                throw new Error(`tip with key ${key} not found in tree`);
            }

            this.annotateNode(node, values);
        }
    }
}



