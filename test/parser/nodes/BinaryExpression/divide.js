'use strict';

const data =
`10 / 42`;

const node = {
	type: 'BinaryExpression',
	operator: '/',
	start: 0,
	end: 7,
	left: {
		type: 'Literal',
		value: '10',
		start: 0,
		end: 2,
	},
	right: {
		type: 'Literal',
		value: '42',
		start: 5,
		end: 7,
	},
};

module.exports = {
	data,
	node
};
