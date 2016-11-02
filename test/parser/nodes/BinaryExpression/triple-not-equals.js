'use strict';

const data =
`10 !== 42`;

const node = {
	type: 'BinaryExpression',
	operator: '!==',
	start: 0,
	end: 9,
	left: {
		type: 'Literal',
		value: '10',
		start: 0,
		end: 2,
	},
	right: {
		type: 'Literal',
		value: '42',
		start: 7,
		end: 9,
	},
};

module.exports = {
	data,
	node
};
