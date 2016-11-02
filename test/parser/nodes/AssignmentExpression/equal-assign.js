'use strict';

const data =
`food = 'good'`;

const node = {
	type: 'AssignmentExpression',
	operator: '=',
	start: 0,
	end: 13,
	left: {
		type: 'Identifier',
		name: 'food',
		start: 0,
		end: 4,
	},
	right: {
		type: 'Literal',
		value: `'good'`,
		start: 7,
		end: 13,
	}
};

module.exports = {
	data,
	node
};
