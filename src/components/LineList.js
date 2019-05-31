import React, {useState,useCallback,useRef} from 'react';
import ReactTable from 'react-table';
import {timeFormat} from "d3"
const formatTime = timeFormat("%B %d, %Y");

function LineList(props){


       
        const columns = [{
          id:"id",
          Header: 'Case Id',
          accessor: d=>d.id 
        },{
          id:"location",
          Header:'Location',
          accessor: d=>d.location
      },{
        id:"symptomOnset",
        Header:'Symptom Onset',
        accessor: d=>formatTime(d.symptomOnset)
      }]
       
        return (<ReactTable
          data={props.data}
          columns={columns}
        />)
}

export default LineList;