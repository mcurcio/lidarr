'use strict';

import Relay from 'react-relay';

export default class extends Relay.Route {
	static queries = {
		photo: (Component) => Relay.QL`query {
			photo { ${Component.getFragment('photo')} }
		}`
  	};

	static routeName = 'StarWarsAppHomeRoute';
}
