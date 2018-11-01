import React from 'react';
import * as d3 from 'd3';
import { drawAxis } from '../lib/commonFunctions';

class SerialInterval extends React.Component {
	constructor(props) {
		super(props);
		this.drawPlot = this.drawPlot.bind(this);
	}

	componentDidMount() {
		this.drawPlot();
	}
	componentDidUpdate() {
		this.drawPlot();
	}

	drawPlot() {
		//Helper functions

		// draw the plot
		const width = this.props.size[0];
		const height = this.props.size[1];
		const node = this.node;

		const svg = d3.select(node).style('font', '10px sans-serif');

		const data = [...this.props.Outbreak.postorderAll()].filter(x => x.parent).map(x => x.branchLengthTime);

		// const data = this.props.Outbreak.caseList.filter(x=>x.parent).map(x => {
		// 	return x.onset - x.parent.onset;
		// });		// popuate data
		// line chart based on http://bl.ocks.org/mbostock/3883245
		const xScale = d3
			.scaleLinear()
			.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])
			.domain([0, d3.max(data)]);
		const bins = d3.histogram().domain(xScale.domain())(data);
		const yScale = d3
			.scaleLinear()
			.range([height - this.props.margin.top - this.props.margin.bottom, this.props.margin.bottom])
			.domain([0, d3.max(bins, d => d.length / data.length)])
			.nice();

		//remove current plot
		svg.selectAll('g').remove();
		// do the drawing
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);

		const svgGroup = svg.select('g');

		drawAxis(
			svgGroup,
			xScale,
			yScale,
			this.props.size,
			this.props.margin,
			'Days post infection onset',
			'Probability density'
		);
		svgGroup
			.attr('fill', 'steelblue')
			.selectAll('rect')
			.data(bins)
			.enter()
			.append('rect')
			.attr('x', d => xScale(d.x0) + 1)
			.attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
			.attr('y', d => yScale(d.length / data.length))
			.attr(
				'height',
				d => height - this.props.margin.bottom - this.props.margin.top - yScale(d.length / data.length)
			);
	}
	render() {
		const data = [...this.props.Outbreak.postorderAll()].filter(x => x.parent).map(x => x.branchLengthTime);
		return (
			<div>
				<div>{`Serial interval (days) (mean: ${d3.mean(data).toFixed(2)}))`}</div>
				<svg ref={node => (this.node = node)} width={this.props.size[0]} height={this.props.size[1]} />
			</div>
		);
	}
}

export default SerialInterval;
