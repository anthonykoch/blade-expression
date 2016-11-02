'use strict';

const data =
`void user`;

const node = {
	type: 'UnaryExpression',
	operator: 'void',
	prefix: true,
	start: 0,
	end: 9,
	argument: {
		type: 'Identifier',
		name: 'user',
		start: 5,
		end: 9,
	},
};

module.exports = {
	data,
	node
};
