'use strict';

const data =
`'Hello'()`;

const node = {
	type: 'CallExpression',
	start: 0,
	end: 9,
	arguments: [],
	callee: {
		type: 'Literal',
		value: `'Hello'`,
		start: 0,
		end: 7,
	}
};

module.exports = {
	data,
	node
};
