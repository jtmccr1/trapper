import React, { Component } from 'react';
import "../styles/temporary.css"
export const CheckBox=(props)=>{
return(
<div>
    <span style={{ paddingRight: '10px' }}> {props.title} :</span>
					<label className="switch">
						<input type="checkbox" readOnly onClick={props.callback} checked={props.status} />
						<span className="slider round" />
					</label>
</div>
)
}
