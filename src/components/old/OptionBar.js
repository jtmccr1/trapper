import React from 'react';
import { push as Menu } from 'react-burger-menu'
import{CheckBox} from "./CheckBox"
import "../styles/menu.css"
 
export const OptionBar=(props)=>  {
    const nodeOptions=props.nodeOptions.map((d,i)=>{
      const callback=props.nodeDataCallback(i);
     return (<CheckBox key={i.toString()} title={d} status={props.nodeStatus[i]} callback={callback}/>);
    })
    const edgeOptions = props.edgeOptions.map((d,i)=>{
      const callback=props.edgeDataCallback(i);

      return (<CheckBox key={i.toString()} title={d} status={props.edgeStatus[i]} callback={callback}/>);
     })
    return (
      <Menu left noOverlay push pageWrapId={ "page-wrap" } outerContainerId={ "outer-container" } >
      <h4>Data sources</h4>
      <h5>Cases:</h5>
      {nodeOptions}
      <h5>Transmission events</h5>
      {edgeOptions}
      <h4>Color options</h4>
      <h5>TODO</h5>
      <h4>Tree</h4>
      <CheckBox title={"Transmission Layout"} status={props.transmissionLayout} callback={props.transmissionCallBack}/>
      </Menu>
    );
}
