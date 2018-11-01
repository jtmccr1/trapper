import React from 'react';
import * as d3 from 'd3v4';
import { drawAxis, onlyUnique } from '../utils/commonFunctions';
import { colours } from '../styles/colours';

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

		const displayNodes = this.props.transmissionTree.broadSearch(this.props.zoomCase);
		const allData = this.props.transmissionTree.nodeList;
		const processedData = allData.filter(d => displayNodes.map(e => e.Id).indexOf(d.Id) > -1);

		const xScale = d3
			.scaleTime()
			.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])
			.domain(d3.extent(processedData, d => d.Onset))
			.nice();

		let bins;
		let series;
		let colorPallete;
		const yScale = d3
			.scaleLinear()
			.range([height - this.props.margin.top - this.props.margin.bottom, this.props.margin.bottom])
			.nice();
		if (!this.props.byLocation) {
			bins = d3
				.histogram()
				.domain(xScale.domain())
				.thresholds(xScale.ticks(10))
				.value(d => d.Onset)(processedData);
			yScale.domain([0, d3.max(bins, d => d.length)]);
			const colors = this.props.tree.nodeList.map(d => d.color).filter(onlyUnique);

			const dataSet = bins.map(bin => {
				const outObj = {};
				for (const color of [...colors]) {
					outObj[color] = bin.filter(
						c =>
							this.props.tree.nodeList
								.filter(n => n.color === color)
								.map(n => n.name)
								.indexOf(c.Id) > -1
					).length;
				}
				outObj['grey'] = bin.filter(c => this.props.tree.nodeList.map(n => n.name).indexOf(c.Id) === -1).length;
				return outObj;
			});
			// split each bin into location
			const stack = d3.stack().keys(['grey', ...colors]);
			series = stack(dataSet);
			colorPallete = [colours['grey'], ...colours['test']];
		} else {
			bins = d3
				.histogram()
				.domain(xScale.domain())
				.thresholds(xScale.ticks(10))
				.value(d => d.Onset)(processedData);
			yScale.domain([0, d3.max(bins, d => d.length)]);
			const locations = processedData.map(d => d.Location).filter(onlyUnique);

			const dataSet = bins.map(bin => {
				const outObj = {};
				for (const locale of [...locations]) {
					outObj[locale] = bin.filter(c => c.Location === locale).length;
				}
				outObj.x0 = bin.x0;

				return outObj;
			});
			// split each bin into location
			const stack = d3.stack().keys([...locations]);
			series = stack(dataSet);
			colorPallete = colours['test'];
		}

		//remove scurrent plot
		svg.selectAll('g').remove();
		// do the drawing
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);

		const svgGroup = svg.select('g');

		drawAxis(svgGroup, xScale, yScale, this.props.size, this.props.margin, { rotate: 45, xlab: '', ylab: '' });

		svgGroup
			.selectAll('.series')
			.data(series)
			.enter()
			.append('g')
			.style('fill', (d, i) => colorPallete[i])
			.selectAll('rect')
			.data(function(d) {
				return d;
			})
			.enter()
			.append('rect')
			.attr('x', (d, i) => xScale(bins[i].x0) + 1)
			.attr('width', (d, i) => Math.max(0, Math.max(0, xScale(bins[i].x1) - xScale(bins[i].x0) - 1)))
			.attr('y', d => yScale(d[1]))
			.attr(
				'height',
				d => {
					return yScale(d[0]) - yScale(d[1]);
				} //height - this.props.margin.bottom - this.props.margin.top -
			);
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
