#!/usr/bin/env node

'use strict';

const fs = require('fs');
const image = require('../../lib/image.js');
const path = require('path');

describe('image', () => {
	it('should exist', () => {
		assert.ok(image);
		assert.ok(image.identify);
	});

	describe('identify', () => {
		it('should work on images', () => {
			return assert.isFulfilled(image.identify(path.join(__dirname, '..', 'fixtures', '6132942800_3edd54eafc_o.jpg')));
		});

		it('should reject non-image', () => {
			return assert.isRejected(image.identify(__filename));
		});
	});
});

