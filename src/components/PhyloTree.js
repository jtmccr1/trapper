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
		function colorDescents(color) {
			console.log(color);
		}
		function handleClick() {
			const [mouseX, mouseY] = d3.mouse(this); // [x, y] x starts from left, y starts from top
			const left = mouseX > 0.5 * xScale.range()[1] ? '' : `${mouseX}px`;
			const right = mouseX > 0.5 * xScale.range()[1] ? `${xScale.range()[1] - mouseX}px` : '';
			const colorDescents = color => {
				console.log(color);
			};
			const hoverText = `
			Color clade :
				<ul class='custom-menu'>
				
				<li onClick = colorDescents(${colours['test'][0]}) data-action = ${colours['test'][0]}>${colours['test'][0]}</li>
				<li onclick = 'colorDescents(${colours['test'][0]})' data-action = ${colours['test'][1]}>${colours['test'][1]}</li>
				<li onClick = colorDescents(${colours['test'][0]}) data-action = ${colours['test'][2]}>${colours['test'][2]}</li>
				<li onClick = 'colorDescents(${colours['test'][0]})' data-action = ${colours['test'][3]}>${colours['test'][3]}</li>

			  </ul>
		`; // add onclick callback to these options would be great to  make this from an array

			d3.select(infoRef)
				.style('left', left)
				.style('right', right)
				.style('top', `${mouseY}px`)
				.style('visibility', 'visible')
				.html(hoverText);
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
		if (this.props.view === 'byLocation') {
			// color get location of nodes
			const locations = this.props.caseList.map(d => d.Location).filter(onlyUnique);

			this.props.tree.externalNodes.forEach(node => {
				// Get location from metadata
				const metaData = this.props.caseList.filter(x => x.Id === node.name)[0];
				node.color = metaData ? colours['test'][locations.indexOf(metaData.Location)] : colours['grey'];
			});
			[...this.props.tree.postorder()].forEach(node => {
				if (node.children) {
					const childColors = node.children.map(n => n.color).filter(onlyUnique);
					node.color = childColors.length === 1 ? childColors[0] : childColors; // save for a tie breaker
				}
			});
			// tie break where possible
			const needAttention = [...this.props.tree.postorder()].filter(node => Array.isArray(node.color));

			for (const trouble of needAttention) {
				// check if the sybling has one of the colors
				const sybling = trouble.parent ? trouble.parent.children.filter(x => x.key !== trouble.key)[0] : false;
				if (sybling && !Array.isArray(sybling.color) && trouble.color.indexOf(sybling.color) > -1) {
					trouble.color = sybling.color;
				} else {
					trouble.color = colours['grey'];
				}
			}
		} else {
			this.props.tree.nodeList.forEach(node => (node.color = colours['grey']));
		}
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
			.on('mouseover', function(d, i) {
				d3.select(this).attr('stroke-width', 5);
			})
			.on('mouseout', function(d, i) {
				d3.select(this).attr('stroke-width', 2);
			});

		svgGroup.selectAll('.branch').on('click', handleClick);

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
					<span style={{ paddingRight: '10px' }}>Color:</span>

					<label className="switch">
						<input
							type="checkbox"
							onClick={this.props.updateView}
							checked={this.props.view === 'byLocation'}
						/>
						<span className="slider round" />
					</label>
					<span style={{ paddingLeft: '10px', paddingRight: '10px' }}>By Location</span>

					<label className="switch">
						<input
							type="checkbox"
							onClick={this.props.updateView}
							checked={this.props.view === 'userSelect'}
						/>
						<span className="slider round" />
					</label>
					<span style={{ paddingLeft: '10px' }}>By user selection</span>
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
