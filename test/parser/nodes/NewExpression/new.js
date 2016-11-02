'use strict';

const data =
`new Hello`;

const node = {
	type: 'NewExpression',
	start: 0,
	end: 9,
	arguments: [],
	callee: {
		type: 'Identifier',
		name: 'Hello',
		start: 4,
		end: 9,
	}
};

module.exports = {
	data,
	node
};
