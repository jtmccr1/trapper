import React, {useEffect,useState} from 'react';
import ObjectChart from "./ObjectChart";
import {ArcLayout, RectangularLayout, Tree} from 'figtree';
import { FigTree, CircleBauble } from 'figtree';
import {select} from 'd3-selection';
import {withFauxDOM} from "react-faux-dom";

function PhyloChart(props){
    // const [figtree,setFigtree] = useState(null);
    useEffect(()=>{

        const faux = props.connectFauxDOM('div', 'chart');

        const  svg = select(faux).append('svg')
        .attr('width', 900)//props.chartGeom.width )
        .attr('height', 200)//props.chartGeom.height )
        const tree = Tree.parseNewick("((A:2,B:3):1,C:5);")
        const layout = new RectangularLayout(tree);
        const margins = {"top":props.chartGeom.spaceTop,"bottom":50,"left":props.chartGeom.spaceLeft,"right":100};
        const fig = new FigTree(svg,layout,margins,        { hoverBorder: 2, backgroundBorder: 2,
            baubles: [
                new CircleBauble(),
            ],
            width :props.chartGeom.width,
            height :props.chartGeom.height
        });
        fig.draw();
        // fig.hilightBranches();
        select(svg).select(".axes-layer").remove();

        const selected = select(svg).selectAll(".branch").select(".branch-path");
        selected.on("mouseover", function (d, i) {
            select(this).classed("hovered", true);
            console.log(this);
            console.log(this.props)
            props.animateFauxDOM(2000)
        });
        selected.on("mouseout", function (d, i) {
            select(this).classed("hovered", false);
            console.log("left")
        });
    },[]);
    // useEffect(()=>{
    //     if(figtree!==null){
    //     figtree.update();
    //     }
        
    // });
    return(null);
};

// PhyloChart.defaultProps = {
//     chart: 'loading'
//   }
const FauxPhyloChart = withFauxDOM(PhyloChart);

export default FauxPhyloChart; 