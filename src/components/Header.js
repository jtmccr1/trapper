import React from 'react';
import logo from '../images/logo.png';
import '../styles/Header.css';

class Header extends React.Component {
	render() {
		return (
			<div className="header">
				<div style={{ float: 'left', margin: '10px' }}>
					<a href="http://artic.network" target="_blank" rel="noopener noreferrer">
						<img src={logo} alt={'logo'} width="132" />
					</a>
				</div>
				<div>
					<h1 style={{ marginTop: '60px', marginLeft: '10px' }}>TRAPPER</h1>
					<h2 style={{ marginTop: '10px', marginLeft: '10px' }}>
						Transmission Reconstuction And Phylogenetics Promoting Early Response
					</h2>
				</div>
			</div>
		);
	}
}

export default Header;
