'use strict';

const data =
`{ ['Hello' + ' there']: what }`;

const node = {
	type: 'ObjectExpression',
	start: 0,
	end: 30,
	properties: [
		{
			type: 'Property',
			kind: 'init',
			shorthand: false,
			computed: true,
			method: false,
			start: 2,
			end: 28,
			key: {
				type: 'BinaryExpression',
				operator: '+',
				start: 3,
				end: 21,
				left: {
					type: 'Literal',
					value: `'Hello'`,
					start: 3,
					end: 10,
				},
				right: {
					type: 'Literal',
					value: `' there'`,
					start: 13,
					end: 21,
				}
			},
			value: {
				type: 'Identifier',
				name: 'what',
				start: 24,
				end: 28,
			}
		}
	]
};

module.exports = {
	data,
	node
};
