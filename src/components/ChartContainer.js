import React, {useState,useCallback,useEffect} from 'react';
import {csv} from "d3-fetch";
import Case from "../lib/outbreak/Case";
import Link from "../lib/outbreak/Link";
import {dateParse} from "../utils/commonFunctions"
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




function ChartContainer(props){
  
    const prefix = process.env.NODE_ENV === 'development' ? 'http://localhost:4001' : 'https://raw.githubusercontent.com/jtmccr1/trapper/master/src';
    
    //------------ Data processing ------------------------

    // hardcoding in data processing - magic number

      const [ogLineList,setOgLineList]=useState(null);
      const [ogLinks,setOgLinks] = useState(null)
      const [scales,setScales]=useState(null);
      const [chartGeom,setChartGeom]=useState(null);
      const [domRect,setDomRect]=useState(null);
      const [outbreakGraph,setOutbreakGraph] = useState(null);
      const [phylogeny,setPhylogeny] = useState(null);
      const [phyloAttributes,setPhyloAttributes]=useState(null);
      const [dateRange,setDateRange] = useState(null)
      const [epidemic,setEpidemic] = useState(null);
      const [treeDateRange,setTreeDateRange] = useState(null);
      const margins = {"top":10,"bottom":10,"left":50,"right":50};

    //Get lineList
    useEffect(()=>{
        csv(`${prefix}/examples/simulated/lineList.csv`,
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
        Promise.all([csv(`${prefix}/examples/simulated/transphyloLinks.csv`,
                        d=>{
                            const dataPoint = {
                                  target:d.target,
                                  source:d.source,
                                  dataSource:d.dataSource
                                }
                            return new Link(dataPoint);
                              }),
                              csv(`${prefix}/examples/simulated/epiContacts.csv`,
                              d=>{
                                  const dataPoint = {
                                        target:d.target,
                                        source:d.source,
                                        dataSource:d.dataSource
                                      }
                                  return new Link(dataPoint);
                                    })
                                  ]).then(([data1,data2])=>setOgLinks([...data1,...data2]));
                        },[]);

      useEffect(()=>{
        fetch(`${prefix}/examples/simulated/simulated.trees`)
        .then(response=>response.text()
                .then(text=>{
                  setPhylogeny(Tree.parseNewick(text));
                }));
        fetch(`${prefix}/examples/simulated/simulated.json`)
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
        if(domRect!==null){
        const parentBaseDim={"height":max([domRect.height*0.25,50]),"width":max([domRect.width*0.9,50])};
        setChartGeom(parentBaseDim)
        }
    },[domRect]);

    // Set the epidemic data

    useEffect(()=>{
      if(outbreakGraph!==null){
        const indexCase = outbreakGraph.nodes.find(n=>outbreakGraph.getOutgoingEdges(n).length>0&&outbreakGraph.getIncomingEdges(n).length===0);
        indexCase.location = "Location A";
        indexCase.symptomOnset=null;

        const outbreakEpidemic = new Epidemic(indexCase,outbreakGraph,mostProbableTransphyloEdgeCondition);
        setEpidemic(outbreakEpidemic);
      }
    },[outbreakGraph]);

    // Set the date scale

    useEffect(()=>{
      if(phylogeny!==null&&outbreakGraph!==null){
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
      }
    },[ogLineList,outbreakGraph])

    //Getting the size of the container to pass to children
    const measuredRef = useCallback(node => {
        if (node !== null) {
            setDomRect({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width})
            const handleResize = () =>  {
                setDomRect({"height":node.getBoundingClientRect().height,"width":node.getBoundingClientRect().width});
            }
            window.addEventListener('resize', handleResize);
            return () => {
              window.removeEventListener('resize', handleResize);
            };
        }
      },[]);

      //Ensure we don't render before we have scales ect.
      const isFull = Object.values([ogLineList,ogLinks,scales,chartGeom,outbreakGraph,phylogeny,phyloAttributes,dateRange,epidemic,treeDateRange])
      .every(x => (x !== null & x !== ''));
      if(!isFull){
        return(
          <div className = "timelineContainer" ref={measuredRef}>
          </div>
          )
      }else{
      return(
        <div className ="fillHorizontalSpace" background={"none"}>
        <div className = "axisContainer">
          <div className ="mockChartContainer">
        <TimeAxis dateRange = {dateRange} 
        margins = {margins}
          chartGeom = {chartGeom} 
          domRect = {domRect}/>
        </div>
        </div>

       <div className = "timelineContainer" ref={measuredRef} >
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
          layout = {TransmissionLayout}
          attributes = {phyloAttributes}
          scales = {scales} 
          chartGeom={chartGeom}/>
      </div>  
</div>
</div>
)}
    // <Chart  />
}

export default  ChartContainer;
