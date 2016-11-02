'use strict';

const data =
`10 instanceof 42`;

const node = {
	type: 'BinaryExpression',
	operator: 'instanceof',
	start: 0,
	end: 16,
	left: {
		type: 'Literal',
		value: '10',
		start: 0,
		end: 2,
	},
	right: {
		type: 'Literal',
		value: '42',
		start: 14,
		end: 16,
	},
};

module.exports = {
	data,
	node
};
