'use strict';

const data =
`new Person('Sally', 'John').friends`;

const node = {
	type: 'MemberExpression',
	start: 0,
	end: 35,
	computed: false,
	object: {
		type: 'NewExpression',
		start: 0,
		end: 27,
		arguments: [
			{
				type: 'Literal',
				value: `'Sally'`,
				start: 11,
				end: 18,
			},
			{
				type: 'Literal',
				value: `'John'`,
				start: 20,
				end: 26,
			}
		],
		callee: {
			type: 'Identifier',
			name: 'Person',
			start: 4,
			end: 10,
		}
	},
	property: {
		type: 'Identifier',
		name: 'friends',
		start: 28,
		end: 35,
	}
};

module.exports = {
	data,
	node
};
