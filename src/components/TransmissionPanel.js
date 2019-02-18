import React from 'react';
import FixedTransmissionNetwork from './FixedTransmissionNetwork';
import SelectedTransmissionNetwork from './SelectedTransmissionNetwork';
import TransmissionGraph from './TransmissionGraph';

class TransmissionPanel extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			subsetData: false,
		};
		this.subsetData = this.subsetData.bind(this);
	}
	subsetData() {
		this.setState({ subsetData: !this.state.subsetData });
	}

	render() {
		if (!this.state.subsetData) {
			return (
				<div>
					<div>
						<span style={{ paddingRight: '10px' }}>Color by: Clade:</span>

						<label className="switch">
							<input type="checkbox" onClick={this.props.updateColor} checked={this.props.byLocation} />
							<span className="slider round" />
						</label>
						<span style={{ paddingLeft: '10px', paddingRight: '10px' }}>By Location</span>

						<span style={{ paddingRight: '10px' }}>Display all Cases:</span>

						<label className="switch">
							<input type="checkbox" onClick={this.subsetData} checked={this.props.subsetData} />
							<span className="slider round" />
						</label>
						<span style={{ paddingLeft: '10px', paddingRight: '10px' }}>Sequenced Cases</span>
					</div>
					<TransmissionGraph {...this.props} />>
				</div>
			);
		} else {
			return (
				<div>
					<div>
						<span style={{ paddingRight: '10px' }}>Color by: Clade:</span>

						<label className="switch">
							<input type="checkbox" onClick={this.props.updateColor} checked={this.props.byLocation} />
							<span className="slider round" />
						</label>
						<span style={{ paddingLeft: '10px', paddingRight: '10px' }}>By Location</span>

						<span style={{ paddingRight: '10px' }}>Display all Cases:</span>

						<label className="switch">
							<input type="checkbox" onClick={this.subsetData} checked={this.props.subsetData} />
							<span className="slider round" />
						</label>
						<span style={{ paddingLeft: '10px', paddingRight: '10px' }}>Sequenced Cases</span>
					</div>
					<SelectedTransmissionNetwork {...this.props} />>
				</div>
			);
		}
	}
}

export default TransmissionPanel;
