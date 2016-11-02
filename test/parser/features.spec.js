'use strict';

const test = require('tape');

const { Parser: { parse } } = require('../utils');

function setup(data) {
	return parse(data);
}

function setupES7TrailingComma(data) {
	return parse(data, {
		context: {
			es7_trailing_comma: true
		}
	});
}

test.skip('option.es7_trailing_comma', (assert) => {
	assert.doesNotThrow(() => setupES7TrailingComma(`new Person(awd,)`));
	assert.throws(() => setup(`new Person(awd,)`))
	assert.end();
});
