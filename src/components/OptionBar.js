import React, { Component } from 'react';
import { slide as Menu } from 'react-burger-menu'
import{CheckBox} from "./CheckBox"
import "../styles/menu.css"
import {onlyUnique} from '../utils/commonFunctions';
 
export const OptionBar=(props)=>  {
console.log(props.edges)
    const nodeOptions=props.nodeOptions.map((d,i)=>{
     return (<CheckBox key={i.toString()} title={d}/>);
    })
    const edgeOptions = props.transmissionOptions.map((d,i)=>{
      return (<CheckBox key={i.toString()} title={d}/>);
     })
    return (
      <Menu left>
      <h4>Data sources</h4>
      <h5>Cases:</h5>
      {nodeOptions}
      <h5>Transmission events</h5>
      {edgeOptions}
      <h4>Color options</h4>
      <CheckBox/>
      <h4>Tree layout</h4>
      <CheckBox/>
      </Menu>
    );
}
