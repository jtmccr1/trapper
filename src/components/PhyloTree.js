import React from 'react';
import * as d3 from 'd3v4';
import { positionNodes, addBranches, addNodes } from '../utils/plotTreeFunctions.js';
import { colours } from '../styles/colours';
import { toolTipCSS } from '../utils/commonStyles';
import { onlyUnique } from '../utils/commonFunctions';
import '../styles/temporary.css';

class Phylotree extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selectedNode: null,
		};
		this.drawTree = this.drawTree.bind(this);
	}

	componentDidMount() {
		this.drawTree();
	}
	componentDidUpdate() {
		this.drawTree();
	}

	drawTree() {
		const that = this;
		function handleMouseMove(d, i) {
			const [mouseX, mouseY] = d3.mouse(this); // [x, y] x starts from left, y starts from top
			const left = mouseX > 0.5 * xScale.range()[1] ? '' : `${mouseX}px`;
			const right = mouseX > 0.5 * xScale.range()[1] ? `${xScale.range()[1] - mouseX}px` : '';
			const metaData = that.props.caseList.filter(x => x.Id === this.id)[0];
			const hoverText = metaData
				? `
			${metaData.Id}
			</br>
			Onset: ${metaData.Onset.toISOString().substring(0, 10)}
			</br>
			Sampled: ${metaData.SampleTime.toISOString().substring(0, 10)}
			</br>
			Outcome: ${metaData.Outcome}
			</br>
			Contact: Lab3
`
				: `No metadata for ${this.id}`;
			d3.select(infoRef)
				.style('left', left)
				.style('right', right)
				.style('top', `${mouseY}px`)
				.style('visibility', 'visible')
				.html(hoverText);
		}
		function handleMouseOut() {
			d3.select(infoRef).style('visibility', 'hidden');
		}

		const node = this.node;
		const infoRef = this.infoRef;
		const svg = d3.select(node).style('font', '10px sans-serif');
		svg.selectAll('g').remove();
		svg.append('g').attr('transform', `translate(${this.props.margin.left},${this.props.margin.top})`);

		const svgGroup = svg.select('g');

		const tree = this.props.tree;
		// get the size of the svg we are drawing on
		const width = this.props.size[0];
		const height = this.props.size[1];

		//Get colors set

		//Assign the node positions on a scale of 0-1
		positionNodes(tree);
		//remove the tree if it is there already

		//to save on writing later
		// create the scales
		const xScale = d3
			.scaleLinear()
			.domain([0, 1])
			.range([this.props.margin.left, width - this.props.margin.right - this.props.margin.left]);

		const yScale = d3
			.scaleLinear()
			.domain([0, 1])
			.range([this.props.margin.bottom, height - this.props.margin.top - this.props.margin.bottom]);
		//create otherstuff
		const scales = { x: xScale, y: yScale };

		addBranches(svgGroup, tree, scales);

		addNodes(svgGroup, tree, scales);

		//svgGroup.selectAll('.branch').style('stroke', colours['grey']);
		//svgGroup.selectAll('.node').style('fill', colours['grey']);

		svgGroup
			.selectAll('.external-node')
			.on('mouseout', handleMouseOut)
			.on('mousemove', handleMouseMove);

		// Add time axis
		const xScaletime = d3
			.scaleTime()
			.domain(d3.extent(this.props.caseList, d => d.Onset)) // Sample time - have to think about if this is robust
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

		svgGroup
			.selectAll('.branch')
			.on('mouseover', (d, i) => {
				const boldChildren = [...this.props.tree.postorder(d.target)].map(kid => kid.Id); // aren't they all
				d3.selectAll('.branch').attr('stroke-width', d => (boldChildren.indexOf(d.target.Id) > -1 ? 5 : 2));
			})
			.on('mouseout', function(d, i) {
				d3.selectAll('.branch').attr('stroke-width', 2);
			});

		//  // extra parametersa are ignored if not required by the callback
		// for(const callback of [...callBacks]){
		//   callback(svgSelection,tree,scales)
		// }
		// //addLabels();
	}

	render() {
		return (
			<div>
				<div>
					<span style={{ paddingRight: '10px' }}>Color by: Clade:</span>

					<label className="switch">
						<input type="checkbox" onClick={this.props.updateView} checked={this.props.byLocation} />
						<span className="slider round" />
					</label>
					<span style={{ paddingLeft: '10px', paddingRight: '10px' }}>By Location</span>
				</div>
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

export default Phylotree;
