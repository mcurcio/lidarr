'use strict';

import Relay from 'react-relay/compat';

class Route extends Relay.Route {
	constructor() {
		super();
	}
	/*
  static queries = {
    factions: () => Relay.QL`query { factions(names: $factionNames) }`,
  };
  static routeName = 'StarWarsAppHomeRoute';
  */
}

Route.queries = {
  factions: () => Relay.QL`query { factions(names: $factionNames) }`,
};

Route.routeNAme = 'StarWarsAppHomeRoute';

export default Route;
