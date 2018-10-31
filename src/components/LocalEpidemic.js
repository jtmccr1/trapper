import React from 'react';
import * as d3 from 'd3v4';
import { drawAxis } from '../utils/commonFunctions';

// With help from https://bl.ocks.org/gcalmettes/95e3553da26ec90fd0a2890a678f3f69

class LocalEpidemic extends React.Component {
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
		//remove current plot
		svg.selectAll('g').remove();
		// do the drawing
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);

		const svgGroup = svg.select('g');
		const xScale = d3
			.scaleTime()
			.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])
			.domain(d3.extent(this.props.caseList, d => d.Onset))
			.nice();

		const bins = d3
			.histogram()
			.domain(xScale.domain())
			.thresholds(xScale.ticks(10))
			.value(d => d.Onset)(this.props.caseList);

		svgGroup
			.selectAll('circle')
			.data(this.props.caseList)
			.enter()
			.append('circle');

		const findBin = function(bin, key, value) {
			//return true if the is a object in the bin arrary with a key whose value matched value
			return Object.values(bin).filter(b => b[key] === value).length > 0;
		};
		const stackEntries = function(bins, key, value) {
			const correctBin = bins.filter(bin => findBin(bin, key, value))[0]; // This should only be 1 of the original bins but should be probably be test and made more robust
			return correctBin.findIndex(entry => entry[key] === value);
		};
		const that = this;
		const convertIndextoCy = function(i, radius) {
			return that.props.size[1] - i * 2 * radius - radius - that.props.margin.top - that.props.margin.bottom;
		};
		const getCy = function(bins, key, value, radius) {
			const index = stackEntries(bins, key, value);
			return convertIndextoCy(index, radius);
		};
		const getCx = function(bins, key, value) {
			const correctBin = bins.filter(bin => findBin(bin, key, value))[0];
			return xScale(correctBin.x0);
		};

		const xRadius = (xScale(bins[0].x1) - xScale(bins[0].x0)) / 2;
		const maxPile = bins.reduce((acc, cur) => Math.max(acc, cur.length), 0);
		const yRadius = (height - this.props.margin.top - this.props.margin.bottom) / (maxPile * 2); //*2 for radius not diameter
		const radius = Math.min(10, Math.min(xRadius, yRadius));
		// d3.select(node)
		// 	.selectAll('circle')
		// 	.data(this.props.caseList)
		// 	.exit()
		// 	.remove();

		svgGroup
			.selectAll('circle')
			.attr('cx', d => getCx(bins, 'Id', d.Id))
			.attr('cy', d => getCy(bins, 'Id', d.Id, radius))
			.attr('r', radius)
			.attr('id', d => d.Id);

		const yScale = d3
			.scaleLinear()
			.range([height - this.props.margin.top - this.props.margin.bottom, this.props.margin.bottom])
			.domain([0, maxPile])
			.nice();

		drawAxis(svgGroup, xScale, yScale, this.props.size, this.props.margin, { rotate: 45, xlab: '', ylab: '' });
	}

	render() {
		return (
			<div>
				<svg ref={node => (this.node = node)} width={this.props.size[0]} height={this.props.size[1]} />
			</div>
		);
	}
}

export default LocalEpidemic;
