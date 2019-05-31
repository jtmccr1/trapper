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
      const rows =props.data.length;
       
        return (<ReactTable
          showPagination={false}
          defaultPageSize={rows}
          data={props.data}
          filterable
          columns={columns}
        />)
}

export default LineList;