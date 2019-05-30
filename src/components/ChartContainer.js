import React, {useState,useCallback,useEffect} from 'react';
import {csv} from "d3-fetch";
import Case from "../lib/outbreak/Case";
import Link from "../lib/outbreak/Link";
import {dateParse,mode} from "../utils/commonFunctions"
import {scaleTime,scaleLinear} from 'd3-scale';
import {timeWeek,timeDay} from "d3-time";
import {max,min,extent} from "d3-array";
import {nest} from "d3-collection";
import {axisTop,axisBottom} from "d3-axis"
import { Graph, RectangularLayout, TransmissionLayout } from 'figtree';
import StackedHistogram from './StackedHistogram';
// import ArcTransmission from "./ArcTransmission";
import PhyloChart from './PhyloChart';
import AreaPlot from './AreaPlot';
import {Tree} from "figtree";
import ArcTransmission from './ArcTransmission';
import {Epidemic} from "../lib/outbreak/Epidemic";
import TimeAxis from './TimeAxis';



function mostProbableTransphyloEdgeCondition(graph){
  const actualFilterFunction = (edge)=>{
    const target = edge.target;
    // get incoming edges
    const incomingEdges = graph.getIncomingEdges(target);
    const maxTransphyloProb = max(incomingEdges, e =>e.metaData.transphylo.support);
    return (edge === incomingEdges.find(e=> e.metaData.transphylo.support===maxTransphyloProb))
  }
  return actualFilterFunction
}




const ChartContainer = React.forwardRef((props, ref)=>{
  
    const prefix = process.env.NODE_ENV === 'development' ? 'http://localhost:4001' : 'https://raw.githubusercontent.com/jtmccr1/trapper/master/src';
    
    //------------ Data processing ------------------------

    // hardcoding in data processing - magic number

      const [ogLineList,setOgLineList]=useState(null);
      const [ogLinks,setOgLinks] = useState(null)
      const [scales,setScales]=useState(null);
      const [chartGeom,setChartGeom]=useState({height:300,width:1200});
      const [outbreakGraph,setOutbreakGraph] = useState(null);
      const [phylogeny,setPhylogeny] = useState(null);
      const [phyloAttributes,setPhyloAttributes]=useState(null);
      const [dateRange,setDateRange] = useState(null)
      const [epidemic,setEpidemic] = useState(null);
      const [treeDateRange,setTreeDateRange] = useState(null);
      const margins = {"top":10,"bottom":10,"left":50,"right":50};

    //Get lineList
    useEffect(()=>{
        csv(`${prefix}/lineList.csv`,
        d=>{
            const dataPoint = {
                   id:d.id,
                   symptomOnset:dateParse(d.symptomOnset),
                   sampleDate:[dateParse(d.sampleDate)],
                   location:d.Location,
                   resolution:d.Outcome,
                }
            return new Case(dataPoint);
          }).then(data=>{
            setOgLineList(data)
          });
    },[]);// [] only run on first render otherwise we get an infinite loop.
       //Get links TODO get all links
       useEffect(()=>{
        csv(`${prefix}/links.csv`,
                        d=>new Link(d)).then((data1)=>setOgLinks(data1));
                        },[]);

      useEffect(()=>{
        fetch(`${prefix}/tree.nwk`)
        .then(response=>response.text()
                .then(text=>{
                  setPhylogeny(Tree.parseNewick(text));
                }));
        fetch(`${prefix}/treeAnnotations.json`)
                .then(response=>response.json()
                        .then(json=>{
                          setPhyloAttributes(json)
                        })); 
      },[])


    //Summarize links for each target for each type get % of incoming links with this source
    // [graph,setGraph] = useState(null)
    
    useEffect(()=>{
      if(ogLinks!=null){
            // link is an object keyed by target each 
            // the output should be 
            // {target, source, dataSource:, metadata:{source1:{ support: %
            //   links:[links]}[links] source2:linkes}}
            const nestLinks = nest()
            .key(d=>d.target)
            .key(d=>d.source)
            .key(d=>d.dataSource)
            .entries(ogLinks)

            const dataSources= [];
            ogLinks.forEach(l => {
              dataSources.indexOf(l.dataSource)===-1 && dataSources.push(l.dataSource);
            });

            const links =[];
            for(const l of nestLinks){
              const target = l.key;
              const totalObservations ={};
              for(const ds of dataSources){
                totalObservations[ds] = l.values.map(s=>s.values.filter(d=>d.key==ds)) // array of array of {key:soures, value:data} with an entry for each source
                                    .reduce((acc,curr)=>{  // flatten array above
                                      return acc.concat(curr)
                                    },[])
                                    .reduce((acc,curr)=>acc+curr.values.length,0); // sum number of data points 
                                            // .reduce((acc,curr)=>acc+curr.values.length,0)));
              }
                for(const s of l.values){
                  const source = s.key;
                  const metaData=dataSources.reduce((acc,curr)=>{
                          acc[curr]={support:null,data:[]};
                          return(acc)
                        },{})
                  for(const ds of s.values){
                    metaData[ds.key].data=ds.values;
                    metaData[ds.key].support=totalObservations[ds.key]!==0? ds.values.length/totalObservations[ds.key]: null;
                  }
                  links.push({"target":target,"source":source,"metaData":metaData})
                }
        
              }
              // Add any sources that aren't included 
              const sources =  links.map(l=>l.source).reduce((acc,curr)=>{
                                                      if(acc.indexOf(curr)===-1){
                                                        return(acc.concat(curr));
                                                      }
                                                      return(acc);
                                                    },[]);
              const cases = [...ogLineList];
              for(const source of sources){
                if(cases.filter(d=>d.id===source).length===0){
                  const newCase = new Case({"id":source});
                  cases.push(newCase);
                }
              }
              
              setOutbreakGraph(new Graph(cases,links));
            }
    },[ogLinks,ogLineList]);



    //update scale 
    useEffect(()=>{
        // epi start and stop week;
        if(ogLineList!==null&&chartGeom!==null){
        const startWeek= timeWeek(min(ogLineList,d=>timeWeek(d.getSymptomOnset())));
        const endWeek = timeWeek(max(ogLineList,d=>timeWeek(d.getSymptomOnset())));
        const scales={
            x:scaleTime().domain([timeWeek.offset(startWeek,-1),timeWeek.offset(endWeek,2)]).range([chartGeom.spaceLeft,(chartGeom.width-chartGeom.spaceRight)]),
            y:scaleLinear().domain([0,1]).range([(chartGeom.height - chartGeom.spaceBottom), chartGeom.spaceTop]),
        }
        // scales.x.ticks(timeWeek.range(scales.x.domain()[0],scales.x.domain()[1]));
        scales.weeks=timeWeek.range(scales.x.domain()[0],timeWeek.offset(scales.x.domain()[1],1))
        setScales(scales);
    };
    },[ogLineList,chartGeom]);

    //Update chart sizes
    useEffect(()=>{
        if(props.timelineSize!==null){
        const parentBaseDim={"height":300,"width":props.timelineSize.width*0.9};
        setChartGeom(parentBaseDim)
        }
    },[props.timelineSize]);

    // Set the epidemic data

    useEffect(()=>{
      if(outbreakGraph!==null){
        const indexCase = outbreakGraph.nodes.find(n=>outbreakGraph.getOutgoingEdges(n).length>0&&outbreakGraph.getIncomingEdges(n).length===0);
        if(indexCase.location==="Unknown"){
          // Sets index location to most common location of children
          indexCase.symptomOnset=null;
          const childLocations = outbreakGraph.getOutgoingEdges(indexCase)
          .filter(e=>mostProbableTransphyloEdgeCondition(outbreakGraph)(e))
          .map(e=>e.target.location)
          indexCase.location = mode(childLocations);
        }

        const outbreakEpidemic = new Epidemic(indexCase,outbreakGraph,mostProbableTransphyloEdgeCondition);
        setEpidemic(outbreakEpidemic);
      }
    },[outbreakGraph]);

    // Set the date scale

    useEffect(()=>{
      if(phylogeny!==null&&outbreakGraph!==null, phyloAttributes!==null){
        //get date range of case
        const casesRange = extent(outbreakGraph.nodes,d=>d.symptomOnset);
        const treeMaxTipLength = max(phylogeny.nodes,n=>phylogeny.rootToTipLength(n));
        const treeMaxTip = phylogeny.nodes.find(n=>phylogeny.rootToTipLength(n)===treeMaxTipLength);
        const treeMaxDate = max(outbreakGraph.getNode(treeMaxTip.name).sampleDate); // names must match case id's in line list; sampleDate is an array.
        const treeRootDate = timeDay.offset(treeMaxDate,(-1*treeMaxTipLength*365)); // not exact
        const totalExtent = extent([treeRootDate,...casesRange]);
        const week0 = timeWeek.offset(timeWeek.floor(totalExtent[0]),-1);
        // add anextra one for the range function [,)
        const weekEnd = timeWeek.offset(timeWeek.ceil(totalExtent[1]),2);
        setDateRange(timeWeek.range(week0,weekEnd));
        setTreeDateRange([treeRootDate,treeMaxDate]);

        // 
      }
    },[ogLineList,outbreakGraph,phylogeny,phyloAttributes])


      //Ensure we don't render before we have scales ect.
      const isFull = Object.values([ogLineList,ogLinks,scales,chartGeom,outbreakGraph,phylogeny,phyloAttributes,dateRange,epidemic,treeDateRange,props.timelineSize])
      .every(x => (x !== null & x !== ''));

      if(!isFull){
        return(
          <div className = "timelineContainer" ref={ref}>
          </div>
          )
      }else{
      return(
       <div className = "timelineContainer" ref={ref} >
       <div className = "mockChartContainer">
      <TimeAxis dateRange ={dateRange} 
        margins = {margins}
          chartGeom = {chartGeom} 
          domRect = {props.timelineSize}/>
        </div>  
        <div className = "chartContainer">
          <StackedHistogram  data={ogLineList} 
          margins = {margins}
            scales = {scales} 
            chartGeom={chartGeom}
            dateRange ={dateRange}
            callbacks={{groups:d=>d.location}}/>
          </div>  
          <div className = "chartContainer">
          <AreaPlot  
          margins = {margins}
          epidemic={epidemic} 
          dateRange ={dateRange}
          scales={scales}
          chartGeom={chartGeom}/>
        </div>  
          <div className = "chartContainer">
          <ArcTransmission  
          margins = {margins}
          treeDateRange={treeDateRange}
          phylogeny={phylogeny} 
          treeDateRange={treeDateRange}
          graph={outbreakGraph} 
          dateRange ={dateRange}
          scales = {scales} 
          curve ={"bezier"}
          chartGeom={chartGeom}/>
        </div>  
      <div className = "chartContainer">
          <PhyloChart  
          margins = {margins}
          dateRange ={dateRange}
          treeDateRange={treeDateRange}
          phylogeny={phylogeny} 
          layout = {RectangularLayout}
          attributes = {phyloAttributes}
          scales = {scales} 
          chartGeom={{...chartGeom,...{"height":600}}}/>
    </div>  
    </div>
)}
    // <Chart  />
});

export default  ChartContainer;
