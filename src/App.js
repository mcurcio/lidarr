import React from 'react';
import {QueryRenderer, createPaginationContainer, createRefetchContainer, graphql} from 'react-relay';

import env from './env';

//import MomentList from './MomentList';

//import ReactList from 'react-list';

import {Button, Navbar} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './vendor/dashboard.css';

const Header = () => (
	<Navbar className="navbar navbar-toggleable-md navbar-inverse fixed-top bg-inverse">
		<a className="navbar-brand" href="#">Lidarr</a>
	</Navbar>
);

const Sidebar = () => (
	<nav className="col-sm-3 col-md-2 hidden-xs-down bg-faded sidebar">
		<ul className="nav nav-pills flex-column">
			<li className="nav-item">
				<a className="nav-link active" href="#">Overview <span className="sr-only">(current)</span></a>
			</li>
		</ul>
	</nav>
);
/*
class AllMoments extends React.Component {
  render() {
	  console.log('AllMoments', this.props);
	return (
	  <div>
		AllMoments
	</div>
	);
  }

  _loadMore() {
	// Increments the number of stories being rendered by 10.
	const refetchVariables = fragmentVariables => ({
	  count: fragmentVariables.count + 10,
	});
	this.props.relay.refetch(refetchVariables, null);
  }
}

module.exports = createRefetchContainer(
  AllMoments,
	{
		moments: graphql.experimental`
			fragment App_moments on RootQueryType @argumentDefinitions(
				count: {type: "Int", defaultValue: 10}
			) {
				moments(first: $count) {}
			}
		`
	},
  graphql.experimental`
	query App_Query($count: Int) {
		...App_moments @arguments(count: $count)
	}
  `,
);

class IndexComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			page: 0,
			size: 6
		};
	}

	setPage(page) {
		console.log('IndexComponent#setPage', ":" + page + ":");
		this.setState({
			page
		});
	}

	render() {
		return <QueryRenderer
			environment={env}
			query={graphql`
				query AppQuery($page: Int, size: Int) {
					...MomentList
				}
			`}
			variables={{
				page: this.state.page,
				size: this.state.size
			}}
			render={({error, props}) => {
				if (error) {
					console.error("IndexComponent error", error);
					return <div>Error</div>;
				} else if (props) {
					console.log('props', props);
					return <div>
						<div>Index Component</div>
						<MomentList data={props} page={this.state.page} setPage={this.setPage.bind(this)} />
					</div>;
				} else {
					return <div>Loading</div>;
				}
			}}
		/>
	}
};
*/
/*
 * pagination
class MomentList2 extends React.Component {
	constructor(props) {
		super(props);

		this.renderItem = this.renderItem.bind(this);
	}

	renderItem(key, index) {
		console.log('MomentList2#renderItem', key, index, this.props);
	}

	render() {
		console.log('MomentList2#render', this.props);

		return <ul>
			<ReactList itemRenderer={this.renderItem} length={3} />
		</ul>;
	}
};
MomentList2 = Relay.createContainer(MomentList2, {
	initialVariables: {
		pageSize: pageSize
	},
	fragments: {
		moments: () => graphql`
			fragment on RootQueryType {
				moments(first: $pageSize) {
					edges {
						node {
							id
						}
					}
				}
			}
		`
	}
});
*/

class MomentWidget extends React.Component {
	render() {
		const moment = this.props.data;
		console.log('MomentWidget', moment);

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
			}}>{moment.assets.edges.length}</div>
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
	render() {
		console.log('MomentList3#render', this.props);
		const moments = this.props.moments.moments.edges.map(n => n.node);
		console.log('moments', moments);

		let rows = [];
		let size = 4;

		while (moments.length > 0)
			rows.push(moments.splice(0, size));
		console.log('rows', rows);

		return <div>
			{rows.map((row, index) => <div key={index} className="row">
				{row.map(m => <div key={m.id} className="col-sm" style={{marginBottom: '30px'}}>
					<MomentWidget data={m} />
				</div>)}
			</div>)}

			{this.props.relay.hasMore() ? <Button onClick={() => this._loadMore()} color="primary" size="lg" block>Load more</Button> : ""}
		</div>;
		/*(
			<div className="row">
				{moments.map(m => (<div key={m.id} className="col-sm" style={{marginBottom: '30px'}}>
					<MomentWidget data={m} />
				</div>))}
				<Button onClick={() => this._loadMore()}>Load more</Button>
				<a
					href="#"
					onClick={() => this._loadMore()}
					title="Load More"
				>Load more</a>
			</div>
		);*/
	}

	_loadMore() {
		console.log('load more', this.props.relay.hasMore(), this.props.relay.isLoading());
		if (!this.props.relay.hasMore() || this.props.relay.isLoading()) {
			console.log('not loading more');
			return;
		}

		console.log('loading');
		this.props.relay.loadMore(
			4, // Fetch the next 10 feed items
			e => {
				console.log(e);
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
				#orderBy: $orderBy # other variables
			) @connection(key: "MomentList3_moments") {
				edges {
					cursor
					node {
						id
						lead {
							thumbnail {
								url
							}
						}
						assets {
							edges {
								node {
									url
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
variables={{count: 4, cursor: null}}
query={query}
render={({error, props}) => {
	if (error) {
		return <div>{error.message}</div>;
	} else if (props) {
		console.log('IndexComponent#render', props);
		return <MomentList3 data={props} moments={props.viewer} />;
	}
	return <div>Loading</div>;
}} />;

export default () => (
	<div>
		<Header />
		<div className="container-fluid">
			<Sidebar />
			<main className="col-sm-9 offset-sm-3 col-md-10 offset-md-2 pt-3">
				<IndexComponent />
			</main>
		</div>
	</div>
);
