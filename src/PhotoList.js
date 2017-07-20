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
				<ul>
					{photo.locations.edges.map(location => <li key={location.node.id}>
						{location.node.path}
					</li>)}
				</ul>
			</div>)}
		</ol>;
	}
};

export default createFragmentContainer(PhotoList, graphql`
	fragment PhotoList on Photo @relay(plural: true) {
		id, width, height, uuid
		locations {
			edges {
				node {
					id
					path
				}
			}
		}
	}
`);
