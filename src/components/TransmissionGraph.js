import React from 'react';
import * as d3 from 'd3v4';
import {TranmissionLayout} from "../utils/transmissionLayout"

class TransmissionGraph extends React.Component {
	constructor(props) {
		super(props);
		this.drawTransPlot = this.drawTransPlot.bind(this);
	}
	componentDidMount() {
		this.drawTransPlot();
	}
	componentDidUpdate() {
		this.drawTransPlot();
	}

	drawTransPlot() {
		const node = this.node;
		const infoRef = this.infoRef;
		const width = this.props.size[0];
		const height = this.props.size[1];
		const svg = d3.select(node).style('font', '10px sans-serif');
		svg.selectAll('g').remove();
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);
		const svgGroup = svg.select('g');

		const layout = new TranmissionLayout(this.props.data);
		layout.layOutNodes(d=>d.metaData['Date of onset']);



		// layout.layOutNodes(d=>d.dateOfSampleing);
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
		const nodeRadius=4;
		const force = d3.forceSimulation(layout.nodes)
						.force("collide",d3.forceCollide(d=>nodeRadius))
						.force("xPosition",d3.forceX(d=>xScale(d.height)).strength(0.5))
						.force("yPosition",d3.forceY(d=>yScale(d.spacingDimension)).strength(0.5))
						.force("center", d3.forceCenter().x(width / 2).y(height / 2));

	
		const links = svgGroup.append('g')
				.selectAll("line")
				.data(layout.edges)
				.enter()
				.append('line')
    			.style("stroke", "#ccc")  // colour the line
				.style("stroke-width",1)
		
		const nodes = svgGroup.append('g')
			.selectAll('cirlce')
			.data(layout.nodes)
			.enter()
			.append("circle")
			.attr("r",nodeRadius)
			.style("fill","#001D73")
			.style("stroke", "#fff")
			.style("stroke-width", "1.5px")
			.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

			force.on("tick",()=>{
				links.attr("x1",d=>d.source.x)
					.attr("y1",d=>d.source.y)
					.attr("x2",d=>d.target.x)
					.attr("y2",d=>d.target.y);
				nodes.attr("cx",d=>d.x)
					.attr("cy",d=>d.y)

			});

			function dragstarted(d) {
				if (!d3.event.active) force.alphaTarget(1).restart();
				d.fx = d.x;
				d.fy = d.y;
			  }
			  
			  function dragged(d) {
				d.fx = d3.event.x;
				 d.fy = d3.event.y;
			  }
			  
			  function dragended(d) {
				if (!d3.event.active) force.alphaTarget(0);
				d.fx = null;
				 d.fy = null;
			  }


  
				


		


	}

	render() {
		return (
			<div>
				<svg ref={node => (this.node = node)} width={this.props.size[0]} height={this.props.size[1]} />
			</div>
		);
	}
}

export default TransmissionGraph;
