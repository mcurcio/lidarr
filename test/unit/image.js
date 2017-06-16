'use strict';

const fs = require('fs');
const path = require('path');

const image = require('../../lib/image.js');

const jpg = path.join(__dirname, '..', 'fixtures', '6132942800_3edd54eafc_o.jpg');

describe('image', () => {
	it('should exist', () => {
		assert.ok(image);
	});

	describe('type', () => {
		it('should work on images', () => {
			return assert.becomes(image(jpg).type(), 'jpg');
		});

		it('should reject non-image', () => {
			return assert.isRejected(image(__filename).type());
		});
	});

	describe('size', () => {
		it('should report size', () => {
			return assert.eventually.deepEqual(image(jpg).size(), {width: 1024, height: 1024});
		});

		it('should fail on non-image', () => {
			return assert.isRejected(image(__filename).type());
		});
	});
});
