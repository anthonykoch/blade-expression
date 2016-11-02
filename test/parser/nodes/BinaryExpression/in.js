'use strict';

const data =
`10 in 42`;

const node = {
	type: 'BinaryExpression',
	operator: 'in',
	start: 0,
	end: 8,
	left: {
		type: 'Literal',
		value: '10',
		start: 0,
		end: 2,
	},
	right: {
		type: 'Literal',
		value: '42',
		start: 6,
		end: 8,
	},
};

module.exports = {
	data,
	node
};
