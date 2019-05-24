import React from 'react';
import * as d3 from 'd3v4';
import { onlyUnique } from '../utils/commonFunctions';
import { colours } from '../styles/colours';
import { toolTipCSS } from '../utils/commonStyles';

class SelectedTransmissionNetwork extends React.Component {
	constructor(props) {
		super(props);
		this.drawTransPlot = this.drawTransPlot.bind(this);
		this.highlightNodes = this.highlightNodes.bind(this);
	}
	componentDidMount() {
		this.drawTransPlot();
		this.highlightNodes();
	}
	componentDidUpdate() {
		this.drawTransPlot();
		this.highlightNodes();
	}

	drawTransPlot() {
		const that = this;
		const infoRef = this.infoRef;
		function handleMouseMove(d, i) {
			const [mouseX, mouseY] = d3.mouse(this); // [x, y] x starts from left, y starts from top
			const left = mouseX > 0.5 * xScale.range()[1] ? '' : `${mouseX}px`;
			const right = mouseX > 0.5 * xScale.range()[1] ? `${xScale.range()[1] - mouseX}px` : '';
			const metaData = that.props.transmissionTree.nodeList.filter(x => x.Id === this.id)[0];
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
		// get sub tree from samples -

		function positionNodes(selectedCases, subtreeParents, tree) {
			//Get selected Cases that are not ancesters to any othe selected nodes
			const externalCases = selectedCases.filter(x => subtreeParents.map(d => d.Id).indexOf(x.Id) === -1);
			// external nodes get assigned height in 0-1.
			// external nodes are taken from the nodelist which is preorder traversal

			const numberOfExternalNodes = externalCases.length - 1;

			let postOrder = [...tree.postorder()].map(x => x.Id);
			const externalNodes = externalCases.sort((a, b) => {
				return postOrder.indexOf(a.Id) - postOrder.indexOf(b.Id);
			});

			for (const [i, node] of externalNodes.entries()) {
				//  x and y are in [0,1]
				node.subY = i / numberOfExternalNodes; // Other axis width?
				//node.mutationsFromRoot = tree.rootToTipMutations(node);
			}
			// internal nodes get the mean height of their childern
			const internalNodes = [...selectedCases, ...subtreeParents].filter(
				d => externalCases.map(x => x.Id).indexOf(d.Id) === -1
			);
			internalNodes.sort((a, b) => {
				return postOrder.indexOf(a.Id) - postOrder.indexOf(b.Id);
			});
			for (const node of internalNodes) {
				// maintains order of the main tree
				if (node.children && node.children.length > 0) {
					const childrenInSubtree = node.children.filter(
						x => [...selectedCases, ...subtreeParents].map(d => d.Id).indexOf(x.Id) > -1
					);
					node.subY = d3.mean(childrenInSubtree, kid => kid.subY);
					//node.mutationsFromRoot = tree.rootToTipMutations(node);
				}
			}
		}

		const sequencedCases = this.props.transmissionTree.nodeList.filter(
			x => this.props.tree.externalNodes.map(n => n.name).indexOf(x.Id) > -1
		);
		const mrca = this.props.transmissionTree.MRCA(sequencedCases);
		let subtreeParents = [mrca];
		for (const node of sequencedCases) {
			if (node.parent && node !== mrca) {
				let currentNode = node.parent;
				while (currentNode !== mrca) {
					subtreeParents.push(currentNode);
					currentNode = currentNode.parent;
				}
			}
		}

		const allData = [...sequencedCases, ...subtreeParents];
		const displayNodes = this.props.transmissionTree.broadSearch(this.props.zoomCase);
		const processedData = allData.filter(d => displayNodes.map(e => e.Id).indexOf(d.Id) > -1);
		positionNodes(processedData, subtreeParents, this.props.transmissionTree);

		//positionNodes(subtree);
		const node = this.node;
		const width = this.props.size[0];
		const height = this.props.size[1];
		const svg = d3.select(node).style('font', '10px sans-serif');

		const yScale = d3
			.scaleLinear()
			.range([height - this.props.margin.top - this.props.margin.bottom - 10, this.props.margin.bottom])
			.domain([0, 1]);
		const xScale = d3
			.scaleLinear()
			.range([this.props.margin.left, width - this.props.margin.left - this.props.margin.right])
			.domain([d3.min(processedData, d => d.Onset), d3.max(processedData, d => d.Onset)]);

		const makeLinePath = d3
			.line()
			.x(d => xScale(d.Onset))
			.y(d => yScale(d.subY))
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
				processedData.filter(d => d.Id !== mrca.Id).map(n => {
					return {
						target: n,
						values: [{ Onset: n.parent.Onset, subY: n.parent.subY }, { Onset: n.Onset, subY: n.subY }],
					};
				})
			)
			.enter()
			.append('path')
			.attr('class', 'transmission-branch')
			.attr('fill', 'none')
			.attr('stroke-width', 2)
			.attr('d', edge => makeLinePath(edge.values))
			.style('stroke', 'grey');

		svgGroup
			.selectAll('.transmission-branch')
			.on('mouseover', (d, i) => {
				const boldChildren = [...this.props.transmissionTree.postorder(d.target)].map(kid => kid.Id); // aren't they all
				d3.selectAll('.transmission-branch').attr(
					'stroke-width',
					d => (boldChildren.indexOf(d.target.Id) > -1 ? 5 : 2)
				);
			})
			.on('mouseout', function(d, i) {
				d3.selectAll('.transmission-branch').attr('stroke-width', 2);
			})
			.on('click', (d, i) => this.this.props.zoomToNode('case', d.target));

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
			.attr('cy', d => yScale(d.subY))
			.attr('r', 5)
			.on('click', d => this.props.selectSample(d))
			.on('mouseover', handleMouseMove)
			.on('mouseout', handleMouseOut)
			.style('stroke-width', 2)
			.style('stroke', 'black')
			.style(
				'fill',
				d =>
					this.props.byLocation
						? colours['test'][locations.indexOf(d.Location)]
						: this.props.tree.nodeList.filter(n => n.name === d.Id).length > 0
							? this.props.tree.nodeList.filter(n => n.name === d.Id)[0].color
							: colours['grey'] // get color from phylonode
			);
		//.attr('fill-opacity', d => (this.props.selectedCases.map(c => c.Id).indexOf(d.Id) > -1 ? 1 : 0.1));

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
		svgGroup.select('.y').remove();
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
					<button onClick={this.props.resetZoom}>Reset View</button>
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

export default SelectedTransmissionNetwork;
