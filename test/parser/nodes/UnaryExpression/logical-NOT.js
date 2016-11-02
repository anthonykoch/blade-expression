'use strict';

const data =
`!user`;

const node = {
	type: 'UnaryExpression',
	operator: '!',
	prefix: true,
	start: 0,
	end: 5,
	argument: {
		type: 'Identifier',
		name: 'user',
		start: 1,
		end: 5,
	},
};

module.exports = {
	data,
	node
};
