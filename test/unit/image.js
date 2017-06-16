'use strict';

const fs = require('fs');
const path = require('path');

const image = require('../../lib/image.js');

const jpg = fixture('6132942800_3edd54eafc_o.jpg');

describe('image', () => {
	it('should exist', () => {
		assert.ok(image);
	});

	describe('stats', () => {
		it('should work on images', () => {
			return assert.eventually.include(image(jpg).stats(), {
				type: 'jpg',
				width: 1024,
				height: 1024
			});
		});

		it('should reject non-image', () => {
			return assert.becomes(image(__filename).stats(), null);
		});
	});
});
