'use strict';

import React from 'react';
import {createFragmentContainer, graphql} from 'react-relay';
import {Pagination, PaginationItem, PaginationLink} from 'reactstrap';

class MomentWidget extends React.Component {
	render() {
		const moment = this.props.data;

		let image = "";
		if (moment.lead.thumbnail) {
			image = moment.lead.thumbnail.url
		}
		console.log(moment);

		return <div style={{
			backgroundImage: `url(${image})`,
			backgroundPosition: 'center center',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			width: '100%',
			paddingBottom: '100%'
		}}>
			<div style={{
				position: "absolute",
				width: "10%",
				height: "10%",
				background: "yellow"
			}}>{moment.photos.edges.length}</div>
		</div>;
	}
};

MomentWidget = createFragmentContainer(MomentWidget, graphql`
	fragment MomentListView on Moment {
		id
		lead {
			thumbnail {
				url
			}
		}
		photos {
			edges {
				node {
					url
				}
			}
		}
	}
`);


class MomentList extends React.Component {
	setPage(page) {
		console.log('MomentList#setPage', page);

		this.props.setPage(page);
	}

	render() {
		console.log('MomentList', this.props);
		const moments = this.props.moments.moments.edges.map(n => n.node);
		console.log('moments!!!', moments);

		let rows = [];
		let size = 4;

		while (moments.length > 0)
			rows.push(moments.splice(0, size));

		let dom = [];
		for (let i = 0; i < rows.length; ++i) {
			const row = rows[i];
			let r = [];

			for (let j = 0; j < size; ++j) {
				const moment = row[j];

				if (moment) {
					r.push(<div key={moment.id} className="col-sm" style={{marginBottom: '30px'}}>
						<MomentWidget key={moment.id} data={moment}></MomentWidget>
					</div>);
				} else {
					r.push(<div key={j} className="col-sm"></div>);
				}
			}

			dom.push(<div key={i} className="row">{r}</div>);
		}

		return <div>
			{dom}
		</div>;
	}
};

export default createFragmentContainer(MomentList, graphql`
	fragment MomentList on Moment {
		id
		...MomentListView
	}
`);
