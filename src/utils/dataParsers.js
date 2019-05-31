import * as d3 from 'd3';
import {nest} from "d3-collection";

const  parseDate = d3.timeParse("%Y-%m-%d")


export const  parseCaseData=(d)=>{
    const standardColumns =["Id","Date of sampling"]
    const entry = {
        id:d['Id'],
        dateOfSampling:parseDate(d['Date of sampling']),
        metaData:{},
    }
        Object.keys(d).forEach(name=>{
            if(standardColumns.indexOf(name)===-1){
                if(name.toLowerCase().indexOf("date")>-1){
                    entry.metaData[name]=parseDate(d[name]);
                }else{
                   entry.metaData[name]=d[name];
                }
            }
    });
    return entry;
}

export const parseEdgeData=(d)=>{
    const standardColumns =["Source","Target"]
    const entry = {
        source:d['Source'],
        target:d['Target'],
        metaData:{},
    }

        Object.keys(d).forEach(name=>{
            if(standardColumns.indexOf(name)===-1){
                entry.metaData[name]=d[name];
            }
    });
    return entry;
}
export const readData =(fileName,formatter,callback)=>{
        d3.csv(fileName,(data)=>{
                const parsedData = data.map(d=>formatter(d));
                callback(parsedData);

      });
}
/**
 * This function takes an array of Link objects in source,target,dataSource
 * and returns a link for each source, target pair with a metadata entry for the dataSource and
 * the proportion of links of the that data source and target that have the given source.
 * @param {array of Links} links 
 */
export const summarizeLinks=(links)=>{
    const nestLinks = nest()
    .key(d=>d.target)
    .key(d=>d.source)
    .key(d=>d.dataSource)
    .entries(links)

    const dataSources= [];
    links.forEach(l => {
        dataSources.indexOf(l.dataSource)===-1 && dataSources.push(l.dataSource);
    });

    const summarizeLinks =[];
    for(const l of nestLinks){
        const target = l.key;
        const totalObservations ={};
        for(const ds of dataSources){
            totalObservations[ds] = l.values.map(s=>s.values.filter(d=>d.key===ds)) // array of array of {key:soures, value:data} with an entry for each source
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
                summarizeLinks.push({"target":target,"source":source,"metaData":metaData})
            }

        }
        return(summarizeLinks);
}

