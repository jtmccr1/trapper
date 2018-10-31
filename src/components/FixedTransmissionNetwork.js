import React from 'react';
import * as d3 from 'd3v4';
import { onlyUnique } from '../utils/commonFunctions';
import { positionNodes, addBranches, addNodes } from '../utils/plotTreeFunctions';
import { colours } from '../styles/colours';

class FixedTransmissionNetwork extends React.Component {
	constructor(props) {
		super(props);
		this.drawTransPlot = this.drawTransPlot.bind(this);
		this.highlightNodes = this.highlightNodes.bind(this);
		this.state = {
			zoomNode: this.props.transmissionTree.rootNode,
		};
		this.zoomToNode = this.zoomToNode.bind(this);
		this.resetZoom = this.resetZoom.bind(this);
	}
	componentDidMount() {
		this.drawTransPlot();
		this.highlightNodes();
	}
	componentDidUpdate() {
		this.drawTransPlot();
		this.highlightNodes();
	}
	zoomToNode(node) {
		this.setState({ zoomNode: node }, this.drawTransPlot());
	}

	resetZoom() {
		this.setState(
			{
				zoomNode: this.props.transmissionTree.rootNode,
			},
			this.drawTransPlot()
		);
	}

	drawTransPlot() {
		positionNodes(this.props.transmissionTree);
		const node = this.node;
		const width = this.props.size[0];
		const height = this.props.size[1];
		const svg = d3.select(node).style('font', '10px sans-serif');

		const displayNodes = this.props.transmissionTree.broadSearch(this.state.zoomNode);
		const allData = this.props.transmissionTree.nodeList;
		const processedData = allData.filter(d => displayNodes.map(e => e.Id).indexOf(d.Id) > -1);

		const yScale = d3
			.scaleLinear()
			.range([height - this.props.margin.top - this.props.margin.bottom - 10, this.props.margin.bottom])
			.domain([d3.min(processedData, d => d.width), d3.max(processedData, d => d.width)]);
		const xScale = d3
			.scaleLinear()
			.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])
			.domain([d3.min(processedData, d => d.Onset), d3.max(processedData, d => d.Onset)]);

		const makeLinePath = d3
			.line()
			.x(d => xScale(d.Onset))
			.y(d => yScale(d.width))
			.curve(d3.curveStepBefore);
		//remove current plot
		svg.selectAll('g').remove();
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);

		const svgGroup = svg.select('g');
		//Create SVG element
		//Create edges as lines

		// edges
		svgGroup
			.selectAll('.line')
			.data(
				processedData.filter(n => n.parent).map(n => {
					return {
						target: n,
						values: [{ Onset: n.parent.Onset, width: n.parent.width }, { Onset: n.Onset, width: n.width }],
					};
				})
			)
			.enter()
			.append('path')
			.attr('class', 'branch')
			.attr('fill', 'none')
			.attr('stroke-width', 2)
			.attr('d', edge => makeLinePath(edge.values))
			.attr('stroke', 'grey');

		svgGroup
			.selectAll('.branch')
			.on('mouseover', function(d, i) {
				d3.select(this).attr('stroke-width', 5);
			})
			.on('mouseout', function(d, i) {
				d3.select(this).attr('stroke-width', 2);
			})
			.on('click', (d, i) => this.zoomToNode(d.target));

		//Create nodes as circles
		svgGroup
			.selectAll('circle')
			.data(processedData)
			.enter()
			.append('circle');
		const locations = this.props.transmissionTree.nodeList.map(d => d.Location).filter(onlyUnique);
		svgGroup
			.selectAll('circle')
			.attr('id', d => d.Id)
			.attr('cx', d => xScale(d.Onset))
			.attr('cy', d => yScale(d.width))
			.attr('r', 5)
			.style('stroke-width', 2)

			.on('click', d => this.props.selectSample(d))
			.style(
				'fill',
				d => (this.props.byLocation ? colours['test'][locations.indexOf(d.Location)] : colours['grey'])
			);
		// Add time axis
		const xScaletime = d3
			.scaleTime()
			.domain(d3.extent(processedData, d => d.Onset)) // Sample time - have to think about if this is robust
			.range([this.props.margin.left, width - this.props.margin.right - this.props.margin.left]);

		const xAxis = d3.axisBottom().scale(xScaletime);

		svgGroup
			.append('g')
			.attr('class', 'axis')
			.attr('transform', `translate(0,${this.props.size[1] - this.props.margin.top - this.props.margin.bottom} )`)
			.call(xAxis)
			.selectAll('text')
			.attr('y', 0)
			.attr('x', 9)
			.attr('transform', `rotate(45)`)
			.style('text-anchor', 'start');
	}

	highlightNodes() {
		const node = this.node;
		const svg = d3.select(node).style('font', '10px sans-serif');
		const svgGroup = svg.select('g');

		svgGroup.selectAll('circle').style('stroke', d => {
			const color = this.props.selectedCases.map(n => n.Id).indexOf(d.Id) > -1 ? 'red' : 'black';
			return color;
		});
	}

	render() {
		return (
			<div>
				<div>
					<button onClick={this.resetZoom}>Reset View</button>
					<span style={{ paddingRight: '10px' }}>Color by: Clade:</span>

					<label className="switch">
						<input type="checkbox" onClick={this.props.updateView} checked={this.props.byLocation} />
						<span className="slider round" />
					</label>
					<span style={{ paddingLeft: '10px', paddingRight: '10px' }}>By Location</span>
				</div>
				<svg ref={node => (this.node = node)} width={this.props.size[0]} height={this.props.size[1]} />
			</div>
		);
	}
}

export default FixedTransmissionNetwork;
