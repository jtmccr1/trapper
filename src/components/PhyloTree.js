import React from 'react';
import * as d3 from 'd3v4';
import { positionNodes, addBranches, addNodes } from '../utils/plotTreeFunctions.js';
import { colours } from '../styles/colours';
import { toolTipCSS } from '../utils/commonStyles';
class Phylotree extends React.Component {
	constructor(props) {
		super(props);
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
			d3
				.select(infoRef)
				.style('left', left)
				.style('right', right)
				.style('top', `${mouseY}px`)
				.style('visibility', 'visible').html(`
                                     ${metaData.Id}
                                     </br>
                                     Onset: ${metaData.Onset.toISOString().substring(0, 10)}
                                     </br>
                                     Sampled: ${metaData.Onset.toISOString().substring(0, 10)}
                                     </br>
                                     Outcome: ${metaData.Outcome}
                                     </br>
                                     Sequencing Lab: Lab${Math.floor(Math.random(5) * 10)}
                `);
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

		//Assign the node positions on a scale of 0-1
		positionNodes(tree);
		//remove the tree if it is there already

		//to save on writing later
		// create the scales
		const xScale = d3
			.scaleLinear()
			.domain([0, 1])
			.range([this.props.margin.left, width - this.props.margin.right]);

		const yScale = d3
			.scaleLinear()
			.domain([0, 1])
			.range([this.props.margin.bottom, height - this.props.margin.top]);
		//create otherstuff
		const scales = { x: xScale, y: yScale };

		addBranches(svgGroup, tree, scales);

		addNodes(svgGroup, tree, scales);

		svgGroup.selectAll('.branch').style('stroke', colours['grey']);
		svgGroup.selectAll('.node').style('fill', colours['grey']);

		svgGroup
			.selectAll('.external-node')
			.on('mouseout', handleMouseOut)
			.on('mousemove', handleMouseMove);

		//  // extra parametersa are ignored if not required by the callback
		// for(const callback of [...callBacks]){
		//   callback(svgSelection,tree,scales)
		// }
		// //addLabels();
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

export default Phylotree;
