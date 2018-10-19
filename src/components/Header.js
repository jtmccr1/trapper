import React from 'react';
import logo from '../images/logo.png';
import '../styles/Header.css';

class Header extends React.Component {
	render() {
		return (
			<div className="header">
				<div>
					<h1 style={{ marginTop: '60px', marginLeft: '10px' }}>TRAPPER</h1>
					<h2 style={{ marginTop: '10px', marginLeft: '10px' }}>
						Transmission Reconstuction And Phylogenetics Promoting Early Response
					</h2>
				</div>

				<div style={{ position: 'absolute', right: '0' }}>
					<a href="http://artic.network" target="_blank">
						<img src={logo} alt={'logo'} width="132" />
					</a>
				</div>
			</div>
		);
	}
}

export default Header;
