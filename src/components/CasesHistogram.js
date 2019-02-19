import React from 'react';
import * as d3 from 'd3v4';
import { drawAxis, onlyUnique } from '../utils/commonFunctions';

// With help from https://bl.ocks.org/gcalmettes/95e3553da26ec90fd0a2890a678f3f69

class CasesHistogram extends React.Component {
	constructor(props) {
		super(props);

		this.drawEpiPlot = this.drawEpiPlot.bind(this);
	}

	componentDidMount() {
		this.drawEpiPlot();
	}
	componentDidUpdate() {
		this.drawEpiPlot();
	}

	drawEpiPlot() {
		const width = this.props.size[0];
		const height = this.props.size[1];
		const node = this.node;

		const svg = d3.select(node).style('font', '10px sans-serif');

		svg.selectAll('g').remove();

		// const processedData = this.props.cases.filter(node=>node.metaData.dataType? node.metaData.dataType.toLowerCase()!=="inferred":true);
		const yAxisHeight = height - this.props.margin.bottom - this.props.margin.top;
		const xScale = this.props.xScale.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])



		const yScale = d3
			.scaleLinear()
			.range([height - this.props.margin.top - this.props.margin.bottom, this.props.margin.bottom])
			.nice();
		const bins = d3
				.histogram()
				.domain(xScale.domain())
				.thresholds(xScale.ticks(10))
				.value(d => d.dateOfSampling? d.dateOfSampling: d.metaData["Date of onset"])(this.props.cases);

		yScale.domain([0, d3.max(bins, d => d.length)]);

		svg.selectAll('g').remove();
		// do the drawing
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);

		const svgGroup = svg.select('g');

		drawAxis(svgGroup, this.props.xScale, yScale, this.props.size, this.props.margin, { rotate: 45, xlab: '', ylab: '' });

		svgGroup.append("g")
		.attr("fill", "grey")
	  	.selectAll("rect")
	  .data(bins)
	  .enter()
	  .append("rect")
		.attr("x", d => xScale(d.x0) + 1)
		.attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
		.attr("y", d => yScale(d.length))
		.attr("height", d => yScale(0) - yScale(d.length));

		svgGroup.append("g")
                .attr("id", "y-axis-label")
                .attr("class", "axis-label")
                .attr("transform", `translate(${this.props.margin.left},${this.props.margin.top})`)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - this.props.margin.left)
                .attr("x", 0 - (yAxisHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Reported Cases");

	}

	render() {
		return (
			<div>
				<div>
					<span style={{ paddingRight: '10px' }}>All Locations</span>

					<label className="switch">
						<input type="checkbox" onClick={this.props.updateColor} checked={this.props.byLocation} />
						<span className="slider round" />
					</label>
					<span style={{ paddingLeft: '10px' }}>By Location</span>
				</div>
				<div>
					<svg ref={node => (this.node = node)} width={this.props.size[0]} height={this.props.size[1]} />
				</div>
			</div>
		);
	}
}

export default CasesHistogram;
