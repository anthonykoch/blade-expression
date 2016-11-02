'use strict';

const data =
`hello ? 123 : 456`;

const node = {
	type: 'ConditionalExpression',
	start: 0,
	end: 17,
	test: {
		type: 'Identifier',
		name: 'hello',
		start: 0,
		end: 5,
	},
	consequent: {
		type:  'Literal',
		value: '123',
		start: 8,
		end: 11,
	},
	alternate: {
		type: 'Literal',
		value: '456',
		start: 14,
		end: 17,
	}
};

module.exports = {
	data,
	node
};
