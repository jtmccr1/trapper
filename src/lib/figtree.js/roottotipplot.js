"use strict";

/** @module roottotipplot */

import {Tree, Type} from "./tree.js";
import {min,max,axisBottom,axisLeft,format,select,event,scaleLinear,line,mean} from "d3";

/**
 * The RootToTipPlot class
 */
export class RootToTipPlot {

    static DEFAULT_SETTINGS() {
        return {
            xAxisTickArguments: [5, "d"],
            xAxisTitle: "Time",
            yAxisTickArguments: [5, "f"],
            yAxisTitle: "Divergence",
            nodeRadius: 6,
            hoverNodeRadius: 8,
            backgroundBorder: 1,
            slopeFormat: ",.2f",
            r2Format: ",.2f"
        };
    }

    /**
     * The constructor.
     * @param svg
     * @param tree
     * @param margins
     * @param settings
     */
    constructor(svg, tree, margins, settings = {}) {
        this.svg = svg;
        this.tree = tree;

        // merge the default settings with the supplied settings
        this.settings = {...RootToTipPlot.DEFAULT_SETTINGS(), ...settings};

        this.points = tree.externalNodes
            .map((tip) => {
                return {
                    name: tip.name,
                    node: tip,
                    x: tip.date,
                    y: tree.rootToTipLength(tip)
                };
            });

        this.tipNodes = {};
        tree.externalNodes.forEach((tip) => this.tipNodes[tip.name] = tip );


        // call the private methods to create the components of the diagram
        createElements.call(this, svg, margins);
    }

    /**
     * returns slope, intercept and r-square of the line
     * @param data
     * @returns {{slope: number, xIntercept: number, yIntercept: number, rSquare: number, y: (function(*): number)}}
     */
    leastSquares(data) {

        const xBar = data.reduce((a, b) => (a + b.x), 0.0) / data.length;
        const yBar = data.reduce((a, b) => (a + b.y), 0.0) / data.length;

        const ssXX = data.map((d) => Math.pow(d.x - xBar, 2))
            .reduce((a, b) => a + b, 0.0);

        const ssYY = data.map((d) => Math.pow(d.y - yBar, 2))
            .reduce((a, b) => a + b, 0.0);

        const ssXY = data.map((d) => (d.x - xBar) * (d.y - yBar))
            .reduce((a, b) => a + b, 0.0);

        const slope = ssXY / ssXX;
        const yIntercept = yBar - (xBar * slope);
        const xIntercept = -(yIntercept / slope);
        const rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

        return {
            slope, xIntercept, yIntercept, rSquare, y: function (x) {
                return x * slope + yIntercept
            }
        };
    }

    /**
     * Updates the plot when the data has changed
     */
    update() {

        this.points.forEach((point) => {
            point.y = this.tree.rootToTipLength(point.node);
        });

        let x1 = min(this.points, d => d.x);
        let x2 = max(this.points, d => d.x);
        let y1 = 0.0;
        let y2 = max(this.points, d => d.y);

        // least squares regression
        const selectedPoints = this.points.filter((point) => !point.node.isSelected);

        const regression = this.leastSquares(selectedPoints);
        if (selectedPoints.length > 1 && regression.slope > 0.0) {
            x1 = regression.xIntercept;
            y2 = max([regression.y(x2), y2]);
        }

        // update the scales for the plot
        this.scales.x.domain([x1, x2]).nice();
        this.scales.y.domain([y1, y2]).nice();

        const xAxis = axisBottom(this.scales.x)
            .tickArguments(this.settings.xAxisTickArguments);
        const yAxis = axisLeft(this.scales.y)
            .tickArguments(this.settings.yAxisTickArguments);

        this.svgSelection.select("#x-axis")
            .transition()
            .duration(500)
            .call(xAxis);

        this.svgSelection.select("#y-axis")
            .transition()
            .duration(500)
            .call(yAxis);

        // update trend line
        const line = this.svgSelection.select("#regression");
        if (selectedPoints.length > 1) {

            line
                .transition()
                .duration(500)
                .attr("x1", this.scales.x(x1))
                .attr("y1", this.scales.y(regression.y(x1)))
                .attr("x2", this.scales.x(x2))
                .attr("y2", this.scales.y(regression.y(x2)));

            this.svgSelection.select("#statistics-slope")
                .text(`Slope: ${format(this.settings.slopeFormat)(regression.slope)}`);
            this.svgSelection.select("#statistics-r2")
                .text(`R^2: ${format(this.settings.r2Format)(regression.rSquare) }`);

        } else {
            line
                .transition()
                .duration(500)
                .attr("x1", this.scales.x(0))
                .attr("y1", this.scales.y(regression.y(0)))
                .attr("x2", this.scales.x(0))
                .attr("y2", this.scales.y(regression.y(0)));

            this.svgSelection.select("#statistics-slope")
                .text(`Slope: n/a`);
            this.svgSelection.select("#statistics-r2")
                .text(`R^2: n/a`);

        }

        if (this.settings.backgroundBorder > 0) {
            //update node background
            this.svgSelection.selectAll(".node-background")
                .transition()
                .duration(500)
                .attr("transform", d => {
                    return `translate(${this.scales.x(d.x)}, ${this.scales.y(d.y)})`;
                });
        }

        //update nodes
        this.svgSelection.selectAll(".node")
            .transition()
            .duration(500)
            .attr("transform", d => {
                return `translate(${this.scales.x(d.x)}, ${this.scales.y(d.y)})`;
            });
    }

    selectTips(treeSVG, tips) {
        const self = this;
        tips.forEach(tip => {
            const node = this.tipNodes[tip];
            const nodeShape1 = select(self.svg).select(`#${node.id}`).select(`.node-shape`);
            const nodeShape2 = select(treeSVG).select(`#${node.id}`).select(`.node-shape`);
            nodeShape1.attr("class", "node-shape selected");
            nodeShape2.attr("class", "node-shape selected");
            node.isSelected = true;

        })
        self.update();
    }

    /**
     * Registers some text to appear in a popup box when the mouse hovers over the selection.
     *
     * @param selection
     * @param text
     */
    addToolTip(selection, text) {
        this.svgSelection.selectAll(selection).on("mouseover",
            function (selectedNode) {
                let tooltip = document.getElementById("tooltip");
                if (typeof text === typeof "") {
                    tooltip.innerHTML = text;
                } else {
                    tooltip.innerHTML = text(selectedNode);
                }
                tooltip.style.display = "block";
                tooltip.style.left = event.pageX + 10 + "px";
                tooltip.style.top = event.pageY + 10 + "px";
            }
        );
        this.svgSelection.selectAll(selection).on("mouseout", function () {
            let tooltip = document.getElementById("tooltip");
            tooltip.style.display = "none";
        });
    }

    linkWithTree(treeSVG) {
        const self = this;

        const mouseover = function(d) {
            select(self.svg).select(`#${d.node.id}`).select(`.node-shape`).attr("r", self.settings.hoverNodeRadius);
            select(treeSVG).select(`#${d.node.id}`).select(`.node-shape`).attr("r", self.settings.hoverNodeRadius);
        };
        const mouseout = function(d) {
            select(self.svg).select(`#${d.node.id}`).select(`.node-shape`).attr("r", self.settings.nodeRadius);
            select(treeSVG).select(`#${d.node.id}`).select(`.node-shape`).attr("r", self.settings.nodeRadius);
        };
        const clicked = function(d) {
            // toggle isSelected
            let tip = d;
            if (d.node) {
                tip = d.node;
            }
            tip.isSelected = !tip.isSelected;

            const node1 = select(self.svg).select(`#${tip.id}`).select(`.node-shape`);
            const node2 = select(treeSVG).select(`#${tip.id}`).select(`.node-shape`);

            if (tip.isSelected) {
                node1.attr("class", "node-shape selected");
                node2.attr("class", "node-shape selected");
            } else {
                node1.attr("class", "node-shape unselected");
                node2.attr("class", "node-shape unselected");
            }

            self.update();
        };

        const tips = select(this.svg).selectAll(`.external-node`).selectAll(`.node-shape`);
        tips.on("mouseover", mouseover);
        tips.on("mouseout", mouseout);
        tips.on("click", clicked);

        const points = select(treeSVG).selectAll(`.node-shape`);
        points.on("mouseover", mouseover);
        points.on("mouseout", mouseout);
        points.on("click", clicked);
    }

    /**
     * A utility function that will return a HTML string about the node and its
     * annotations. Can be used with the addLabels() method.
     *
     * @param node
     * @returns {string}
     */
    static nodeInfo(point) {
        const node = point.node;
        let text = `${node.name ? node.name : node.id }`;
        Object.entries(node.annotations).forEach(([key, value]) => {
            text += `<p>${key}: ${value}</p>`;
        });
        return text;
    }

}

/*
 * Private methods, called by the class using the <function>.call(this) function.
 */

function createElements(svg, margins) {
    // get the size of the svg we are drawing on
    const width = svg.getBoundingClientRect().width;
    const height = svg.getBoundingClientRect().height;

    select(svg).select("g").remove();

    // add a group which will containt the new tree
    select(svg).append("g");
    //.attr("transform", `translate(${margins.left},${margins.top})`);

    //to save on writing later
    this.svgSelection = select(svg).select("g");

    // least squares regression
    const regression = this.leastSquares(this.points);
    const x1 = regression.xIntercept;
    const y1 = 0.0;
    const x2 = max(this.points, d => d.x);
    const y2 = max([regression.y(x2), max(this.points, d => d.y)]);

    this.scales = {
        x: scaleLinear()
            .domain([x1, x2]).nice()
            .range([margins.left, width - margins.right]),
        y: scaleLinear()
            .domain([y1, y2]).nice()
            .range([height - margins.bottom, margins.top])
    };

    const xAxis = axisBottom(this.scales.x)
        .tickArguments(this.settings.xAxisTickArguments);
    const yAxis = axisLeft(this.scales.y)
        .tickArguments(this.settings.yAxisTickArguments);

    const xAxisWidth = width - margins.left - margins.right;
    const yAxisHeight = height - margins.bottom - margins.top;

    this.svgSelection.append("g")
        .attr("id", "x-axis")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height - margins.bottom + 5})`)
        .call(xAxis);

    this.svgSelection.append("g")
        .attr("id", "x-axis-label")
        .attr("class", "axis-label")
        .attr("transform", `translate(${margins.left}, ${height - margins.bottom})`)
        .append("text")
        .attr("transform", `translate(${xAxisWidth / 2}, 35)`)
        .attr("alignment-baseline", "hanging")
        .style("text-anchor", "middle")
        .text(this.settings.xAxisTitle);

    this.svgSelection.append("g")
        .attr("id", "y-axis")
        .attr("class", "axis")
        .attr("transform", `translate(${margins.left - 5},0)`)
        .call(yAxis);

    this.svgSelection.append("g")
        .attr("id", "y-axis-label")
        .attr("class", "axis-label")
        .attr("transform", `translate(${margins.left},${margins.top})`)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margins.left)
        .attr("x", 0 - (yAxisHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(this.settings.yAxisTitle);

    this.svgSelection.append("line")
        .attr("id", "regression")
        .attr("class", "trend-line")
        .attr("x1", this.scales.x(x1))
        .attr("y1", this.scales.y(y1))
        .attr("x2", this.scales.x(x1))
        .attr("y2", this.scales.y(y1));

    if (this.settings.backgroundBorder > 0) {
        this.svgSelection.append("g")
            .selectAll("circle")
            .data(this.points)
            .enter()
            .append("circle")
            .attr("class", (d) => ["node-background", (!d.children ? "external-node" : "internal-node")].join(" "))
            .attr("transform", `translate(${this.scales.x(x1)}, ${this.scales.y(y1)})`)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", this.settings.nodeRadius + this.settings.backgroundBorder);
    }

    this.svgSelection.append("g")
        .selectAll("circle")
        .data(this.points)
        .enter()
        .append("g")
        .attr("id", d => d.node.id )
        .attr("class", (d) => {
            let classes = ["node", "external-node", (d.node.isSelected ? "selected" : "unselected")];
            if (d.node.annotations) {
                classes = [
                    ...classes,
                    ...Object.entries(d.node.annotations)
                        .filter(([key]) => {
                            return this.tree.annotations[key].type === Type.DISCRETE ||
                                this.tree.annotations[key].type === Type.BOOLEAN ||
                                this.tree.annotations[key].type === Type.INTEGER;
                        } )
                        .map(([key, value]) => `${key}-${value}`)];
            }
            return classes.join(" ");
        })
        .attr("transform", `translate(${this.scales.x(x1)}, ${this.scales.y(y1)})`)
        // .attr("transform", d => {
        //     return `translate(${this.scales.x(d.x)}, ${this.scales.y(d.y)})`;
        // })
        .append("circle")
        .attr("class", "node-shape")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", this.settings.nodeRadius);

    this.svgSelection.append("text")
        .attr("id", "statistics-slope")
        .attr("transform", `translate(${margins.left + 20},${margins.top})`)
        .style("text-anchor", "left")
        .attr("alignment-baseline", "hanging")
        .attr("dy", "0")
        .text(`Slope: -`);
    this.svgSelection.append("text")
        .attr("id", "statistics-r2")
        .attr("transform", `translate(${margins.left + 20},${margins.top})`)
        .style("text-anchor", "left")
        .attr("alignment-baseline", "hanging")
        .attr("dy", "1.5em")
        .text(`R^2: -`);

    this.update();

    this.tree.treeUpdateCallback = () => this.update();
};

