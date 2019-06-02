import {max,min} from "d3-array";
import {nest} from "d3-collection";
import {timeWeek} from "d3-time"
import {scaleLinear} from 'd3-scale';
import {transition} from "d3-transition"
import {Type} from "../figtree.js/index.js";
import {d3PlotLayout} from "./d3PlotLayout";

/**
 * StackedHistogram layout
 * settings
 */
export class stackedHistogramLayout extends d3PlotLayout{
    static DEFAULT_SETTINGS() {
        return {
            groupingFunction:d=>1,
            binnedFunction:d=>timeWeek.floor(d.symptomOnset),
            keyToXFunction:{x0:d=>timeWeek(new Date(d.key)),x1: d=>timeWeek.offset(new Date(d.key),1)},
            horizontalRange:null,
            horizontalTicks:null,
            horizontalScale:scaleLinear,
            annotations:null
        }
    }

    /**
     * The constuctor
     * @param {*} data which will be binned and  grouped
     * @param {*} settings functions that will bin and group (color) the data
     *                    groupingFunction:d=>1 - given the data assign it a group for coloring
     *                    binnedFunction:d=>timeWeek.floor(d.symptomOnset), - given the data point return category for binning will be used as key in d3.nest
     keyToXFunction:{x0:d=>timeWeek(new Date(d.key)), -given the key (from above) convert to x0 and x1 on axis.
                                          x1: timeWeek.offset(new Date(d.key),1)
     */
    constructor(data,settings = { }){
        super();
        this.settings = {...stackedHistogramLayout.DEFAULT_SETTINGS(), ...settings};
        this.data = data;
        // default ranges - these should be set in layout()
        this._horizontalRange = [0.0, 1.0];
        this._verticalRange = [1.0, 0];
        this._horizontalTicks= this.settings.horizontalScale()
            .domain(this._horizontalRange).ticks(5)
    }

    /**
     * Layout the data. Given a bins array population the arrary with one entry per datapoint with x0,x1 positions and y0,y1
     * This will stack the data from each bin ordered by group.
     * @param {*} bins
     */
    layout(bins){
        const dateBins = nest().key(d=>timeWeek.floor(d.symptomOnset))
            .entries(this.data)
            .map(d=>({"x0":timeWeek(new Date(d.key)),"x1":timeWeek.offset(new Date(d.key),1),"values":d.values}));

        //get the keys used to group the data within each bin

        const groupKeys= this.data.map(d=>this.settings.groupingFunction(d)).reduce((acc,curr) =>{
            if(acc.indexOf(curr)===-1){
                acc.push(curr)
            };
            return(acc)},[]);

        let currentCount=0;
        let maxCount=0;
        for(const time of dateBins){
            currentCount=0;
            for(const k of groupKeys){
                const kEntry = time.values.filter(w=>this.settings.groupingFunction(w)===k);
                const entry = {"x0":time.x0,"x1":time.x1,"colorKey":k}; // key is used for color
                if(kEntry.length>0){
                    for(const data of kEntry){
                        const caseEntry = {...entry,...{"data":data}};
                        // If there is annotations in the data add them here as classes
                        // this.annotateData(data)
                        this.addAnnotations(data)
                        caseEntry.y0=currentCount;
                        caseEntry.y1=currentCount+1;
                        currentCount+=1;
                        bins.push(caseEntry);
                    }
                }
            }
            maxCount=max([maxCount,currentCount])
        }
        if(!this.settings.horizontalRange){
            this._horizontalRange = [min(dateBins,d=>d.x0),max(dateBins,d=>d.x1)];
        }else{
            this._horizontalRange=this.settings.horizontalRange;
        }

        if(!this.settings.horizontalTicks){
            this._horizontalTicks= this.settings.horizontalScale()
                .domain(this._horizontalRange).ticks(5)
        }else{
            this._horizontalTicks=this.settings.horizontalTicks;
        }
        this._verticalRange = [0,maxCount];

    }

    update() {
        this.updateCallback();
    }

    get horizontalRange() {
        return this._horizontalRange;
    }

    get verticalRange() {
        return this._verticalRange;
    }

    get horizontalAxisTicks(){
        return this._horizontalTicks;
    }
}

