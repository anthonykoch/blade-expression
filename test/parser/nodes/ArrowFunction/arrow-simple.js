'use strict';

const data =
`() => 123`;

const node = {
	type: 'ArrowExpression',
	start: 0,
	end: 9,
	parameters: [],
	rest: null,
	defaults: null,
	expression: true,
	generator: false,
	body: {
		type: 'Literal',
		value: '123',
		start: 6,
		end: 9
	}
};

module.exports = {
	data,
	node
};
