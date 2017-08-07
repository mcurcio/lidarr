import React from 'react';
import {QueryRenderer, createPaginationContainer, createRefetchContainer, graphql} from 'react-relay';

import env from './env';

//import MomentList from './MomentList';

import ReactList from 'react-list';
import Lightbox from 'react-images';
console.log('Lightbox', Lightbox);

import {Button, Navbar} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './vendor/dashboard.css';

const Header = () => (
	<Navbar className="navbar navbar-toggleable-md navbar-inverse fixed-top bg-inverse">
		<a className="navbar-brand" href="#">Lidarr</a>
	</Navbar>
);

const Sidebar = (props) => {
	return <nav className="col-sm-3 col-md-2 hidden-xs-down bg-faded sidebar">
		<ul className="nav nav-pills flex-column">
			{props.pages.map(page => <li key={page.slug} className="nav-item">
				{console.log('page', page, props.page, page===props.page)}
				<a className={`nav-link ${page===props.page ? 'active' : ''}`} href={page.slug} onClick={e => props.setPage(page, e)}>{page.name}
					<span className="sr-only">(current)</span>
				</a>
			</li>)}
		</ul>
	</nav>
};

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
			lightboxIndex: Math.min(state.lightboxIndex + 1, this.props.data.photos.edges.length),
		}));
	}

	render() {
		const moment = this.props.data;
		console.log('MomentWidget', moment);

		const lead = moment.lead;
		let image = "";
		if (lead.thumbnail) {
			image = lead.thumbnail.url
		}
//		console.log('Moment', moment);
//console.log('lead', lead);
		let others = null;
		if (moment.photos.edges.length > 1) {
			others = moment.photos.edges
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
				images={moment.photos.edges.map(p => ({
					src: p.node.url,
					srcset: p.node.thumbnails.edges.map(t => `${t.node.url} ${t.node.width}w`),
					caption: `${p.node.takenAt}`
				}))} />
		</div>
		</div>;
	}
};
/*
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
*/
class MomentList3 extends React.Component {
	renderItem(index, key) {
		const moments = this.props.moments.moments.edges;
		const length = moments.length;
		const rows = length / 4;

		console.log('renderItem', key, index, this.props, length);

		if (index >= rows - 2) {
			this._loadMore();
		}

		// FIXME: this will fail on "incomplete" rows (when there are less than 4 photos)
		if (index < rows) {
			return <div key={key} className="row">
				{(Array.apply(true, Array(4))).map((v, i) => (
					<div key={i} className="col-sm" style={{paddingBottom: '30px'}}>
						<MomentWidget key={key} data={moments[(index * 4) + i].node} />
					</div>
				))}
			</div>
		}

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
	query AppMomentsQuery (
		$count: Int!
		$cursor: String
		#$orderBy: String!
	) {
		viewer {
			# You could reference the fragment defined previously.
			...App_moments
		}
	}
`;

MomentList3 = createPaginationContainer(MomentList3, {
	moments: graphql`
		fragment App_moments on Viewer {
			moments(
				first: $count
				after: $cursor
				#orderBy: TAKEN # other variables
			) @connection(key: "MomentList3_moments") {
				edges {
					cursor
					node {
						id
						lead {
							id
							thumbnail {
								url
							}
						}
						photos {
							edges {
								node {
									id
									url
									takenAt
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
			// in most cases, for variables other than connection filters like
			// `first`, `after`, etc. you may want to use the previous values.
			orderBy: fragmentVariables.orderBy,
		};
		console.log('getVariables', obj);
		return obj;
	},
	query
});
const IndexComponent = () => <QueryRenderer environment={env}
variables={{count: 4 * 4, cursor: null}}
query={query}
render={({error, props}) => {
	if (error) {
		return <div>{error.message}</div>;
	} else if (props) {
		console.log('IndexComponent#render', props);
		return <div>
			<MomentList3 data={props} moments={props.viewer} />
		</div>;
	}
	return <div>Loading</div>;
}} />;

export default class App extends React.Component {
	static PAGES = [
		{name: 'Recently Taken', slug: 'recently-taken'},
		{name: 'Recently Added', slug: 'recently-added'}
	];

	constructor(props) {
		super(props);

		this.state = {
			page: App.PAGES[0]
		};
	}

	setPage(page, e) {
		e.preventDefault();

		console.log('setPage', page);
		if (App.PAGES.includes(page)) {
			this.setState({
				page
			});
		}
	}

	render() {
		return <div>
			<Header />
			<div className="container-fluid">
				<Sidebar pages={App.PAGES} page={this.state.page} setPage={this.setPage.bind(this)} />
				<main className="col-sm-9 offset-sm-3 col-md-10 offset-md-2 pt-3">
					<IndexComponent />
				</main>
			</div>
		</div>
	}
};
