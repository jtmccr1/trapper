import {scaleLinear} from 'd3-scale';
import {Type} from '../figtree.js/index.js';
import { nextTick } from 'q';
/**
 * The Layout class
 *
 */
export class d3PlotLayout {
    static DEFAULT_SETTINGS() {
        return {
            horizontalRange:null,
            horizontalTicks:null,
            horizontalScale:scaleLinear,
        }
    }
    /**
     * The constructor.
     */
    constructor(data,settings={} ) {
        this.data = data;
        this.settings = {...d3PlotLayout.DEFAULT_SETTINGS(),...settings}
        // default ranges - these should be set in layout()
        this._horizontalRange = [0.0, 1.0];
        this._verticalRange = [0, 1.0];
        this._horizontalTicks= this.settings.horizontalScale()
        .domain(this._horizontalRange).ticks(5)
        // create an empty callback function
        this.updateCallback = () => { };
        this.annotations = {};

    }

    /**
     * An abstract base class for a layout class. The aim is to describe the API of the class.
     *
     * @param ...params  objects that will be udated with positions. Could be empty
     */
    layout(params) { }

    get horizontalRange() {
        return this._horizontalRange;
    }

    get verticalRange() {
        return this._verticalRange;
    }
    get horizontalAxisTicks(){
        return this._horizontalTicks;
    }

    /**
     * Updates the tree when it has changed
     */
    update() {
        this.updateCallback();
    }

    /**
     * Adds the given annotations to a particular node object.
     *
     * The annotations is an object with properties keyed by external node labels each
     * of which is an object with key value pairs for the annotations. The
     * key value pairs will be added to a property called 'annotations' in the node.
     *
     * Boolean or Numerical traits are given as a single value.
     * Sets of values with probabilities should be given as an object.
     * Discrete values should be given as an array (even if containing only one value)
     * or an object with booleans to give the full set of possible trait values.
     *
     * For example:
     *
     * {
     *     'tip_1': {
     *         'trait_1' : true,
     *         'trait_4' : 3.141592,
     *         'trait_2' : [1, 2], // discrete trait
     *         'trait_3' : ["London", "Paris", "New York"], // discrete trait
     *         'trait_3' : {"London" : true, "Paris" : false, "New York": false], // discrete trait with full set of values
     *         'trait_4' : {"London" : 0.75, "Paris" : 0.20, "New York": 0.05} // probability set
     *     },
     *     'tip_2': {...}
     * }
     *
     * The annotation labels, type and possible values are also added to the tree in a property called 'annotations'.
     *
     * A reconstruction method such as annotateNodesFromTips can then be used to provide reconstructed values
     * for internal nodes. Or annotateNodes can provide annotations for any node in the tree.
     *
     * @param data
     * @param annotations a dictionary of annotations keyed by the annotation name.
     */
    // annotateData(data) {
    //     if(data.annotations){
    //         console.log(data.annotations)
    //     this.addAnnotations(data.annotations);
    //     }else{
    //         this.addAnnotations(data);
    //     }
    //     //Get data Entries in annotations
    //     const annotatedEntries = Object.keys(data).filter(k=>Object.keys(this.annotations).indexOf(k)>-1);

    //     // // add the annotations to the existing annotations object for the node object
    //     data.annotations = {...(data.annotations === undefined ? {} : data.annotations), ...dataAnnotations};
    // }

    /**
    * This methods also checks the values are correct and conform to previous annotations
    * in type.
    *
    * @param annotations
    */
   addAnnotations(datum) {
       for (let [key, addValues] of Object.entries(datum)) {
           if(addValues instanceof Date||  typeof addValues === 'symbol'){
               continue; // don't handel dates yet
           }
            let annotation = this.annotations[key];
           if (!annotation) {
               annotation = {};
               this.annotations[key] = annotation;
           }

           if(typeof addValues === 'string' || addValues instanceof String){
               // fake it as an array
               addValues = [addValues];
           }
           if (Array.isArray(addValues)) {
               // is a set of discrete values or 
               const type = Type.DISCRETE;

               if (annotation.type && annotation.type !== type) {
                   throw Error(`existing values of the annotation, ${key}, in the tree is not of the same type`);
               }
               annotation.type = type;
               annotation.values = annotation.values? [...annotation.values, ...addValues]:[...addValues]
           } else if (Object.isExtensible(addValues)) {
               // is a set of properties with values               
               let type = null;

               let sum = 0.0;
               let keys = [];
               for (let [key, value] of Object.entries(addValues)) {
                   if (keys.includes(key)) {
                       throw Error(`the states of annotation, ${key}, should be unique`);
                   }
                   if (typeof value === typeof 1.0) {
                       // This is a vector of probabilities of different states
                       type = (type === undefined) ? Type.PROBABILITIES : type;

                       if (type === Type.DISCRETE) {
                           throw Error(`the values of annotation, ${key}, should be all boolean or all floats`);
                       }

                       sum += value;
                       if (sum > 1.0) {
                           throw Error(`the values of annotation, ${key}, should be probabilities of states and add to 1.0`);
                       }
                   } else if (typeof value === typeof true) {
                       type = (type === undefined) ? Type.DISCRETE : type;

                       if (type === Type.PROBABILITIES) {
                           throw Error(`the values of annotation, ${key}, should be all boolean or all floats`);
                       }
                   } else {
                       throw Error(`the values of annotation, ${key}, should be all boolean or all floats`);
                   }
                   keys.append(key);
               }

               if (annotation.type && annotation.type !== type) {
                   throw Error(`existing values of the annotation, ${key}, in the tree is not of the same type`);
               }

               annotation.type = type;
               annotation.values = annotation.values? [...annotation.values, ...addValues]:[...addValues]
           } else {
               let type = Type.DISCRETE;

               if (typeof addValues === typeof true) {
                   type = Type.BOOLEAN;
               } else if (Number(addValues)) {
                   type = (addValues % 1 === 0 ? Type.INTEGER : Type.FLOAT);
               }

               if (annotation.type && annotation.type !== type) {
                   if ((type === Type.INTEGER && annotation.type === Type.FLOAT) ||
                       (type === Type.FLOAT && annotation.type === Type.INTEGER)) {
                       // upgrade to float
                       type = Type.FLOAT;
                   } else {
                       throw Error(`existing values of the annotation, ${key}, in the tree is not of the same type`);
                   }
               }

               if (type === Type.DISCRETE) {
                   if (!annotation.values) {
                       annotation.values = new Set();
                   }
                    annotation.values.add(addValues);
                
               }

               annotation.type = type;
           }

           // overwrite the existing annotation property
           this.annotations[key] = annotation;
       }
   }
}