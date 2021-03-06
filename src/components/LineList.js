import React, {useState,useCallback,useRef} from 'react';
import ReactTable from 'react-table';
import {timeFormat} from "d3"
const formatTime = timeFormat("%B %d, %Y");

function LineList(props){


       
        const columns = [{
          id:"id",
          Header: 'Case Id',
          accessor: d=>d.id ,
        },{
          id:"location",
          Header:'Location',
          accessor: d=>d.location
      },{
        id:"symptomOnset",
        Header:'Symptom Onset',
        accessor: d=>d.symptomOnset,
        Cell:props => props.value===null? <span>Unknown</span>:<span>{formatTime(props.value)}</span>,
        filterable: false  //This makes the column not filterable

      }]

      const potentialSourcesColumns = [{
        id:"source",
        Header: 'Source',
        accessor: d=>d.source.id 
      },
      {
        id:"dataSource",
        Header: 'Data Source',
        accessor: d=>d.metaData.dataSource
      },
      {
        id:"support",
        Header: 'Support',
        accessor: d=>d.metaData.support
      }]

      const potentialTransmissionsColumns = [{
        id:"target",
        Header: 'Target',
        accessor: d=>d.target.id 
      },
      {
        id:"dataSource",
        Header: 'Data Source',
        accessor: d=>d.metaData.dataSource
      },
      {
        id:"support",
        Header: 'Support',
        accessor: d=>d.metaData.support
      }]


      const subtableHeader = {
        display:'inline-block',
        marginRight:'10px',
        marginLeft:'10px'


      }



      const rows =props.epidemic.Cases.length;
       const selectedData = props.selectedCases.length>0?props.epidemic.Cases.filter(n=>props.selectedCases.map(s=>s.id).indexOf(n.id)>-1):props.epidemic.Cases;
        return (
        <ReactTable
          showPagination={false}
          defaultPageSize={rows}
          data={selectedData}
          columns={columns}
          filterable
          className="-striped -highlight" // add styles
          SubComponent={row => {
            const inlinks = props.epidemic.graph.getIncomingEdges(row.original)
            const outlinks = props.epidemic.graph.getOutgoingEdges(row.original)

            return(
            <div>
              <div style={subtableHeader}className={"legendSquare source"}></div>
              <div style={subtableHeader}><h4> Putative sources of infection </h4> </div>
              <ReactTable
            showPagination={false}
            defaultPageSize={inlinks.length}
            data={inlinks}
            // filterable
            className="-striped -highlight" // add styles
            columns={potentialSourcesColumns}/>
              <div style={subtableHeader}className={"legendSquare  transmission"}></div>
              <div style={subtableHeader}><h4> Putative Transmissions </h4> </div>            <ReactTable
            showPagination={false}
            defaultPageSize={outlinks.length}
            data={outlinks}
            // filterable
            className="-striped -highlight" // add styles
            columns={potentialTransmissionsColumns}/>
            </div>)
          }}

        />)
}

export default LineList;