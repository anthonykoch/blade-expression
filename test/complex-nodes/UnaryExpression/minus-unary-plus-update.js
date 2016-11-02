'use strict';

const data =
`-++user`;

const node = {
	type: 'UnaryExpression',
	operator: '-',
	prefix: true,
	start: 0,
	end: 7,
	argument: {
		type: 'UpdateExpression',
		operator: '++',
		prefix: true,
		start: 1,
		end: 7,
		argument: {
			type: 'Identifier',
			name: 'user',
			start: 3,
			end: 7,
		}
	}
};

module.exports = {
	data,
	node
};
