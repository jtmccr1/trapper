import React from 'react';
import logo from '../images/logo.png';
function Header() {
		return (
			<div className="header">
				<div className="logo">
					<a href="http://artic.network" target="_blank" rel="noopener noreferrer">
						<img src={logo} alt={'logo'} width="132" />
					</a>
				</div>
				<div className="title">
					<h2 style={{marginTop: "0px", marginBottom: "8px"}}>
				  		<span style={{fontSize: "1.8em"}}>TRAPPER</span>
						<span> Transmission Reconstuction And Phylogenetics Promoting Early Response</span>
					</h2>
				</div>
				</div>
		);
}

export default Header;
