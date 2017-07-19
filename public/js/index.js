'use strict';

import Hello from './hello.jsx';
import Route from './route.jsx';

import React from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';

var profileRoute = {
  queries: {
    // Routes declare queries using functions that return a query root. Relay
    // will automatically compose the `user` fragment from the Relay container
    // paired with this route on a Relay.RootContainer
//    user: () => Relay.QL`
//      # In Relay, the GraphQL query name can be optionally omitted.
//      query { user(id: $userID) }
//    `,
  },
  params: {
    // This `userID` parameter will populate the `$userID` variable above.
    userID: '123',
  },
  // Routes must also define a string name.
  name: 'ProfileRoute',
};

console.log('relay', Relay);

ReactDOM.render(
  <Relay.RootContainer
    Component={Hello}
    route={new Route()}
  />,
  document.getElementById('root')
);

console.log('done rendering');
