import React from 'react';

import env from './env';

import MomentsComponent from './components/Moment';

import {Navbar} from 'reactstrap';
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

export default class App extends React.Component {
	static PAGES = [
		{name: 'Moments', slug: 'moments'},
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
					<MomentsComponent />
				</main>
			</div>
		</div>
	}
};
