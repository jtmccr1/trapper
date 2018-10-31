import React from 'react';
import * as d3 from 'd3v4';
import { drawAxis, onlyUnique } from '../utils/commonFunctions';
import { colours } from '../styles/colours';

// With help from https://bl.ocks.org/gcalmettes/95e3553da26ec90fd0a2890a678f3f69

class CasesLinePlot extends React.Component {
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
		const processedData = this.props.caseList;
		const xScale = d3
			.scaleTime()
			.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])
			.domain(d3.extent(processedData, d => d.Onset))
			.nice();

		let bins = [];
		const yScale = d3
			.scaleLinear()
			.range([height - this.props.margin.top - this.props.margin.bottom, this.props.margin.bottom])
			.nice();
		if (this.props.view === 'byLocation') {
			const locations = processedData.map(d => d.Location).filter(onlyUnique);
			for (const location of locations) {
				bins.push(
					d3.histogram().domain(xScale.domain())(
						processedData.filter(d => d.Location === location).map(d => d.Onset)
					)
				);
			}
			yScale.domain([0, d3.max(bins, d => d3.max(d, x => x.length))]);
		} else {
			bins = d3.histogram().domain(xScale.domain())(processedData.map(d => d.Onset));
			yScale.domain([0, d3.max(bins, d => d.length)]);
		}

		//remove current plot
		svg.selectAll('g').remove();
		// do the drawing
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);

		const svgGroup = svg.select('g');

		const makeLine = d3
			.line()
			.x(d => xScale(d.x0))
			.y(d => yScale(d.length));

		drawAxis(svgGroup, xScale, yScale, this.props.size, this.props.margin, { rotate: 45, xlab: '', ylab: '' });
		if (this.props.view === 'byLocation') {
			svgGroup
				.selectAll('.line')
				.data(bins)
				.enter()
				.append('path')
				.attr('stroke-width', 2)
				.attr('d', makeLine)
				.style('fill', 'none')
				.style('stroke', (d, i) => colours['test'][i]);
		} else {
			svgGroup
				.append('path')
				.datum(bins)
				.attr('stroke-width', 2)
				.attr('d', bin => makeLine(bin))
				.style('fill', 'none')
				.style('stroke', colours['test'][0]);
		}
	}

	render() {
		return (
			<div>
				<div>
					<span style={{ paddingRight: '10px' }}>All Locations</span>

					<label className="switch">
						<input
							type="checkbox"
							onClick={this.props.updateView}
							checked={this.props.view === 'byLocation'}
						/>
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

export default CasesLinePlot;
