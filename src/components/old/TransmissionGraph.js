import React from 'react';
import * as d3 from 'd3v4';
import {TranmissionLayout} from "../utils/transmissionLayout"
import {EconomyLayout} from "../utils/economyLayout"
import { toolTipCSS, toolTipCSSInverse } from '../utils/commonStyles';
import '../styles/TransmissionGraph.css'; // TODO
import '../styles/commonPlotStyle.css'


class TransmissionGraph extends React.Component {
	constructor(props) {
		super(props);
		this.drawTransPlot = this.drawTransPlot.bind(this);
		this.updateNodeVisibility=this.updateNodeVisibility.bind(this);
		this.updateEdgeVisibility=this.updateEdgeVisibility.bind(this);
	}
	componentDidMount() {
		this.drawTransPlot();
	}
	componentDidUpdate() {
		this.updateNodeVisibility();
		this.updateEdgeVisibility();

			}

	updateNodeVisibility(){
		this.props.nodeDataStatuses.forEach((selected,i)=>{
			const newOpacity = selected? 1:0;
			const classSelector=`.${this.props.nodeDataSources[i].replace(/ /g, '-')}`
			d3.selectAll(`${classSelector}.transmission-node`)
				.transition()
				.duration(300)
				.ease(d3.easeLinear)
				.style("opacity", newOpacity);
	
	  })
	}
	updateEdgeVisibility(){
		this.props.edgeDataStatuses.forEach((selected,i)=>{
			const newOpacity = selected? 1:0;
			const classSelector=`.${this.props.edgeDataSources[i].replace(/ /g, '-')}`
			d3.selectAll(`${classSelector}.link`)
				.transition()
				.duration(300)
				.ease(d3.easeLinear)
				.style("opacity", newOpacity);
	
	  })
	}


	drawTransPlot() {
		const node = this.node;
		const infoRef = this.infoRef;
		const infoRef2 = this.infoRef2;
		const self = this;



		function handleMouseMove(d, i) {
			const left = d.x < 0.5 * xScale.range()[1] ? `${xScale.range()[0] + d.x}px`:'';
			const right = d.x > 0.5 * xScale.range()[1] ? `${xScale.range()[1] - d.x}px` : '';
			const dataNode = layout.graph.getNode(d.key);
			const hoverText = layout.graph.getNodeHtml(dataNode);
			d3.select(infoRef)
				.style('left', left)
				.style('right', right)
				.style('top', `${d.y}px`)
				.style('visibility', 'visible')
				.html(hoverText);
		}
		function handleMouseOut() {
			d3.select(infoRef).style('visibility', 'hidden');
		}

		function handleMouseMoveLink(d, i) {
			const left = d[1].x < 0.5 * xScale.range()[1] ? `${xScale.range()[0] + d[1].x}px`:'';
			const right = d[1].x > 0.5 * xScale.range()[1] ? `${xScale.range()[1] - d[1].x}px` : '';
			const dataEdge = layout.graph.getEdge(d[3].key);
			const hoverText = layout.graph.getEdgeHtml(dataEdge);
			d3.select(infoRef2)
				.style('left', left)
				.style('right', right)
				.style('top', `${d[1].y}px`)
				.style('visibility', 'visible')
				.html(hoverText);
		}
		function handleMouseOutLink() {
			d3.select(infoRef2).style('visibility', 'hidden');
		}


		const width = this.props.size[0];
		const height = this.props.size[1];
		const svg = d3.select(node).style('font', '10px sans-serif');
		svg.selectAll('g').remove();
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);
		const svgGroup = svg.select('g');

		const layout = new EconomyLayout(this.props.data,"TransPhylo");
		layout.layOutNodes(d=>d.metaData['Date of onset']);

		const xScale=d3
					.scaleLinear()
					.domain(d3.extent(layout.nodes,d=>d.height))
					.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])
					.nice()
		const yScale = d3
					.scaleLinear()
					.domain(d3.extent(layout.nodes,d=>d.spacingDimension))
					.range([height - this.props.margin.top - this.props.margin.bottom, this.props.margin.bottom])
					.nice();

		const scaleForAxis=this.props.xScale.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right]);
		const xAxis = d3.axisBottom().scale(scaleForAxis);

		svgGroup
			.append('g')
			.attr('class', 'x-axis axis')
			.attr('transform', `translate(0,${(height - this.props.margin.top -this.props.margin.bottom +25)} )`)
			.call(xAxis)
			.selectAll('text')
			.attr('y', 0)
			.attr('x', 9)
			.attr('transform', `rotate(${45})`)
			.style('text-anchor', 'start');



		const nodeRadius=7;

		const pickyForceX=d3.forceX(d=>xScale(d.height)).strength(0.7);
		const pickXInit = pickyForceX.initialize;
		pickyForceX.initialize=function(nodes){
			pickXInit(nodes.filter(node=>node.key))
		}

		const pickyForceY=d3.forceY(d=>yScale(d.spacingDimension)).strength(0.3);
		const pickYInit = pickyForceY.initialize;
		pickyForceY.initialize=function(nodes){
			pickYInit(nodes.filter(node=>node.key&& node.spacingDimension))
		}

		const simulation = d3.forceSimulation()
						.force("collide",d3.forceCollide(d=>nodeRadius))
						.force("xPosition",pickyForceX)
						.force("yPosition",pickyForceY)
						.force("center",d3.forceCenter(width/2,height/2))
						.force("charge", d3.forceManyBody().strength(-1))
						.force("link", d3.forceLink().distance(5).strength(0.5));


	
		const links = svgGroup.append('g')
						.selectAll(".link")
						.data(layout.bilinks)
						.enter().append("path")
		  				.attr("class", d=>`${layout.getDataEdge(d[3].key).metaData.dataType.replace(/ /g, '-')} link`)
    					.style("stroke", "#bbb")  // colour the line
						.style("stroke-width",3)
						.style("fill",'none')
						.on('mouseover', handleMouseMoveLink)
						.on('mouseout', handleMouseOutLink)
		
		const nodes = svgGroup.append('g')
			.selectAll("circle")
			.data(layout.nodes.filter(d=>d.key))
			.enter()
			.append("circle")
			.attr("r",d=>layout.getDataNode(d.key).metaData.dataType==="Observed"?nodeRadius:nodeRadius-1.5)
			.attr("class",d=>`${layout.getDataNode(d.key).metaData.dataType.replace(/ /g, '-')} transmission-node`)
			.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended))
			.on('mouseover', handleMouseMove)
			.on('mouseout', handleMouseOut);
		  
		simulation
		  .nodes(layout.nodes)
		  .on("tick", ticked);

		simulation.force("link")
		  .links(layout.edges);

		  // hide nodes that we don't want
		this.updateNodeVisibility();
		// this.updateEdgeVisibility();
		
		//   svgGroup.selectAll()

		  function ticked() {
			links.attr("d", positionLink);
			nodes.attr("transform", positionNode);
		  }
		function bind(d){
			const boundedPosition={}
			boundedPosition.x=Math.max(nodeRadius, Math.min((width-self.props.margin.left-self.props.margin.right) - nodeRadius, d.x));
			boundedPosition.y=Math.min((height-self.props.margin.bottom-self.props.margin.top+25) - nodeRadius, d.y);
			return boundedPosition;
		}
		  function positionLink(d) {
			const start = bind(d[0]);
			const mid = bind(d[1]);
			const end = bind(d[2])
			const pathString = `M${start.x},${start.y}S${mid.x},${mid.y} ${end.x},${end.y}`;
			return pathString;
		  }
		  
		  function positionNode(d) {
			  //Bounds in svg
			  const boundedPosition = bind(d); 
			return `translate( ${boundedPosition.x} , ${boundedPosition.y} )`;
		  }
		  
		  function dragstarted(d) {
			if (!d3.event.active) simulation.alphaTarget(0.5).restart();
			d.fx = d.x;
			 d.fy = d.y;
		  }
		  
		  function dragged(d) {
			d.fx = d3.event.x;
			 d.fy = d3.event.y;
		  }
		  
		  function dragended(d) {
			if (!d3.event.active) simulation.alphaTarget(0);
			d.fx = null;
			 d.fy = null;
		  }
	}

	render() {
		return (
			<div>
			<div
					{...toolTipCSS}
					style={{ maxWidth: this.props.size[0] / 2 }}
					ref={r => {
						this.infoRef = r;
					}}
				/>
							<div
					{...toolTipCSSInverse}
					style={{ maxWidth: this.props.size[0] / 2 }}
					ref={r => {
						this.infoRef2 = r;
					}}
				/>
				<svg ref={node => (this.node = node)} width={this.props.size[0]} height={this.props.size[1]} />
			</div>
		);
	}
}

export default TransmissionGraph;
