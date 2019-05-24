import React from 'react';
class TransmissionPanel extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			// subsetData: false,
		};
		// this.subsetData = this.subsetData.bind(this);
	}
	// subsetData() {
	// 	this.setState({ subsetData: !this.state.subsetData });
	// }

	render() {
		
			return (
				<div>
					<TransmissionGraph {...this.props} />>
				</div>
			);
		}
	}


export default TransmissionPanel;
