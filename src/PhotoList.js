'use strict';

import React from 'react';
import {createFragmentContainer, graphql} from 'react-relay';

class PhotoList extends React.Component {
	render() {
		const photos = this.props.data;
		return <ol>
			{photos.map(photo => <div key={photo.id}>
				ID="{photo.id}"
				width="{photo.width}"
				uuid="{photo.uuid}"
			</div>)}
		</ol>;
	}
};

export default createFragmentContainer(PhotoList, graphql`
	fragment PhotoList on Photo @relay(plural: true) {
		id, width, uuid
	}
`);
