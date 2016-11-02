'use strict';

const data =
`user => 123`;

const node = {
	type: 'ArrowExpression',
	start: 0,
	end: 11,
	parameters: [
		{
			type: 'Identifier',
			name: 'user',
			start: 0,
			end: 4,
		}
	],
	rest: null,
	defaults: null,
	expression: true,
	generator: false,
	body: {
		type: 'Literal',
		value: '123',
		start: 8,
		end: 11
	}
};

module.exports = {
	data,
	node
};
