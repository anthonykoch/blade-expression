'use strict';

const data =
`'Hello ' + +new Person('James', {
	friends: [,'Some',, 'People',...users]
}).firstName`;

const node = {
	type: 'BinaryExpression',
	operator: '+',
	start: 0,
	end: 86,
	left: {
		type: 'Literal',
		value: `'Hello '`,
		start: 0,
		end: 8,
	},
	right: {
		type: 'UnaryExpression',
		operator: '+',
		prefix: true,
		start: 11,
		end: 86,
		argument: {
			type: 'MemberExpression',
			start: 12,
			end: 86,
			computed: false,
			property: {
				type: 'Identifier',
				name: 'firstName',
				start: 77,
				end: 86,
			},
			object: {
				type: 'NewExpression',
				start: 12,
				end: 76,
				callee: {
					type: 'Identifier',
					name: 'Person',
					start: 16,
					end: 22,
				},
				arguments: [
					{
						type: 'Literal',
						value: `'James'`,
						start: 23,
						end: 30,
					},
					{
						type: 'ObjectExpression',
						start: 32,
						end: 75,
						properties: [
							{
								type: 'Property',
								kind: 'init',
								shorthand: false,
								computed: false,
								method: false,
								start: 35,
								end: 73,
								key: {
									type: 'Identifier',
									name: 'friends',
									start: 35,
									end: 42,
								},
								value: {
									type: 'ArrayExpression',
									start: 44,
									end: 73,
									elements: [
										null,
										{
											type: 'Literal',
											value: `'Some'`,
											start: 46,
											end: 52,
										},
										null,
										{
											type: 'Literal',
											value: `'People'`,
											start: 55,
											end: 63,
										},
										{
											type: 'SpreadElement',
											start: 64,
											end: 72,
											argument: {
												type: 'Identifier',
												name: 'users',
												start: 67,
												end: 72,
											}
										}
									]
								}
							}
						]
					}
				]
			}
		}
	}
};

module.exports = {
	data,
	node
};
