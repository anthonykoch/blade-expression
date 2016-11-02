'use strict';

const data =
`hello()`;

const node = {
	type: 'CallExpression',
	start: 0,
	end: 7,
	arguments: [],
	callee: {
		type: 'Identifier',
		name: 'hello',
		start: 0,
		end: 5,
	}
};

module.exports = {
	data,
	node
};
