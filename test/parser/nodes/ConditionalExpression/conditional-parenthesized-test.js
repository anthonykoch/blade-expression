'use strict';

const data =
`(hello) ? 123 : 456`;

const node = {
	type: 'ConditionalExpression',
	start: 1,
	end: 19,
	test: {
		type: 'Identifier',
		name: 'hello',
		start: 1,
		end: 6,
	},
	consequent: {
		type:  'Literal',
		value: '123',
		start: 10,
		end: 13,
	},
	alternate: {
		type: 'Literal',
		value: '456',
		start: 16,
		end: 19,
	}
};

module.exports = {
	data,
	node
};
