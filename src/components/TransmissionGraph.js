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
					.domain(d3.extent(layout.nodes,d=>d.x))
					.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])
					.nice()
		const yScale = d3
					.scaleLinear()
					.domain(d3.extent(layout.nodes,d=>d.y))
					.range([height - this.props.margin.top - this.props.margin.bottom, this.props.margin.bottom])
					.nice();


		svgGroup.append('g')
				.selectAll("circle")
				.data(layout.nodes)
				.enter()
				.append('circle')
				.attr("class","caseNode")
				.attr("r",4)
				.attr("cx",d=>xScale(d.x))
				.attr("cy",d=>yScale(d.y))
		

		svgGroup.append('g')
				.selectAll("line")
				.data(layout.edges)
				.enter()
				.append('line')
    			.style("stroke", "black")  // colour the line
    			.attr("x1", d=>xScale(d.source.x))     // x position of the first end of the line
    			.attr("y1", d=>yScale(d.source.y))      // y position of the first end of the line
    			.attr("x2", d=>xScale(d.target.x))     // x position of the second end of the line
   				 .attr("y2", d=>yScale(d.target.y));    // y position of the seco

		console.log(layout)

		


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
