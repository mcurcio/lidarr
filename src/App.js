import React from 'react';
import {QueryRenderer, graphql} from 'react-relay';

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

const IndexComponent = () => (
	<QueryRenderer
		environment={env}
		query={graphql`
			query AppQuery {
				moments(limit:6) {
					...MomentList
				}
			}
		`}
		variables={{}}
		render={({error, props}) => {
			if (error) {
				console.error("IndexComponent error", error);
				return <div>Error</div>;
			} else if (props) {
				return <div>
					<div>Index Component</div>
					<MomentList data={props.moments} />
				</div>;
			} else {
				return <div>Loading</div>;
			}
		}}
	/>
);

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
