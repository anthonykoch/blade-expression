'use strict';

const data =
`[1, ...userList, 2]`;

const node = {
	type: 'ArrayExpression',
	start: 0,
	end: 19,
	elements: [
		{
			type: 'Literal',
			value: '1',
			start: 1,
			end: 2,
		},
		{
			type: 'SpreadElement',
			start: 4,
			end: 15,
			argument: {
				type: 'Identifier',
				name: 'userList',
				start: 7,
				end: 15,
			}
		},
		{
			type: 'Literal',
			value: '2',
			start: 17,
			end: 18
		}
	]
};

module.exports = {
	data,
	node
};
