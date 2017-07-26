'use strict';

import PhotoList from './PhotoList';

import React from 'react';
import ReactDOM from 'react-dom';

import {Button, Navbar} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './vendor/dashboard.css';

import {QueryRenderer, graphql} from 'react-relay';
import {
	Environment,
	Network,
	RecordSource,
	Store
} from 'relay-runtime';

const mountNode = document.getElementById('root');

function fetchQuery(operation, variables) {
	return fetch('/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: operation.text,
			variables
		})
	}).then(response => response.json());
}

const env = new Environment({
	network: Network.create(fetchQuery),
	store: new Store(new RecordSource())
});

ReactDOM.render(
	<QueryRenderer
		environment={env}
		query={graphql`
			query AppQuery {
				photos {
					...PhotoList
				}
			}
		`}
		variables={{}}
		render={({error, props}) => {
			if (error) {
				console.error('error', error);
			} else if (props) {
				return <div>
					<Navbar className="navbar navbar-toggleable-md navbar-inverse fixed-top bg-inverse">
						<a className="navbar-brand" href="#">Lidarr</a>
					</Navbar>

					<div className="container-fluid">
						<div className="row">
							<nav className="col-sm-3 col-md-2 hidden-xs-down bg-faded sidebar">
								<ul className="nav nav-pills flex-column">
									<li className="nav-item">
										<a className="nav-link active" href="#">Overview <span className="sr-only">(current)</span></a>
									</li>
								</ul>
							</nav>

							<main className="col-sm-9 offset-sm-3 col-md-10 offset-md-2 pt-3">
								<h1>Dashboard</h1>

								<PhotoList data={props.photos} />
							</main>
						</div>
					</div>
				</div>;
			} else {
				return <div>Loading</div>;
			}
		}}
  	/>,
	mountNode
);
