import * as d3 from 'd3v4';

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

