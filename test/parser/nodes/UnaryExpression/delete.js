'use strict';

const data =
`delete user`;

const node = {
	type: 'UnaryExpression',
	operator: 'delete',
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
