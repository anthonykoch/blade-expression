'use strict';

const data =
`typeof user`;

const node = {
	type: 'UnaryExpression',
	operator: 'typeof',
	prefix: true,
	start: 0,
	end: 11,
	argument: {
		type: 'Identifier',
		name: 'user',
		start: 7,
		end: 11,
	},
};

module.exports = {
	data,
	node
};
