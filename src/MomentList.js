'use strict';

import React from 'react';
import {createFragmentContainer, graphql} from 'react-relay';

class MomentWidget extends React.Component {
	render() {
		const moment = this.props.data;

		return <div style={{
			backgroundImage: `url(${moment.lead.thumbnail.url})`,
			backgroundPosition: 'center center',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			width: '100%',
			paddingBottom: '100%'
		}}></div>;
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
	}
`);


class MomentList extends React.Component {
	render() {
		const moments = this.props.data;

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

		return <div>{dom}</div>;
	}
};

export default createFragmentContainer(MomentList, graphql`
	fragment MomentList on Moment @relay(plural: true) {
		id
		...MomentListView
	}
`);
