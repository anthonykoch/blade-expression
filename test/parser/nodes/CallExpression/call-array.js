'use strict';

const data =
`[]()`;

const node = {
	type: 'CallExpression',
	start: 0,
	end: 4,
	arguments: [],
	callee: {
		type: 'ArrayExpression',
		start: 0,
		end: 2,
		elements: [],
	}
};

module.exports = {
	data,
	node
};
