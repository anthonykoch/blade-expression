'use strict';

const data =
`123()`;

const node = {
	type: 'CallExpression',
	start: 0,
	end: 5,
	arguments: [],
	callee: {
		type: 'Literal',
		value: '123',
		start: 0,
		end: 3,
	}
};

module.exports = {
	data,
	node
};
