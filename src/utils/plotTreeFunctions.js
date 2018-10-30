import * as d3 from 'd3v4';

export const positionNodes = tree => {
	//adding string id so we can id the nodes and branches and keep them consistent during transitions
	tree.nodeList.forEach((node, index) => (node.id = `node ${index}`));
	// external nodes get assigned height in 0-1.
	// external nodes are taken from the nodelist which is preorder traversal
	const numberOfExternalNodes = tree.externalNodes.length;
	const maxRootToTip = d3.max([...tree.rootToTipLengths()]);
	//tree.externalNodes relies on the nodeList which is set when the object is constructed and does not update with modifications
	// Here we get the order based on a current traversal
	const externalNodes = tree.externalNodes.sort((a, b) => {
		let postOrder = [...tree.postorder()].map(x => x.key);
		return postOrder.indexOf(a.key) - postOrder.indexOf(b.key);
	});

	for (const [i, node] of externalNodes.entries()) {
		//  x and y are in [0,1]
		node.height = tree.rootToTipLength(node) / maxRootToTip; //Node height
		node.width = i / numberOfExternalNodes; // Other axis width?
	}
	// internal nodes get the mean height of their childern
	for (const node of [...tree.postorder()]) {
		if (node.children) {
			node.height = tree.rootToTipLength(node) / maxRootToTip;
			node.width = d3.mean(node.children, kid => kid.width);
		}
	}
};
export const addNodes = (svgSelection, tree, scales) => {
	svgSelection
		.selectAll('circle')
		.data(tree.nodes, node => {
			return node.name ? node.name : node.id;
		}) // assign the key for continuity during transitions
		.enter()
		.append('circle')
		.attr('cx', d => {
			return scales.x(d.height);
		})
		.attr('cy', d => {
			return scales.y(d.width);
		})
		.attr('id', node => {
			return node.name ? node.name : node.id;
		})
		.style('fill', d => d.color)
		.attr('class', d => {
			// assign classes for styling later
			return !d.children ? ' node external-node' : ' node internal-node';
		});

	svgSelection.selectAll('.external-node').attr('r', 4);
};
export const addBranches = (svgSelection, tree, scales) => {
	const makeLinePath = d3
		.line()
		.x(d => scales.x(d.height))
		.y(d => scales.y(d.width))
		.curve(d3.curveStepBefore);

	svgSelection
		.selectAll('.line')
		.data(
			tree.nodes.filter(n => n.parent).map(n => {
				return {
					target: n,
					values: [{ height: n.parent.height, width: n.parent.width }, { height: n.height, width: n.width }],
				};
			}),
			n => n.target.id
		)
		.enter()
		.append('path')
		.attr('class', 'line branch')
		.attr('fill', 'none')
		.attr('stroke', d => d.target.color)
		.attr('stroke-width', 2)
		.attr('id', edge => edge.target.id)
		.attr('d', edge => makeLinePath(edge.values));
};
