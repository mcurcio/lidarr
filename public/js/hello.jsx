'use strict';

import React from 'react';
import Relay from 'react-relay';

class StarWarsApp extends React.Component {
  constructor() {
    super();
    this.state = {
      factionId: 1,
      shipName: '',
    };
  }

  handleAddShip() {
    //const name = this.state.shipName;
/*    this.props.relay.commitUpdate(
      new AddShipMutation({
        name,
        faction: this.props.factions[this.state.factionId],
      })
    );
    this.setState({shipName: ''});
  }
*/
  }
  handleInputChange(e) {
/*    this.setState({
      shipName: e.target.value,
  });*/
  }

  handleSelectionChange(e) {
/*    this.setState({
      factionId: e.target.value,
  });*/
  }

	render() {
		const {photo} = this.props;
		console.log('render', photo);
		return <div>Photo id="{photo.id}" width="{photo.width}" uuid="{photo.uuid}"</div>;
	}
};

export default Relay.createContainer(StarWarsApp, {
	fragments: {
		photo: () => Relay.QL`
			fragment on Photo {
				id, width, uuid
			}
		`,
	},
});
