import {scaleLinear} from 'd3-scale';

/**
 * The Layout class
 *
 */
export class d3PlotLayout {
    /**
     * The constructor.
     */
    constructor( ) {
        // default ranges - these should be set in layout()
        this._horizontalRange = [0.0, 1.0];
        this._verticalRange = [0, 1.0];
        this._Xticks=scaleLinear().domain(this._horizontalRange).ticks();
        this._Yticks=scaleLinear().domain(this.verticalRange).ticks();

        // create an empty callback function
        this.updateCallback = () => { };
    }

    /**
     * An abstract base class for a layout class. The aim is to describe the API of the class.
     *
     * @param vertices - objects with an x, y coordinates and a reference to the original node
     * @param edges - objects with v1 (a vertex) and v0 (the parent vertex).
     */
    layout(vertices, edges) { }

    get horizontalRange() {
        return this._horizontalRange;
    }

    get verticalRange() {
        return this._verticalRange;
    }

    /**
     * Updates the tree when it has changed
     */
    update() {
        this.updateCallback();
    }
}