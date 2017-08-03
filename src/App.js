import React from 'react';
import {QueryRenderer, createRefetchContainer, graphql} from 'react-relay';

import env from './env';

import MomentList from './MomentList';

import {Navbar} from 'reactstrap';
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
*/
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

export default () => (
	<div>
		<Header />
		<div className="container-fluid">
			<Sidebar />
			<div className="row">
				<main className="col-sm-9 offset-sm-3 col-md-10 offset-md-2 pt-3">
					<IndexComponent />
				</main>
			</div>
		</div>
	</div>
);
