import React from 'react';
import * as d3 from 'd3v4';
import {TranmissionLayout} from "../utils/transmissionLayout"
import { toolTipCSS } from '../utils/commonStyles';


class TransmissionGraph extends React.Component {
	constructor(props) {
		super(props);
		this.drawTransPlot = this.drawTransPlot.bind(this);
	}
	componentDidMount() {
		this.drawTransPlot();
	}
	shouldComponentUpdate(){
		return false;
	}
	componentDidUpdate() {
		this.drawTransPlot();
	}

	drawTransPlot() {
		const node = this.node;
		const infoRef = this.infoRef;
		const self=this;


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
			d3.select(infoRef)
				.style('left', left)
				.style('right', right)
				.style('top', `${d[1].y}px`)
				.style('visibility', 'visible')
				.html(hoverText);
		}


		const width = this.props.size[0];
		const height = this.props.size[1];
		const svg = d3.select(node).style('font', '10px sans-serif');
		svg.selectAll('g').remove();
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);
		const svgGroup = svg.select('g');

		const layout = new TranmissionLayout(this.props.data);
		layout.layOutNodes(d=>d.metaData['Date of onset']);



		// layout.layOutNodes(d=>d.dateOfSampling);
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
			.attr('transform', `translate(0,${height - this.props.margin.top -this.props.margin.bottom +15} )`)
			.call(xAxis)
			.selectAll('text')
			.attr('y', 0)
			.attr('x', 9)
			.attr('transform', `rotate(${45})`)
			.style('text-anchor', 'start');



		const nodeRadius=7;

		const pickyForceX=d3.forceX(d=>xScale(d.height)).strength(0.5);
		const pickXInit = pickyForceX.initialize;
		pickyForceX.initialize=function(nodes){
			pickXInit(nodes.filter(node=>node.key))
		}

		const pickyForceY=d3.forceY(d=>yScale(d.spacingDimension)).strength(0.5);
		const pickYInit = pickyForceY.initialize;
		pickyForceY.initialize=function(nodes){
			pickYInit(nodes.filter(node=>node.key))
		}



		const simulation = d3.forceSimulation()
						.force("collide",d3.forceCollide(d=>nodeRadius))
						.force("xPosition",pickyForceX)
						.force("yPosition",pickyForceY)
						.force("charge", d3.forceManyBody())
						.force("link", d3.forceLink().distance(10).strength(0.5));


	
		const links = svgGroup.append('g')
						.selectAll(".link")
						.data(layout.bilinks)
						.enter().append("path")
		  				.attr("class", "link")
    					.style("stroke", "#bbb")  // colour the line
						.style("stroke-width",3)
						.style("fill",'none')
						.on('mouseover', handleMouseMoveLink)
						.on('mouseout', handleMouseOut)
		
		const nodes = svgGroup.append('g')
			.selectAll('cirlce')
			.data(layout.nodes.filter(d=>d.key))
			.enter()
			.append("circle")
			.attr("r",nodeRadius)
			.style("fill","#001D73")
			.style("stroke", "#fff")
			.style("stroke-width", "1.5px")
			.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended))
			.on('mouseover', handleMouseMove)
			.on('mouseout', handleMouseOut)
		  
		simulation
		  .nodes(layout.nodes)
		  .on("tick", ticked);

		simulation.force("link")
		  .links(layout.edges);

		  function ticked() {
			links.attr("d", positionLink);
			nodes.attr("transform", positionNode);
		  }
		
		  function positionLink(d) {
			const pathString = `M${d[0].x},${d[0].y}S${d[1].x},${d[1].y} ${d[2].x},${d[2].y}`;
			return pathString;
		  }
		  
		  function positionNode(d) {
			return "translate(" + d.x + "," + d.y + ")";
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
				<svg ref={node => (this.node = node)} width={this.props.size[0]} height={this.props.size[1]} />
			</div>
		);
	}
}

export default TransmissionGraph;
