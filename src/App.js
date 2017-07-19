'use strict';

import PhotoList from './PhotoList';

import React from 'react';
import ReactDOM from 'react-dom';

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
				return <PhotoList data={props.photos} />;
			} else {
				return <div>Loading</div>;
			}
		}}
  	/>,
	mountNode
);
