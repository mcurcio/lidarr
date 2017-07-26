'use strict';

import React from 'react';
import {createFragmentContainer, graphql} from 'react-relay';

class PhotoList extends React.Component {
	render() {
		const photos = this.props.data;
		return <ol>
			{photos.map(photo =>
				<li>
					{photo.thumbnails.edges.map(thumbnail => {
						return <img src={thumbnail.node.url} className="img-fluid" alt="Responsive image"></img>
					})}
				<div key={photo.id}>
				ID="{photo.id}"
				width="{photo.width}"
				uuid="{photo.uuid}"
			</div></li>)}
		</ol>;
	}
};

export default createFragmentContainer(PhotoList, graphql`
	fragment PhotoList on Photo @relay(plural: true) {
		id, width, height, uuid
		thumbnails(first:1) {
			edges {
				node {
					width height url
				}
			}
		}
	}
`);
