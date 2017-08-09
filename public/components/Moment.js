'use strict';

import React from 'react';
import {QueryRenderer, createFragmentContainer, createPaginationContainer, graphql} from 'react-relay';

import env from '../env';

import {Button} from 'reactstrap';
import ReactList from 'react-list';
import Lightbox from 'react-images';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import moment from 'moment';

import '../vendor/daterangepicker.css'

class MomentWidget extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			lightboxOpen: false,
			lightboxIndex: 0
		};
	}

	goToPrevious() {
		this.setState((state) => ({
			lightboxIndex: state.lightboxIndex - 1,
		}));
	}

	goToNext() {
		this.setState((state) => ({
			lightboxIndex: state.lightboxIndex + 1,
		}));
	}

	goToImage(index) {
		this.setState({
			lightboxIndex: index,
		});
	}

	handleClickImage() {
		this.setState((state) => ({
			lightboxIndex: Math.min(state.lightboxIndex + 1, this.props.data.assets.edges.length),
		}));
	}

	render() {
		const moment = this.props.moment;
		console.log('MomentWidget', this.props, moment);

		const lead = moment.lead;
		let image = "";
		if (lead.thumbnail) {
			image = lead.thumbnail.url
		}
//		console.log('Moment', moment);
//console.log('lead', lead);
		let others = null;
		if (moment.assets.edges.length > 1) {
			others = moment.assets.edges
				.slice(0, 3)
				.map(n => n.node)
				.filter(p => p.id !== lead.id)
				.slice(0, 2)
				.map((p, i) => <div key={i+1} style={{
					backgroundImage: `url(${p.url})`,
					backgroundPosition: 'center center',
					backgroundRepeat: 'no-repeat',
					backgroundSize: 'cover',
					width: '90%',
					transform: `rotateZ(${i==1 ? "5": "-5"}deg)`,
					paddingBottom: '90%',
					position: "absolute",
					"top": 0,
					"zIndex": 0
				}} />);
			//console.log('others', others);
		}

		return <div onClick={() => this.setState({lightboxOpen: true})}>
			{others}
		<div key={0} style={{
			backgroundImage: `url(${image})`,
			backgroundPosition: 'center center',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			width: '100%',
			paddingBottom: '100%',
			"zIndex": 1,
			position: "relative"
		}}>
			<Lightbox
				enableKeyboardInput={true}
				backdropClosesModal={true}
				showThumbnails={true}
				onClose={() => this.setState({lightboxOpen: false})}
				onClickNext={this.goToNext.bind(this)}
				onClickPrev={this.goToPrevious.bind(this)}
				onClickImage={this.handleClickImage.bind(this)}
				onClickThumbnail={this.goToImage.bind(this)}
				currentImage={this.state.lightboxIndex}
				isOpen={this.state.lightboxOpen}
				images={moment.assets.edges.map(p => ({
					src: p.node.url,
					srcset: p.node.thumbnails.edges.map(t => `${t.node.url} ${t.node.width}w`),
					caption: <div>
						{p.node.bornAt}
						<span className="badge badge-info">{p.node.format}</span>
					</div>
			}))} />
		</div>
		</div>;
	}
};

MomentWidget = createFragmentContainer(MomentWidget, graphql`
	fragment Moment_moment on Moment {
		id
		lead {
			id
			thumbnail {
				url
			}
		}
		assets {
			edges {
				node {
					id
					url
					type
					format
					width
					height
					bornAt
					thumbnails {
						edges {
							node {
								size
								url
								width
							}
						}
					}
				}
			}
		}
	}
`);

class MomentList3 extends React.Component {
	renderItem(index, key) {
		const moments = this.props.moments.moments.edges;

		// available moments to render
		const length = moments.length;

		// rows to render
		const rows = Math.floor(length / 4);

		// based on the rows, how many items are requested?
		const requested = rows * 4;

		console.log('renderItem', key, index, this.props, length);

		if (index >= rows - 2) {
			this._loadMore();
		}

		return <div key={key} className="row">
			{(Array.apply(true, Array(4))).map((v, i) => {
				let moment = moments[(index*4) + i];

				return <div key={i} className="col-sm" style={{paddingBottom: '30px'}}>
					{moment ?
						<MomentWidget key={key} moment={moments[(index * 4) + i].node} />
					:""}
				</div>
			})}
		</div>

		return <div />;
	}

	render() {
		//console.log('MomentList3#render', this.props);
		const moments = this.props.moments.moments.edges.map(n => n.node);
		//console.log('moments', moments);

		return <ReactList
			itemRenderer={this.renderItem.bind(this)}
			length={Math.ceil(moments.length/4)}
			minSize={4}
			type='uniform'
		/>;
	}

	_loadMore() {
		//console.log('load more', this.props.relay.hasMore(), this.props.relay.isLoading());
		if (!this.props.relay.hasMore() || this.props.relay.isLoading()) {
			//console.log('not loading more');
			return;
		}

		//console.log('loading');
		this.props.relay.loadMore(
			4 * 4, // Fetch the next 10 feed items
			e => {
				if (e) { console.error('error loading', e); }
			},
		);
	}
};

const query = graphql`
	query MomentsQuery (
		$count: Int!
		$cursor: String
		#$where: 
		#$orderBy: String!
	) {
		viewer {
			# You could reference the fragment defined previously.
			...Moment_moments
		}
	}
`;

MomentList3 = createPaginationContainer(MomentList3, {
	moments: graphql`
		fragment Moment_moments on Viewer {
			moments(
				first: $count
				after: $cursor
				where: $where
				#orderBy: TAKEN # other variables
			) @connection(key: "MomentList3_moments") {
				edges {
					cursor
					node {
						...Moment_moment
					}
				}
				pageInfo {
					endCursor
					hasNextPage
				}
			}
		}
	`,
},
{
	direction: 'forward',
	getConnectionFromProps(props) {
		console.log('props', props);
		const m = props.moments && props.moments.moments;
		console.log('getConnectionFromProps', m);
		return m;
	},
	getFragmentVariables(prevVars, totalCount) {
		let obj = {
			...prevVars,
			count: totalCount,
		};
		console.log('getFragmentVariables', prevVars, totalCount, obj);
		return obj;
	},
	getVariables(props, {count, cursor}, fragmentVariables) {
		let obj = {
			count,
			cursor,
			where: fragmentVariables.where,
			orderBy: fragmentVariables.orderBy,
		};
		console.log('getVariables', obj);
		return obj;
	},
	query
});
class IndexComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			variables: {
				count: 4 * 4,
				cursor: null,
				where: {start: {$le: momentjs({y:2015})}}
			},
			ranges: {
				'Today': [moment(), moment()],
				'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
				'Last 7 Days': [moment().subtract(6, 'days'), moment()],
				'Last 30 Days': [moment().subtract(29, 'days'), moment()],
				'This Month': [moment().startOf('month'), moment().endOf('month')],
				'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]

			}
		};
	}

	renderResponse({error, props}) {
		console.log('renderResponse', error, props);
		if (error) {
			return <div>{error.message}</div>;
		} else if (props) {
			console.log('IndexComponent#render', props);
			return <div>
				<h3>Moments</h3>
				<DateRangePicker ranges={this.state.ranges}>
					<Button className="selected-date-range-btn" style={{width:'100%'}}>
						<div className="pull-left">{/*<BS.Glyphicon glyph="calendar" />*/}</div>
						<div className="pull-right">
							<span>Date Range Label</span>
							<span className="caret"></span>
						</div>
					</Button>
				</DateRangePicker>
				<MomentList3 data={props} moments={props.viewer} />
			</div>;
		}

		return <div>Loading</div>;
	}

	render() {
		console.log('render QueryRenderer');
		return <QueryRenderer
			environment={env}
			variables={this.state.variables}
			query={query}
			render={this.renderResponse.bind(this)}
		/>;
	}
};

export default IndexComponent;
