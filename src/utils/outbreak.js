/** @module transmission-sim */

/**
 * The Outbreak class. Currently the rate of transmission is constant but it could be adjusted in
 * the future. That'd be nice.
 */
const Tree = require('./figtree.js').Tree;
export class Outbreak {
	/**
	 * The constructor takes a config object containing a starting seed for the outbreak,
	 * a probability distribution for infectivity over time, and a distribution from which to draw the
	 * number of subsequent infections.
	 *
	 * @constructor
	 * @param {object} params - The parameters governing the outbreak.
	 * These are curried functions that wait for an x value, and are keyed as {infectivityCDF:,R0cdf:}
	 */
	constructor(
		sampleTime = 3,
		index = {
			onset: 0,
			level: 0,
		},
		epiParams = {},
		tree = new Tree()
	) {
		this.tree = tree;

		this.sampleTime = sampleTime;
		this.epiParams = epiParams;
		this.index = index;
		this.time = 0;
		this.caseList = this.broadSearch();
		//this.caseList.forEach((n, index) => (n.key = Symbol.for(`case ${index}`)));
		this.caseList.sort((a, b) => a.onset - b.onset).forEach((n, index) => (n.Id = `case${index}`));
		//this.caseMap = new Map(this.caseList.map(node => [node.key, node]));
		this.AllCases = [...this.postorderAll()];
	}
	/**
	 * Gets the index case node of the outbreak
	 *
	 * @returns {Object|*}
	 */
	get indexCase() {
		return this.index;
	}
	/**
	 * Gets the epiparameters used in the outbreak
	 *
	 * @returns {Object|*}
	 */
	get epiParameters() {
		return this.epiParams;
	}
	update() {
		this.caseList = this.broadSearch();
		//this.caseList.forEach((n, index) => (n.key = Symbol.for(`case ${index}`)));
		this.caseList.sort((a, b) => a.onset - b.onset).forEach((n, index) => (n.Id = `case${index}`));
	}
	// /**
	//  * Returns a case from its key (a unique Symbol) stored in
	//  * the node as poperty 'key'.
	//  *
	//  * @param key
	//  * @returns {*}
	//  */
	// getCase(key) {
	// 	return this.caseMap.get(key);
	// }
	/**
	 * A generator function that returns the nodes in a post-order traversal.
	 * This is borrowed from figtree.js c- Andrew Rambaut.
	 * @returns {IterableIterator<IterableIterator<*|*>>}
	 */
	*postorder(startNode = this.index) {
		const traverse = function*(node) {
			if (node.children) {
				for (const child of node.children) {
					yield* traverse(child);
				}
			}
			yield node;
		};

		yield* traverse(startNode);
	}
	/**
	 * A generator function that returns the nodes in a post-order traversal.
	 * This is borrowed from figtree.js c- Andrew Rambaut.
	 * @returns {IterableIterator<IterableIterator<*|*>>}
	 */
	*postorderAll(startNode = this.index) {
		const traverse = function*(node) {
			if (node.futureChildren) {
				for (const child of [...node.children, ...node.futureChildren]) {
					yield* traverse(child);
				}
			}
			yield node;
		};

		yield* traverse(startNode);
	}

	/**
	 * A generator function that returns the nodes in a pre-order traversal
	 * This is borrowed from figtree.js c- Andrew Rambaut.
	 * @returns {IterableIterator<IterableIterator<*|*>>}
	 */
	*preorder(startNode = this.index) {
		const traverse = function*(node) {
			yield node;
			if (node.children) {
				for (const child of node.children) {
					yield* traverse(child);
				}
			}
		};

		yield* traverse(startNode);
	}
	get cases() {
		return [...this.caseList];
	}

	broadSearch(startNode = this.index) {
		let q = [startNode];
		let visited = [];
		while (q.length > 0) {
			const v = q.shift();
			visited.push(v);
			if (v.children) {
				for (const child of v.children) {
					q.push(child);
				}
			}
		}
		return visited;
	}

	/**
	 * Gets an array containing all the external node objects
	 * This is borrowed from figtree.js c- Andrew Rambaut.
	 * @returns {*}
	 */
	get externalCases() {
		return this.cases.filter(node => !node.children || node.children.length === 0);
	}

	/**
	 * Returns transmitted cases from a donor case
	 *
	 * @param donor - the donor case, epiParameters - object keyed with R0 and serialInterval
	 * where each entry is a function which returns a sample from a distribution.
	 * @returns adds children to donor case if transmission occurs
	 */
	transmit(donor, epiParameters) {
		// How many transmissions with this case have
		if (!donor.futureChildren) {
			const numberOftransmissions = epiParameters.R0();
			donor.futureChildren = [];
			for (let i = 1; i <= numberOftransmissions; i++) {
				const child = {
					parent: donor,
					level: donor.level + 1,
					interval: epiParameters.serialInterval(),
					genome: donor.genome,
				};
				child.onset = donor.onset + child.interval;
				donor.futureChildren.push(child);
			}
		} else {
			console.log(`Already seen node: ${donor.Id}`);
		}
	}

	/**
	 * A function that calls a transmission call on all nodes until the desired number of days have passed
	 * to the outbreak. It starts at the most recent level.
	 * @param levels - the number of levels to add to the growing transmission chain.
	 */
	spread() {
		const transmitters = this.caseList.filter(x => !x.futureChildren);
		const transmitted = this.caseList.filter(x => x.futureChildren && x.futureChildren.length > 0);
		transmitters.map(node => this.transmit(node, this.epiParams, this.evoParams));
		for (const node of transmitters) {
			if (node.futureChildren.length === 0) {
				node.children = [];
			} else if (node.futureChildren.length > 0) {
				//there are some that transmitted in the time
				if (!node.children) {
					node.children = [];
				}
				for (const child of node.futureChildren) {
					if (child.onset <= this.time) {
						node.children.push(child);
					}
				}
				node.futureChildren = node.futureChildren.filter(kid => kid.onset > this.time);
			}
		}
		for (const node of transmitted) {
			if (node.futureChildren.length > 0) {
				//there are some that transmitted in the time
				if (!node.children) {
					node.children = [];
				}
				for (const child of node.futureChildren) {
					if (child.onset <= this.time) {
						node.children.push(child);
					}
				}
				node.futureChildren = node.futureChildren.filter(kid => kid.onset > this.time);
			}
		}
		this.update();
	}

	// These are from Figtree.js
	/**
	 * Reverses the order of the children of the given node. If 'recursive=true' then it will
	 * descend down the subtree reversing all the sub nodes.
	 *
	 * @param node
	 * @param recursive
	 */
	rotate(node, recursive = false) {
		if (node.children) {
			if (recursive) {
				for (const child of node.children) {
					this.rotate(child, recursive);
				}
			}
			node.children.reverse();
		}
	}

	/**
	 * Sorts the child branches of each node in order of increasing or decreasing number
	 * of tips. This operates recursively from the node give.
	 *
	 * @param node - the node to start sorting from
	 * @param {boolean} increasing - sorting in increasing node order or decreasing?
	 * @returns {number} - the number of tips below this node
	 */
	order(node, increasing = true) {
		const factor = increasing ? 1 : -1;
		let count = 0;

		if (node.children) {
			const counts = new Map();

			for (const child of node.children) {
				const value = this.order(child, increasing);

				counts.set(child, value);
				count += value;
			}
			node.children.sort((a, b) => counts.get(a) - counts.get(b) * factor);
		} else {
			count = 1;
		}
		return count;
	}

	/**
	 * Gives the distance from the root to a given tip (external node).
	 * @param tip - the external node
	 * @returns {number}
	 */
	rootToTipLength(tip) {
		let length = 0.0;
		let node = tip;

		while (node.parent) {
			length += node.branchLength;
			node = node.parent;
		}
		return length;
	}
	rootToTipMutations(tip) {
		let length = 0.0;
		let node = tip;

		while (node.parent) {
			length += node.mutations;
			node = node.parent;
		}
		return length;
	}
	/**
	 * An instance method to return a Newick format string for the Tree. Can be called without a parameter to
	 * start at the root node. Providing another node will generate a subtree. Labels and branch lengths are
	 * included if available.
	 *
	 * @param {object} node - The node of the tree to be written (defaults as the rootNode).
	 * @returns {string}
	 */
	transmissionToNewick(node = this.indexCase) {
		return (
			(node.children && node.children.length > 0
				? `(${node.children.map(child => this.transmissionToNewick(child)).join(',')})${node.Id ? node.Id : ''}`
				: node.Id) + (node.branchLengthTime ? `:${node.branchLengthTime}` : '')
		);
	}
	/**
	 * returns the most recent common ancestor of the nodes provided.
	 * @param nodes -
	 * @returns {mrca node}
	 */
	MRCA(nodes) {
		const getAncestors = node => {
			let ancestors = [node];
			while (node.parent) {
				ancestors.push(node.parent);
				node = node.parent;
			}
			return ancestors;
		};
		const getMCRA = (node1, node2) => {
			const ancestor1 = getAncestors(node1);
			const ancestor2 = getAncestors(node2);
			const commonAncestors = ancestor1.filter(x => ancestor2.map(y => y.Id).indexOf(x.Id) > -1);
			const mrca = commonAncestors.reduce(
				(acc, curr) => (acc.onset > curr.onset ? acc : curr),
				commonAncestors[0]
			);
			return mrca;
		};
		let currentMRCA = getMCRA(nodes[0], nodes[1]);
		for (let i = 2; i < nodes.length; i++) {
			currentMRCA = getMCRA(currentMRCA, nodes[i]);
		}
		return currentMRCA;
	}

	buildPhylo(startNode = this.indexCase) {
		this.tree = new Tree();
		const allNodes = [...this.preorder(startNode)];

		for (const node of allNodes) {
			//just in case
			const newPhyloNode = {
				length:
					node.children && node.children.length > 0
						? this.sampleTime + node.children.reduce((acc, curr) => Math.max(acc, curr.interval), 0)
						: this.epiParameters.serialInterval(),
				name: node.Id,
			};
			// check if there is phylogenetic node for this sample

			const currentPhyloNode =
				this.tree.nodeList.filter(x => x.name === node.Id).length === 1
					? this.tree.nodeList.filter(x => x.name === node.Id)[0]
					: newPhyloNode;

			// set length - should be updated if there are children to visit
			currentPhyloNode.length =
				node.children && node.children.length > 0
					? this.sampleTime + node.children.reduce((acc, curr) => Math.max(acc, curr.interval), 0)
					: currentPhyloNode.length;

			let currentParentPhyloNode = currentPhyloNode.parent ? currentPhyloNode.parent : this.tree.rootNode;

			if (currentParentPhyloNode === this.tree.rootNode) {
				// add the child
				currentParentPhyloNode.children = [currentPhyloNode];
				// add infecting strain node here so that times are consistent
				const initialInfecting = {
					length: 0,
					name: 'InitialInfection',
				};
				currentParentPhyloNode.children.push(initialInfecting);
			}
			// else it should already be there since we're using prexisting nodes
			if (node.children && node.children.length > 0) {
				for (const child of node.children.sort((a, b) => a.interval - b.interval)) {
					//remove currentPhyloNode from children
					currentParentPhyloNode.children = currentParentPhyloNode.children.filter(
						kid => kid !== currentPhyloNode
					);
					// Initiate new internal node
					const newInternal = {
						parent: currentParentPhyloNode,
						children: [],
						length: child.onset - this.tree.rootToTipLength(currentParentPhyloNode),
					};
					// link currentParentPhyloNode to newInternal
					currentParentPhyloNode.children.push(newInternal);
					//make transmissionchild
					const childPhyloNode = {
						parent: newInternal,
						length: this.epiParameters.serialInterval(),
						name: child.Id,
					};
					// add to newInternal children
					newInternal.children.push(childPhyloNode);
					newInternal.children.push(currentPhyloNode);

					currentPhyloNode.parent = newInternal;
					currentPhyloNode.length = currentPhyloNode.length - newInternal.length;
					currentParentPhyloNode = newInternal;

					this.tree.update();
				}
			}
		}
	}
}
