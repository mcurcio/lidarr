'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
console.log('App', App);

const mountNode = document.getElementById('root');
ReactDOM.render(<App />, mountNode);
