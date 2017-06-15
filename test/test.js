#!/usr/bin/env node

'use strict';

const fs = require('fs');
const image = require('../lib/image.js');

image.identify('test.js').then((data) => {
	console.log('data', data);
}).catch((err) => {
	console.error('error', err);
});

image.identify('6132942800_3edd54eafc_o.jpg').then((data) => {
	console.log(data);
});
