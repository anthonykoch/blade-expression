(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Parser = __webpack_require__(1);

	module.exports = Parser;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// module.exports = Parser;

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var assign = __webpack_require__(2);

	var Lexer = __webpack_require__(3);

	var _require = __webpack_require__(8);

	var TokenKeyword = _require.TokenKeyword;
	var TokenIdentifier = _require.TokenIdentifier;
	var TokenPunctuator = _require.TokenPunctuator;
	var TokenStringLiteral = _require.TokenStringLiteral;
	var TokenNumericLiteral = _require.TokenNumericLiteral;

	var _require2 = __webpack_require__(9);

	var assignment = _require2.assignment;

	var _require3 = __webpack_require__(4);

	var replace = _require3.replace;
	var count = _require3.count;
	var createSourceError = _require3.createSourceError;

	/**
	 * Error messages
	 */

	var StrictDelete = 'Delete of an unqualified identifier in strict mode.';
	var UnexpectedEnd = 'Unexpected end of input';
	var UnexpectedToken = 'Unexpected token {token}';
	var UnexpectedType = 'Unexpected {type}';
	var InvalidLHSAssignment = 'Invalid left-hand side in assignment';
	var InvalidLHSAssignmentPrefix = 'Invalid left-hand side expression in prefix operation';
	var InvalidLHSAssignmentPostfix = 'Invalid left-hand side expression in postfix operation';
	var UnexpectedStrictReservedWord = 'Unexpected strict mode reserved word';
	var UnexpectedStrictEvalOrArguments = 'Unexpected eval or arguments in strict mode';
	var UnexpectedExpression = 'Unexpected {expression}';

	var UnsupportedFunctionBody = 'Unsupported function body';
	var UnsupportedClass = 'Class expressions are not supported';
	var UnsupportedFunction = 'Function expressions are not supported';
	var UnsupportedMeta = 'Meta expressions are not supported';
	var UnsupportedSuper = '"super" expressions are not supported';

	/**
	 * Features
	 */

	var ES7_TRAILING_COMMA = 'es7_trailing_comma';

	/**
	 * Little helper functions
	 */

	var toLowerCase = function toLowerCase(s) {
		return s.toLowerCase();
	};

	var operatorPrecedence = {
		'!': 15,
		'~': 15,
		'++': 15,
		'--': 15,
		'typeof': 15,
		'void': 15,
		'delete': 15,

		'**': 14,
		'*': 14,
		'/': 14,
		'%': 14,

		'+': 13,
		'-': 13,

		'<<': 12,
		'>>': 12,
		'>>>': 12,

		'<': 11,
		'<=': 11,
		'>': 11,
		'>=': 11,
		'in': 11,
		'instanceof': 11,

		'==': 10,
		'!=': 10,
		'===': 10,
		'!==': 10,

		'&': 9,
		'^': 8,
		'|': 7,

		'&&': 6,
		'||': 5
	};

	var simpleop = {

		'**': 14,
		'*': 14,
		'/': 14,
		'%': 14,

		'+': 13,
		'-': 13,

		'<<': 12,
		'>>': 12,
		'>>>': 12,

		'<': 11,
		'<=': 11,
		'>': 11,
		'>=': 11,
		'in': 11,
		'instanceof': 11,

		'==': 10,
		'!=': 10,
		'===': 10,
		'!==': 10,

		'&': 9,
		'^': 8,
		'|': 7,

		'&&': 6,
		'||': 5
	};

	function isUnaryOperator(token) {
		var value = void 0;

		if (token) {
			value = token.value;
		} else {
			return false;
		}

		if (TokenPunctuator !== token.type && TokenKeyword !== token.type) {
			return false;
		}

		return '+' === value || '-' === value || '!' === value || 'void' === value || '~' === value || 'delete' === value || 'typeof' === value;
	}

	/**
	 * Returns the precedence of the operator passed or 0 if the
	 * token is not an operator.
	 *
	 * @param  {Object} token
	 * @return {Number}
	 */

	function precedence(token, accept_IN) {
		if (token === null) {
			return 0;
		}

		// FIXME: Not sure when accept_IN is supposed to be false
		// if (token.value === 'in' && ! accept_IN) {
		// 	return 0;
		// }

		return operatorPrecedence[token.value];
	}

	/**
	 * Semantic checks
	 */

	/**
	 * Returns true if the string passed is an assignment operator.
	 *
	 * @param  {String} punc
	 * @return {Boolean}
	 */

	function isAssignment(punc) {
		return !!assignment[punc];
	}

	/**
	 * Returns true if the token is a valid property name.
	 *
	 * @param  {Object}  token
	 * @return {Boolean}
	 */

	function isValidPropertyName(token) {
		var type = token.type;
		var value = token.value;

		if (TokenIdentifier === type) {
			return true;
		} else if (TokenKeyword === type) {
			return value === 'null' || value === 'false' || value === 'true';
		}

		return false;
	}

	function isValidSimpleAssignmentTarget_Assign(node, strict) {
		if (Identifier.name === node.type) {
			if (strict && isValdSimpleAssignmentTarget_Identifier(node.name)) {
				return false;
			}

			return true;
		} else if (MemberExpression.name === node.type) {
			return true;
		}

		return false;
	}

	function isValidSimpleAssignmentTarget_Update(node) {
		var isObject = ArrayExpression.name === node.type || ObjectExpression.name === node.type;
		return isValidSimpleAssignmentTarget_Assign(node);
	}

	function isValidSimpleAssignmentTarget_Arguments(node) {
		return isValidSimpleAssignmentTarget_Assign(node);
	}

	/**
	 * #sec-identifiers-static-semantics-early-errors
	 */

	function isValdSimpleAssignmentTarget_Identifier(name) {
		return name === 'eval' || name === 'arguments';
	}

	/**
	 * Returns true if the expression possibly has binding identifiers.
	 */

	function isBinding(expr) {
		var type = expr.type;

		return Identifier.name === type || SpreadElement.name === type || ArrayExpression.name === type || ObjectExpression.name === type;
	}

	var CONDITIONAL_PRECEDENCE = 4;
	var WHILE_FAILSAFE = 1000000;

	function Literal(value, start, end) {
		this.type = Literal.name;
		this.value = value;
		this.start = start;
		this.end = end;
	}

	function Identifier(name, start, end) {
		this.type = Identifier.name;
		this.name = name;
		this.start = start;
		this.end = end;
	}

	function SpreadElement(expr, start, end) {
		this.type = SpreadElement.name;
		this.argument = expr;
		this.start = start;
		this.end = end;
	}

	function ThisExpression(start, end) {
		this.type = ThisExpression.name;
		this.start = start;
		this.end = end;
	}

	function SequenceExpression(body, start, end) {
		this.type = SequenceExpression.name;
		this.expressions = body;
		this.start = start;
		this.end = end;
	}

	function NewExpression(callee, args, start, end) {
		this.type = NewExpression.name;
		this.callee = callee;
		this.arguments = args;
		this.start = start;
		this.end = end;
	}

	function CallExpression(callee, args, start, end) {
		this.type = CallExpression.name;
		this.callee = callee;
		this.arguments = args;
		this.start = start;
		this.end = end;
	}

	function MemberExpression(object, property, computed, start, end) {
		this.type = MemberExpression.name;
		this.object = object;
		this.property = property;
		this.computed = computed;
		this.start = start;
		this.end = end;
	}

	function YieldExpression(argument, delegates, start, end) {
		this.type = YieldExpression.name;
		this.argument = argument;
		this.delegates = delegates;
		this.start = start;
		this.end = end;
	}

	function ArrayExpression(elements, start, end) {
		this.type = ArrayExpression.name;
		this.elements = elements;
		this.start = start;
		this.end = end;
	}

	function Property(shorthand, kind, computed, method, key, value, start, end) {
		this.type = Property.name;
		this.shorthand = shorthand;
		this.kind = kind;
		this.computed = computed;
		this.method = method;
		this.key = key;
		this.value = value;
		this.start = start;
		this.end = end;
	}

	function ObjectExpression(properties, start, end) {
		this.type = ObjectExpression.name;
		this.properties = properties;
		this.start = start;
		this.end = end;
	}

	function UpdateExpression(operator, argument, isPrefix, start, end) {
		this.type = UpdateExpression.name;
		this.operator = operator;
		this.argument = argument;
		this.prefix = isPrefix;
		this.start = start;
		this.end = end;
	}

	function UnaryExpression(operator, argument, start, end) {
		this.type = UnaryExpression.name;
		this.operator = operator;
		this.argument = argument;
		this.prefix = true;
		this.start = start;
		this.end = end;
	}

	function LogicalExpression(operator, left, right, start, end) {
		this.type = LogicalExpression.name;
		this.operator = operator;
		this.left = left;
		this.right = right;
		this.start = start;
		this.end = end;
	}

	function BinaryExpression(operator, left, right, start, end) {
		this.type = BinaryExpression.name;
		this.operator = operator;
		this.left = left;
		this.right = right;
		this.start = start;
		this.end = end;
	}

	function ArrowExpression(parameters, defaults, rest, body, generator, start, end) {
		this.type = ArrowExpression.name;
		this.parameters = parameters;
		this.defaults = defaults;
		this.rest = rest;
		this.body = body;
		this.generator = generator;
		this.expression = true;
		this.start = start;
		this.end = end;
	}

	function ConditionalExpression(test, consequent, alternate, start, end) {
		this.type = ConditionalExpression.name;
		this.test = test;
		this.consequent = consequent;
		this.alternate = alternate;
		this.start = start;
		this.end = end;
	}

	function AssignmentExpression(operator, left, right, start, end) {
		this.type = AssignmentExpression.name;
		this.operator = operator;
		this.left = left;
		this.right = right;
		this.start = start;
		this.end = end;
	}

	function ExpressionStatement(expr) {
		this.type = ExpressionStatement.name;
		this.expression = expr;
	}

	function Program(body) {
		this.type = Program.name;
		this.body = body;
	}

	var Parser = {

		/**
	  * Creates a lexer object.
	  *
	  * @param  {Object} options
	  * @return {Object}
	  */

		create: function create(data, options) {
			return Object.create(ParserPrototype).init(data, options);
		},


		walk: __webpack_require__(10).walk

	};

	var ParserPrototype = {
		init: function init(data, opts) {
			var options = opts || {};
			var useStickyRegex = options.useStickyRegex;

			var lexerOptions = {
				useStickyRegex: useStickyRegex
			};

			this.context = assign({}, options.context);
			this.lexer = Lexer.create(data);
			this.hasMore = false;
			return this;
		},


		/**
	  * Parses the data string and returns the AST.
	  */

		parse: function parse(data, options) {
			return Parser.create(data, options).parse();
		},


		/**
	  * Consumes the next token and returns it if the token value is the
	  * same as the value passed. If it does not match, the parser throws
	  * an error. If there are no more tokens in the stream, the parser
	  * throws for unexpected end of input.
	  *
	  * @param {String} value
	  */

		expect: function expect(value) {
			var token = this.nextToken();

			if (token === null) {
				this.error(UnexpectedEnd);
			} else if (token.value !== value) {
				this.error(UnexpectedToken, token);
			}

			return token;
		},


		/**
	  * Asserts that there are tokens up to the index specified and returns
	  * the token else throws an UnexpectedEnd error.
	  *
	  * @param  {Number} index - The token index
	  * @param  {Object} last  - The last know token (used for error reporting)
	  * @return {Object}
	  */

		ensure: function ensure(index, last) {
			var token = this.lexer.lookahead(index);

			if (token === null) {
				this.error(UnexpectedEnd, last);
			}

			return token;
		},
		peek: function peek() {
			return this.lexer.peek();
		},
		nextToken: function nextToken() {
			return this.lexer.nextToken();
		},


		/**
	  * Consumes tokens until the type is found.
	  *
	  * @param {String} type
	  * @param {Token} begin - Used for error reporting
	  */

		consumeUntil: function consumeUntil(value, begin) {
			var token = void 0;

			while (true) {
				token = this.peek();

				if (!token) {
					this.error(UnexpectedEnd, begin);
				} else if (value === token.value) {
					return;
				}

				token = this.nextToken();
			}
		},


		/**
	  * Returns true if the current token value matches the one passed.
	  *
	  * @param {String} value
	  */

		match: function match(value) {
			var token = this.peek();
			return token !== null && token.value === value;
		},


		/**
	  * Returns true if all arguments passed have their respective placement
	  * in the lexer's token stream.
	  *
	  * @example
	  *   const parser = Parser.create('() => 123');
	  *
	  *   parser.matches('(', ')', '=>'); // true
	  *   parser.matches('(', '=>');      // false
	  *
	  * @param {...String} args
	  * @return {Boolean}
	  */

		matches: function matches() {
			var lexer = this.lexer;
			var length = arguments.length;
			var token = void 0;

			for (var i = 0; i < length; i = i + 1) {
				token = lexer.lookahead(i + 1);

				if (!token || token.value !== arguments[i]) {
					return false;
				}
			}

			return true;
		},


		/**
	  * Returns the number of newlines between the two nodes or tokens.
	  *
	  * @param {Object} before
	  * @param {Object} after
	  * @return {Number}
	  */

		hasNewlineBetween: function hasNewlineBetween(before, after) {
			return count(this.source.substring(before.end, after.start), '\n');
		},


		/**
	  * Returns true if a feature (e.g. strict or es7 trailing comma) is enabled.
	  *
	  * @return {Boolean}
	  */

		feature: function feature(name) {
			return this.context[name] === true;
		},


		/**
	  * Throws an error from the message passed
	  */

		error: function error(message, _token, expr) {
			var _typeTranslation;

			var typeTranslation = (_typeTranslation = {}, _defineProperty(_typeTranslation, TokenNumericLiteral, 'number'), _defineProperty(_typeTranslation, TokenStringLiteral, 'string'), _typeTranslation);
			var token = _token || {};
			var value = token.value;
			var column = undefined;
			var name = 'ParseError';
			var type = void 0;

			if (token && token.column && token.value) {
				column = token.column - token.value.length + 1;

				if (message === UnexpectedToken && typeTranslation[token.type]) {
					message = UnexpectedType;
					type = typeTranslation[token.type];
				}
			}

			var err = createSourceError({
				name: name,
				line: token.line,
				column: column,
				source: this.source,
				message: replace(message, {
					token: value,
					expression: expr,
					type: type
				})
			});
			throw err;
		},


		get source() {
			return this.lexer.source;
		}

	};

	var ParsingFunctions = {

		/**
	  * Rewrites object and array expressions as destructuring.
	  */

		rewriteNonPattern: function rewriteNonPattern(body) {
			for (var i = 0; i < body.length; i++) {
				var expr = body[i];

				if (ArrayExpression.name === expr.type || ObjectExpression.name === expr.type) {
					this.error('Destructuring not yet supported');
				}
			}

			return body;
		},
		parseArrowRemains: function parseArrowRemains(parameters, defaults, rest, start) {
			// The expression was arrow parameters
			var token = this.nextToken();
			var body = this.parseFunctionBody(true);

			if (parameters.length) {
				parameters = this.rewriteNonPattern(parameters);
			}

			return new ArrowExpression(parameters, null, rest, body, false, start, body.end);
		},
		parseSequenceExpression: function parseSequenceExpression() {
			var token = this.expect('(');
			var defaults = null;
			var body = [];
			var restToken = void 0;
			var rest = null;
			var node = void 0;
			var expr = void 0;

			while (!this.match(')')) {
				if (this.match('...')) {
					restToken = this.peek();
					rest = this.parseSpreadElement(true).argument;
					body.push(rest);
					break;
				}

				expr = this.parseAssignmentExpression();
				body.push(expr);

				if (this.match(',')) {
					var _token2 = this.nextToken();

					if (_token2 && ')' === _token2.valule && !this.feature(ES7_TRAILING_COMMA)) {
						this.error('UnexpectedToken', this.peek());
					}
				} else {
					break;
				}
			}

			var end = this.expect(')').end;
			var hasArrow = this.match('=>');

			if (!hasArrow && rest) {
				this.error(UnexpectedToken, restToken);
			}

			if (hasArrow) {
				return this.parseArrowRemains(body, defaults, rest, token.start);
			} else {
				if (body.length > 1) {
					node = new SequenceExpression(body, start, end);
				} else {
					node = expr;
				}
			}

			return node;
		},
		parsePrimaryExpression: function parsePrimaryExpression() {
			var token = this.peek();
			var _context = this.context;
			var strict = _context.strict;
			var inGenerator = _context.inGenerator;

			var node = null;

			if (!token) {
				this.error(UnexpectedEnd);
			}

			var value = token.value;
			var start = token.start;
			var end = token.end;

			switch (token.type) {
				case TokenIdentifier:
					if (strict && isValdSimpleAssignmentTarget_Identifier(value)) {
						this.error(UnexpectedStrictEvalOrArguments, token);
					}

					node = new Identifier(value, start, end);
					this.nextToken();
					break;
				case TokenNumericLiteral:
				case TokenStringLiteral:
					node = new Literal(value, start, end);
					this.nextToken();
					break;
				case TokenKeyword:
					switch (value) {
						case 'this':
							node = new ThisExpression(start, end);
							this.nextToken();
							break;
						case 'null':
						case 'true':
						case 'false':
							node = new Literal(value, start, end);
							this.nextToken();
							break;
						case 'function':
							this.error(UnsupportedFunction, token);
							break;
						case 'class':
							this.error(UnsupportedClass, token);
							break;
						case 'yield':
							if (strict) {
								// NOTE: Shouldn't parseAssignment catch this?
								//       Maybe we should just throw.
								if ('yield' === value && !inGenerator) {
									this.error(UnexpectedStrictReservedWord, token);
								}

								this.error(UnexpectedStrictReservedWord, token);
							}
							node = new Identifier(value, start, end);
							this.nextToken();
							break;
						default:
							this.error(UnexpectedToken);
							break;
					}

					break;
				case TokenPunctuator:
					switch (value) {
						case '(':
							node = this.parseSequenceExpression();
							break;
						case '{':
							node = this.parseObjectLiteral();
							break;
						case '[':
							node = this.parseArrayLiteral();
							break;
						default:
							break;
					}

					break;
				default:
					this.error(UnexpectedToken, token);
					break;
			}

			if (null == node) {
				this.error(UnexpectedToken, token);
			}

			return node;
		},
		parseSpreadElement: function parseSpreadElement(assertIdentifier) {
			var token = this.expect('...');
			var expr = this.parseAssignmentExpression();
			var start = token.start;
			var end = expr.end;

			if (assertIdentifier) {
				if (Identifier.name !== expr.type) {
					this.error(UnexpectedToken, token);
				} else if (this.context.strict && isValdSimpleAssignmentTarget_Identifier(expr.name)) {
					this.error(UnexpectedStrictEvalOrArguments, token);
				}
			}

			return new SpreadElement(expr, start, end);
		},
		parseArrayLiteral: function parseArrayLiteral() {
			var begin = this.expect('[');
			var elements = [];
			var end = void 0;

			while (!this.match(']')) {
				var token = this.peek();
				var value = void 0;

				if (!token) {
					this.error(UnexpectedEnd, begin);
				}

				value = token.value;

				if (',' === value) {
					this.nextToken();
					elements.push(null);
				} else {
					if ('...' === value) {
						elements.push(this.parseSpreadElement(false));
					} else {
						var expr = this.parseAssignmentExpression();
						elements.push(expr);
					}

					if (!this.match(']')) {
						this.expect(',');
					}
				}
			}

			end = this.expect(']').end;

			return new ArrayExpression(elements, begin.start, end);
		},
		parseObjectLiteral: function parseObjectLiteral() {
			var begin = this.expect('{');
			var properties = [];

			while (!this.match('}')) {
				var token = this.peek();
				var _start = token.start;
				var shorthand = false;
				var computed = false;
				var method = false;
				var value = null;
				var key = void 0;
				var _end = void 0;
				var kind = 'init';

				if (!token) {
					this.error(UnexpectedEnd, begin);
				}

				if ('[' === token.value) {
					this.nextToken();
					key = this.parseAssignmentExpression();
					computed = true;
					this.expect(']');
					this.expect(':');
					value = this.parseAssignmentExpression();
					_end = value.end;
				} else if (TokenIdentifier === token.type) {
					this.nextToken();
					var token2 = this.peek();

					if (token2) {
						if ('=' === token2.value) {
							this.error('Initializer is not supported');
						} else if ('(' === token2.value) {
							this.error('Method definitions are not supported');
						} else if (':' === token2.value) {
							this.nextToken();
							key = new Identifier(token.value, token.start, token.end);
							value = this.parseAssignmentExpression();
							_end = value.end;
						} else {
							// FIXME: This is probably a semantic error if the
							//        key is not na identifier
							shorthand = true;
							key = value = new Identifier(token.value, token.start, token.end);
							_end = token.end;
						}
					}
				} else if (token && token.type === TokenStringLiteral || token.type === TokenNumericLiteral) {
					key = new Literal(token.value, token.start, token.end);
					this.nextToken();
					this.expect(':');
					value = this.parseAssignmentExpression();
					_end = value.end;
				} else {
					this.error(UnexpectedToken, begin);
				}

				var property = new Property(shorthand, kind, computed, method, key, value, _start, _end);
				properties.push(property);

				if (!this.match('}')) {
					this.expect(',');
				}
			}

			var end = this.expect('}').end;

			return new ObjectExpression(properties, begin.start, end);
		},
		parseFunctionExpression: function parseFunctionExpression() {
			this.error(UnsupportedFunction);
		},
		parseFunctionBody: function parseFunctionBody(isArrow) {
			if (this.match('{')) {
				this.error(UnsupportedFunctionBody, this.peek());
			}

			if (isArrow) {
				return this.parseAssignmentExpression();
			}

			this.error(UnexpectedToken, this.peek());
		},
		parseArguments: function parseArguments() {
			var begin = this.expect('(');
			var args = [];
			var token = this.peek();

			if (token && ')' !== token.value) {
				while (true) {
					if (this.match('...')) {
						var expr = this.parseAssignmentExpression();
						args.push(new SpreadElement(expr));
						this.expect(')');
						break;
					} else {
						args.push(this.parseAssignmentExpression());
					}

					if (!this.match(')')) {
						this.expect(',');
					} else {
						break;
					}
				}
			}

			return args;
		},
		parseNewExpression: function parseNewExpression() {
			var begin = this.expect('new');
			var start = begin.start;

			if (this.match('.')) {
				this.error(UnsupportedMeta);
			}

			var callee = this.parseLHSExpression();
			var matches = this.match('(');
			var args = matches ? this.parseArguments() : [];
			var end = matches ? this.expect(')').end : callee.end;

			return new NewExpression(callee, args, start, end);
		},
		parseNonComputedProperty: function parseNonComputedProperty() {
			var token = this.nextToken();

			if (token === null) {
				this.error(UnexpectedEnd);
			} else if (TokenIdentifier !== token.type && TokenKeyword !== token.type) {
				this.error(UnexpectedToken, token);
			}

			return new Identifier(token.value, token.start, token.end);
		},
		parseMemberExpression: function parseMemberExpression(object, withArguments) {
			var token = void 0;

			while (token = this.peek()) {
				var value = token.value;

				if ('.' === value) {
					this.nextToken();
					var property = this.parseNonComputedProperty();
					object = new MemberExpression(object, property, false, object.start, property.end);
				} else if ('[' === value) {
					this.nextToken();
					var argument = this.parseExpression();
					var end = this.expect(']').end;
					object = new MemberExpression(object, argument, true, object.start, end);
				} else if (withArguments && '(' === value) {
					var args = this.parseArguments();
					var _end2 = this.expect(')').end;
					object = new CallExpression(object, args, object.start, _end2);
				} else {
					break;
				}

				// TODO: Parse template literals
			}

			return object;
		},
		parseLHSExpressionWithArgs: function parseLHSExpressionWithArgs() {
			var token = this.peek();
			var expr = void 0;

			if (!token) {
				this.error(UnexpectedEnd);
			}

			if ('new' === token.value) {
				expr = this.parseNewExpression();
			} else if (this.match('super')) {
				this.error(UnsupportedSuper, token);
			} else {
				expr = this.parsePrimaryExpression();
			}

			var node = this.parseMemberExpression(expr, true);
			return node;
		},
		parseLHSExpression: function parseLHSExpression() {
			var token = this.peek();
			var expr = void 0;

			if (this.match('new')) {
				expr = this.parseNewExpression();
			} else if (this.match('super')) {
				this.error(UnsupportedSuper, token);
			} else {
				expr = this.parsePrimaryExpression();
			}

			var node = this.parseMemberExpression(expr, false);
			return node;
		},
		parseUpdateExpression: function parseUpdateExpression() {
			var begin = this.peek();
			var token = void 0;
			var node = void 0;

			if (!begin) {
				this.error(UnexpectedEnd);
			}

			if ('++' === begin.value || '--' === begin.value) {
				this.nextToken();
				var expr = this.parseUnaryExpression();
				node = new UpdateExpression(begin.value, expr, true, begin.start, expr.end);
			} else {
				node = this.parseLHSExpressionWithArgs();
			}

			while (token = this.peek()) {
				if ('++' === token.value || '--' === token.value) {
					if (this.hasNewlineBetween(node, token)) {
						return node;
					}

					this.nextToken();
					node = new UpdateExpression(token.value, node, false, node.start, token.end);

					if (!isValidSimpleAssignmentTarget_Update(node.argument)) {
						this.error(InvalidLHSAssignmentPostfix, token);
					}
				} else {
					break;
				}
			}

			return node;
		},
		checkSimplePrimary: function checkSimplePrimary(token, skipOperatorCheck) {
			var lookahead = this.lexer.lookahead(2);

			if (skipOperatorCheck || lookahead && simpleop[lookahead.value]) {
				var fn = void 0;

				if (!token) {
					return;
				}

				switch (token.type) {
					case TokenStringLiteral:
					case TokenNumericLiteral:
						fn = Literal;
						break;
					case TokenIdentifier:
						fn = Identifier;

						if (this.context.strict && isValdSimpleAssignmentTarget_Identifier(token.value)) {
							this.error(UnexpectedStrictEvalOrArguments, token);
						}

						break;
					default:
						break;
				}

				if (fn) {
					this.nextToken();
					return new fn(token.value, token.start, token.end);
				}
			}
		},
		parseUnaryExpression: function parseUnaryExpression() {
			var token = this.peek();
			var node = void 0;
			var value = void 0;
			var type = void 0;

			var primary = this.checkSimplePrimary(token);

			if (primary) {
				return primary;
			}

			// FIXME: I think this should error out in parsePrimaryExpression
			//        Maybe change this.error to this.parseUpdateExpression();
			if (token) {
				value = token.value;
				type = token.type;
			}

			if (TokenPunctuator === type && '++' === value || '--' === value) {
				// token is prefixed update expression
				var expr = this.parseUpdateExpression();

				if (!isValidSimpleAssignmentTarget_Update(expr.argument)) {
					this.error(InvalidLHSAssignmentPrefix, token);
				}

				return expr;
			} else if (isUnaryOperator(token)) {
				this.nextToken();
				var _expr = this.parseUnaryExpression();

				if ('delete' === value) {
					if (this.context.strict && 'delete' === value && 'Identifier' == _expr.type) {
						// #sec-delete-operator-static-semantics-early-errors
						this.error(StrictDelete, token);
					}
				}

				return new UnaryExpression(value, _expr, token.start, _expr.end);
			} else {
				return this.parseUpdateExpression();
			}
		},


		/**
	  * Copyright 2014, the V8 project authors. All rights reserved.
	  *
	  * https://github.com/nodejs/node/blob/91b40944a41f8ab1e499ed5bebeed520a215b9a5/deps/v8/src/parsing/parser-base.h#L2675
	  */

		parseBinaryExpression: function parseBinaryExpression(prec) {
			var left = this.parseUnaryExpression();
			var token = this.peek();
			var right = void 0;
			var fn = void 0;

			// NOTE: Not sure if this is the best way to do this
			// Catch JS keywords that are not valid

			if (token && TokenKeyword === token.type && !(token.value in operatorPrecedence)) {
				this.error(UnexpectedToken, token);
			}

			for (var prec1 = precedence(this.peek()); prec1 >= prec; prec1--) {

				while (precedence(this.peek()) === prec1) {
					var operator = this.nextToken();
					var op = operator.value;
					var nextPrec = '**' === op ? prec1 : prec1 + 1;
					var _start2 = left.start;
					right = this.parseBinaryExpression(nextPrec);

					if ('||' === op || '&&' === op) {
						fn = LogicalExpression;
					} else {
						fn = BinaryExpression;
					}

					left = new fn(op, left, right, left.start, right.end);
				}
			}

			return left;
		},
		parseConditionalExpression: function parseConditionalExpression() {
			var begin = this.peek();
			var node = this.parseBinaryExpression(CONDITIONAL_PRECEDENCE);
			var token = this.peek();

			if (token && '?' === token.value) {
				this.nextToken();
				var consequent = this.parseAssignmentExpression();
				this.expect(':');
				var alternate = this.parseAssignmentExpression();
				node = new ConditionalExpression(node, consequent, alternate, node.start, alternate.end);
			} else if (token && '=>' === token.value) {
				if (Identifier.name !== node.type) {
					this.error(UnexpectedToken, begin);
				}

				node = this.parseArrowRemains([node], null, null, node.start);
			}

			return node;
		},


		// #sec-generator-function-definitions

		parseYieldExpression: function parseYieldExpression() {
			var token = this.expect('yield');
			var nextToken = this.peek();
			var start = token.start;
			var delegates = false;
			var argument = null;

			if (nextToken && nextToken.line === token.line) {
				delegates = '*' === nextToken.value;
				argument = this.parseAssignmentExpression();
			}

			var end = argument ? argument.end : token.end;

			return new YieldExpression(argument, delegates, start, end);
		},


		/**
	  * TODO: #sec-assignment-operators-static-semantics-early-errors
	  */

		parseAssignmentExpression: function parseAssignmentExpression() {
			var token = this.peek();
			var node = null;

			if (this.match('yield') && this.context.inGenerator) {
				node = this.parseYieldExpression();
			} else {
				node = this.parseConditionalExpression(CONDITIONAL_PRECEDENCE);
				var _token3 = this.peek();

				if (_token3 && TokenPunctuator === _token3.type && isAssignment(_token3.value)) {

					if (!isValidSimpleAssignmentTarget_Assign(node, this.context.strict)) {
						this.error(InvalidLHSAssignment);
					}

					this.nextToken();
					var rhs = this.parseAssignmentExpression();
					node = new AssignmentExpression(_token3.value, node, rhs, node.start, rhs.end);
				}
			}

			return node;
		},


		/**
	  * #sec-expressions
	  */

		parseExpression: function parseExpression() {
			var lookahead = this.lexer.lookahead(2);
			var begin = this.peek();

			if (null === lookahead && begin) {
				var node = this.checkSimplePrimary(begin, true);

				if (node) {
					return node;
				}
			}

			var expr = this.parseAssignmentExpression();
			var nextToken = this.peek();
			var start = expr.start;
			var end = void 0;

			if (nextToken && TokenPunctuator === nextToken.type && ',' === nextToken.value) {
				var body = [expr];

				while (this.match(',')) {
					this.nextToken();
					var _expr2 = this.parseAssignmentExpression();
					body.push(_expr2);
				}

				return new SequenceExpression(body, start, body[body.length - 1].end);
			}

			return expr;
		},
		parseExpressionStatement: function parseExpressionStatement() {
			var first = this.peek();
			var expr = this.parseExpression();
			var second = this.peek();
			var lookahead = this.lexer.lookahead(2);
			var hasMore = lookahead !== null;

			if (second && ';' === second.value) {
				this.hasMore = true;
				this.nextToken();
			} else if (hasMore) {
				this.hasMore = true;
			} else if (second && this.hasNewlineBetween(expr, second)) {
				this.hasMore = true;
			} else if (second) {
				this.error(UnexpectedToken, second);
			}

			return new ExpressionStatement(expr);
		},
		parse: function parse() {
			var expr = void 0;

			if (this.peek() === null) {
				return new Program([]);
			} else {
				expr = this.parseExpressionStatement();
			}

			return new Program([expr]);
		}
	};

	assign(ParserPrototype, {
		nodes: {
			Literal: Literal,
			Identifier: Identifier,
			SpreadElement: SpreadElement,
			ThisExpression: ThisExpression,
			SequenceExpression: SequenceExpression,
			NewExpression: NewExpression,
			CallExpression: CallExpression,
			MemberExpression: MemberExpression,
			YieldExpression: YieldExpression,
			ArrayExpression: ArrayExpression,
			Property: Property,
			ObjectExpression: ObjectExpression,
			UpdateExpression: UpdateExpression,
			UnaryExpression: UnaryExpression,
			LogicalExpression: LogicalExpression,
			BinaryExpression: BinaryExpression,
			ArrowExpression: ArrowExpression,
			ConditionalExpression: ConditionalExpression,
			AssignmentExpression: AssignmentExpression,
			ExpressionStatement: ExpressionStatement,
			Program: Program
		}
	});

	assign(ParserPrototype, ParsingFunctions);

	function parse(data, options) {
		return Parser.create(data, options).parse();
	}

	Parser.parse = parse;

	module.exports = Parser;

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	/* eslint-disable no-unused-vars */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (e) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	module.exports = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// module.exports = Lexer;

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	var assign = __webpack_require__(2);

	var _require = __webpack_require__(4);

	var count = _require.count;
	var createSourceError = _require.createSourceError;

	var _require2 = __webpack_require__(7);

	var Punctuator = _require2.Punctuator;
	var NumericLiteral = _require2.NumericLiteral;
	var StringLiteral = _require2.StringLiteral;
	var ReservedWord = _require2.ReservedWord;
	var IdentifierName = _require2.IdentifierName;

	var _require3 = __webpack_require__(8);

	var TokenKeyword = _require3.TokenKeyword;
	var TokenIdentifier = _require3.TokenIdentifier;
	var TokenPunctuator = _require3.TokenPunctuator;
	var TokenStringLiteral = _require3.TokenStringLiteral;
	var TokenNumericLiteral = _require3.TokenNumericLiteral;


	var keywords = {
		'break': true,
		'do': true,
		'in': true,
		'typeof': true,
		'case': true,
		'else': true,
		'instanceof': true,
		'var': true,
		'catch': true,
		'export': true,
		'new': true,
		'void': true,
		'class': true,
		'extends': true,
		'return': true,
		'while': true,
		'const': true,
		'finally': true,
		'super': true,
		'with': true,
		'continue': true,
		'for': true,
		'switch': true,
		'yield': true,
		'debugger': true,
		'function': true,
		'this': true,
		'default': true,
		'if': true,
		'throw': true,
		'delete': true,
		'import': true,
		'try': true,
		'null': true,
		'true': true,
		'false': true
	};

	var _SUPPORTS_STICKY = void 0;

	try {
		(function checkStickySupport() {
			_SUPPORTS_STICKY = eval('/pls/y').sticky === true;
		})();
	} catch (err) {
		_SUPPORTS_STICKY = false;
	}

	var SUPPORTS_STICKY = _SUPPORTS_STICKY;
	var RE_IDENTIFIER_NAME = new RegExp('^' + IdentifierName.source);

	var Lexer = {

		/**
	  * Creates a lexer object.
	  *
	  * @param  {Object} options
	  * @return {Object}
	  */

		create: function create(data, options) {
			return Object.create(LexerPrototype).init(data, options);
		},


		/**
	  * Returns all tokens for a given string.
	  *
	  * @param  {String} data - The data to be tokenized
	  * @param  {String} options - Options to pass to lexer.init
	  * @return {Array.<Object>}
	  */

		all: function all(data, options) {
			var lexer = Lexer.create(data, options);
			var tokens = [];
			var token = void 0;

			while (token = lexer.nextToken()) {
				tokens.push(token);
			}

			return tokens;
		}
	};

	var regexes = getRegexes.call(Object.create(null), SUPPORTS_STICKY);

	var LexerPrototype = {};

	assign(LexerPrototype, {

		/**
	  * Initiates a lexer object.
	  *
	  * @param {Object} options
	  * @param {String} options.data - The data to be lexed
	  * @param {String} options.customDirectives - Custom directives lex
	  * @return {this}
	  */

		init: function init(data, opts) {
			var options = opts || {};
			var _options$useStickyReg = options.useStickyRegex;
			var useStickyRegex = _options$useStickyReg === undefined ? true : _options$useStickyReg;


			var source = data.replace(/\r\n|[\n\r]/g, '\n');

			if (source.charAt(0) === '\uFEFF') {
				source = source.slice(1);
			}

			this.line = 1;
			this.column = 0;
			this.position = 0;
			this.stash = [];
			this.source = this.input = source;
			this.inputLength = this.source.length;
			this.ended = false;
			this.useStickyRegex = useStickyRegex && SUPPORTS_STICKY;

			var regs = void 0;

			if (!this.useStickyRegex) {
				regs = getRegexes.call(this, false);
			} else {
				regs = regexes;
			}

			this.Punctuator = regs.Punctuator;
			this.NumericLiteral = regs.NumericLiteral;
			this.StringLiteral = regs.StringLiteral;
			this.ReservedWord = regs.ReservedWord;
			this.IdentifierName = regs.IdentifierName;

			if (this.useStickyRegex) {
				this.resetLastIndex(0);
			}

			return this;
		},


		/**
	  * Returns a token from the input or `null` if no tokens can be found.
	  *
	  * @return {Object|null}
	  */

		lex: function lex() {
			var token = null || this.getNumericLiteraloken() || this.getStringLiteralToken() || this.getPunctuatorToken() || this.getIdentifierNameToken();

			if (token == null) {
				this.lexError();
			}

			if (this.useStickyRegex) {
				this.resetLastIndex(token.end);
			}

			return token;
		},
		lexError: function lexError() {
			var position = this.position;
			var char = this.source[position];

			var errorInfo = {
				line: this.line,
				column: this.column
			};

			if (/^['"]/.test(char)) {
				errorInfo.column = this.column + 1;
				this.error('Unterminated string literal', errorInfo);
			}

			this.error('Unexpected token "' + char + '"', errorInfo);
		},


		/**
	  * Resets the last index, which only needs to be done when we are
	  * using the sticky flag for indexes.
	  */

		resetLastIndex: function resetLastIndex(lastIndex) {
			this.Punctuator.lastIndex = lastIndex;
			this.NumericLiteral.lastIndex = lastIndex;
			this.StringLiteral.lastIndex = lastIndex;
			this.ReservedWord.lastIndex = lastIndex;
			this.IdentifierName.lastIndex = lastIndex;
		},


		/**
	  * Handles whitespace for when regex uses sticky flag
	  */

		skipWhitespace: function skipWhitespace() {
			var column = this.column;
			var line = this.line;
			var start = this.position;
			var pos = this.position;
			var times = 0;
			var previousLine = line;
			var char = void 0;

			while (char = this.source[pos]) {
				if ('\n' === char) {
					line = line + 1;
				} else if (' ' === char || '\t' === char) {} else {
					break;
				}

				pos = pos + 1;
				times = times + 1;

				if (line > previousLine) {
					column = 0;
				} else {
					column = column + 1;
				}

				previousLine = line;
			}

			if (!this.useStickyRegex) {
				this.input = this.input.substring(times, this.inputLength);
			}

			this.position = pos;
			this.line = line;
			this.column = column;
		},
		handleWhitespace: function handleWhitespace() {
			this.skipWhitespace();

			if (this.useStickyRegex) {
				this.resetLastIndex(this.position);
			}

			if (!this.useStickyRegex) {
				if (this.input.length === 0) {
					this.ended = true;
				}
			} else {
				if (this.position >= this.inputLength) {
					this.ended = true;
				}
			}
		},


		/**
	  * Returns the token at `index` or `null` if there are no more tokens.
	  *
	  * @param  {Number} index - The number of tokens to look ahead
	  * @return {Object|null}
	  */

		lookahead: function lookahead(index) {
			var stash = this.stash;

			var times = index - stash.length;
			var token = void 0;

			if (index < 0) {
				this.error('Lookahead index can not be less than 0');
			}

			if (stash[index - 1] !== undefined) {
				return stash[index - 1];
			}

			while (times-- > 0) {
				this.handleWhitespace();

				if (this.ended) {
					break;
				}

				token = this.lex();

				if (token) {
					stash.push(token);
				}
			}

			return stash[index - 1] || null;
		},


		/**
	  * Returns the next token without consuming the token or null if no
	  * tokens can be found.
	  *
	  * @return {Object|null}
	  */

		peek: function peek() {
			return this.lookahead(1);
		},


		/**
	  * Returns and consumes the next token or `null` if there are no more
	  * tokens to be consumed from the input.
	  *
	  * @return {Object|null}
	  */

		nextToken: function nextToken() {
			var token = void 0;

			if (this.stash.length) {
				// Even if we've ended we need to return from the stash
				return this.stash.shift();
			} else if (this.ended) {
				// If we've already ended, return null
				return null;
			}

			this.handleWhitespace();

			if (this.ended) {
				return null;
			}

			token = this.lex();

			return token;
		},


		/**
	  * Implementation of the iterator protocol.
	  *
	  * The iterator is complete when there are no more tokens to be consumed.
	  *
	  * @return {Object}
	  */

		next: function next() {
			var token = this.nextToken();

			if (token === null) {
				return {
					done: true,
					value: undefined
				};
			}

			return {
				done: false,
				value: token
			};
		},


		/**
	  * Throws an error with the message passed.
	  *
	  * @param {String} message
	  */

		error: function error(message) {
			var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

			var line = _ref.line;
			var column = _ref.column;

			var err = createSourceError({
				name: 'LexerError',
				message: message,
				line: line,
				column: column,
				source: this.source
			});
			throw err;
		}
	});

	if (typeof Symbol !== 'undefined') {

		/**
	  * Implements the iterable protocol.
	  */

		LexerPrototype[Symbol.iterator] = function () {
			return this;
		};
	}

	function createLex(accessor, tokenType) {
		return function lexing() {
			var position = this.position;
			var regex = this[accessor];
			var match = void 0;

			if (!this.useStickyRegex) {
				regex.lastIndex = 0;
			}

			if (match = regex.exec(this.input)) {
				var _match = match;
				var str = _match['0'];


				this.forward(position, str.length, regex.lastIndex);

				return {
					type: tokenType !== undefined ? tokenType : str,
					value: str,
					line: this.line,
					column: this.column,
					start: position,
					end: this.position
				};
			}

			return null;
		};
	}

	assign(LexerPrototype, _defineProperty({

		/**
	  * Advances the lexer's position  and column based on whether or
	  * not the lexer is using sticky regex.
	  *
	  * @param {Number} start     - The starting position before lexing
	  * @param {Number} length    - The length of the matched string
	  * @param {Number} lastIndex - The lastIndex of the regex that matched
	  */

		forward: function forward(start, length, lastIndex) {
			if (!this.useStickyRegex) {
				this.input = this.input.substring(length, this.inputLength);
				this.position = start + length;
			} else {
				this.position = lastIndex;
			}

			this.column = this.column + length;
		},


		getNumericLiteraloken: createLex('NumericLiteral', TokenNumericLiteral),

		getStringLiteralToken: createLex('StringLiteral', TokenStringLiteral),

		getIdentifierNameToken: createLex('IdentifierName', TokenIdentifier),

		getPunctuatorToken: createLex('Punctuator', TokenPunctuator)

	}, 'getIdentifierNameToken', function getIdentifierNameToken() {
		var position = this.position;
		var regex = this.IdentifierName;
		var match = void 0;

		if (!this.useStickyRegex) {
			regex.lastIndex = 0;
		}

		if (match = regex.exec(this.input)) {
			var _match2 = match;
			var str = _match2['0'];


			this.forward(position, str.length, regex.lastIndex);

			return {
				type: keywords.hasOwnProperty(str) ? TokenKeyword : TokenIdentifier,
				value: str,
				line: this.line,
				column: this.column,
				start: position,
				end: this.position
			};
		}

		return null;
	}));

	/**
	 * Constructs regular expressions on a given object
	 *
	 * @param {Boolean} useStickyRegex
	 * @return {this}
	 */

	function getRegexes(useStickyRegex) {
		var prefix = !useStickyRegex ? '^' : '';
		var flags = useStickyRegex ? 'y' : 'g';

		this.Punctuator = new RegExp(prefix + Punctuator.source, flags);
		this.NumericLiteral = new RegExp(prefix + NumericLiteral.source, flags);
		this.StringLiteral = new RegExp(prefix + StringLiteral.source, flags);
		this.ReservedWord = new RegExp(prefix + ReservedWord.source, flags);
		this.IdentifierName = new RegExp(prefix + IdentifierName.source, flags);

		return this;
	}

	module.exports = Lexer;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
		createSourceError: createSourceError,
		replace: replace,
		count: count
	};

	var padStart = __webpack_require__(5);
	var repeat = __webpack_require__(6);

	var POINTER = '> ';

	/**
	 * An alternate to template strings.
	 *
	 * @example
	 *   replace('Unexpected token "{token}"', { token: 'for' });
	 *   // 'Unexpected token "for"'
	 *
	 * @param  {String} data
	 * @param  {Object} replacers
	 * @return {String}
	 */

	function replace(data, replacers) {
		for (var str in replacers) {
			data = data.replace(new RegExp('{' + str + '}', 'g'), replacers[str]);
		}

		return data;
	}

	/**
	 * Creates an error that points to the line and column the error occured.
	 * If the `line` option is not passed, only the error message passed will
	 * be shown.
	 *
	 * @param  {Object} options
	 * @param  {Object} options.name - The error objects name
	 * @param  {Object} [options.line]
	 * @param  {Object} [options.column]
	 * @param  {Object} [options.filename]
	 * @return {Error}
	 */

	var toLine = function toLine(num) {
		return num + 1;
	};

	function createSourceError(options) {
		var name = options.name;
		var _line = options.line;
		var column = options.column;
		var source = options.source;
		var _options$message = options.message;
		var message = _options$message === undefined ? '' : _options$message;
		var _options$filename = options.filename;
		var filename = _options$filename === undefined ? '[Source]' : _options$filename;


		var isLineDefined = typeof _line === 'number' && isFinite(_line);
		var isColumnNumber = typeof column === 'number' && column === column;
		var tolerance = 3;
		var errorMessage = void 0;

		if (isLineDefined) {
			(function () {
				// TODO: Might want to optimize this in case the string is large
				var lines = source.split('\n');
				var length = lines.length;

				// Restrict the line to be between 0 and the total number of lines
				var line = Math.min(lines.length, Math.max(_line, 1));

				var _start = Math.min(length - tolerance, Math.max(line - tolerance - 1));
				var start = Math.max(_start, 0);
				var end = Math.min(length, line + tolerance);

				// Pointer line can not be more or less than the start
				var pointerLine = Math.max(start, Math.min(line, end));

				var linecol = isLineDefined ? ' (' + pointerLine + ':1)' : '';
				var header = filename + ': ' + message + linecol + '\n';
				var padding = lines.length.toString().length + POINTER.length;

				errorMessage = header + lines.slice(start, end).map(function (text, index) {
					var currentLine = start + index + 1;
					var beginning = String(currentLine);
					var leadingSpace = void 0;
					var arrowSpacing = void 0;

					if (currentLine === pointerLine) {
						beginning = POINTER + beginning;

						if (isColumnNumber) {
							leadingSpace = repeat(' ', padding + 1);
							arrowSpacing = repeat(' ', Math.max(0, column));
							text = text + '\n' + leadingSpace + ' ' + arrowSpacing + '^';
						}
					}

					return padStart(beginning, padding, ' ') + ' | ' + text + '\n';
				}).join('');
			})();
		} else {
			errorMessage = message;
		}

		var err = new Error(errorMessage);
		err.message = errorMessage;
		err.name = name;
		return err;
	}

	/**
	 * Counts the number of occurences of a string.
	 *
	 * @param {String} str The string to count the occurrences.
	 */

	function count(str, substr) {
		var index = str.indexOf(substr);
		var occurrences = 0;

		while (index !== -1) {
			index = str.indexOf(substr, index + 1);
			occurrences = occurrences + 1;
		}

		return occurrences;
	}

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	module.exports = function (string, maxLength, fillString) {

	  if (string == null || maxLength == null) {
	    return string;
	  }

	  var result    = String(string);
	  var targetLen = typeof maxLength === 'number'
	    ? maxLength
	    : parseInt(maxLength, 10);

	  if (isNaN(targetLen) || !isFinite(targetLen)) {
	    return result;
	  }


	  var length = result.length;
	  if (length >= targetLen) {
	    return result;
	  }


	  var fill = fillString == null ? '' : String(fillString);
	  if (fill === '') {
	    fill = ' ';
	  }


	  var fillLen = targetLen - length;

	  while (fill.length < fillLen) {
	    fill += fill;
	  }

	  var truncated = fill.length > fillLen ? fill.substr(0, fillLen) : fill;

	  return truncated + result;
	};


/***/ },
/* 6 */
/***/ function(module, exports) {

	/*!
	 * repeat-string <https://github.com/jonschlinkert/repeat-string>
	 *
	 * Copyright (c) 2014-2015, Jon Schlinkert.
	 * Licensed under the MIT License.
	 */

	'use strict';

	/**
	 * Results cache
	 */

	var res = '';
	var cache;

	/**
	 * Expose `repeat`
	 */

	module.exports = repeat;

	/**
	 * Repeat the given `string` the specified `number`
	 * of times.
	 *
	 * **Example:**
	 *
	 * ```js
	 * var repeat = require('repeat-string');
	 * repeat('A', 5);
	 * //=> AAAAA
	 * ```
	 *
	 * @param {String} `string` The string to repeat
	 * @param {Number} `number` The number of times to repeat the string
	 * @return {String} Repeated string
	 * @api public
	 */

	function repeat(str, num) {
	  if (typeof str !== 'string') {
	    throw new TypeError('repeat-string expects a string.');
	  }

	  // cover common, quick use cases
	  if (num === 1) return str;
	  if (num === 2) return str + str;

	  var max = str.length * num;
	  if (cache !== str || typeof cache === 'undefined') {
	    cache = str;
	    res = '';
	  }

	  while (max > res.length && num > 0) {
	    if (num & 1) {
	      res += str;
	    }

	    num >>= 1;
	    if (!num) break;
	    str += str;
	  }

	  return res.substr(0, max);
	}



/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';

	/* Generated from ./regex.js */

	exports.Punctuator = /(?:>>>=|>>>|===|!==|\.\.\.|\*\*=|<<=|>>=|\*\*|\+\+|--|<<|>>|&&|>=|\+=|-=|\*=|==|%=|!=|\/=|<=|&=|\|=|\^=|=>|\|\||\||\^|!|~|\]|\.|\?|:|=|\{|;|\+|-|\*|,|%|<|>|\)|\[|\(|\/|&|\})/;

	exports.NumericLiteral = /(?:(?:0x[0-9A-Fa-f]+|0X[0-9A-Fa-f]+)|(?:0[Oo][0-7]+)|(?:0[Bb][01]+)|(?:(?:0|[1-9](?:[0-9]+)?)\.(?:[0-9]+)?|\.[0-9]+|(?:0|[1-9](?:[0-9]+)?))(?:[Ee](?:[\+\-][0-9]+))?)/;

	exports.StringLiteral = /(?:'(?:(?:\\(?:(?:["'\\bfnrtv]|(?:[\0-\t\x0B\f\x0E-!#-&\(-/:-\[\]-ac-eg-mo-qswy-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|x[0-9A-Fa-f]{2}|(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))|(?:(?:[\0-\t\x0B\f\x0E-&\(-\[\]-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])|\\(?:(?:["'\\bfnrtv]|(?:[\0-\t\x0B\f\x0E-!#-&\(-/:-\[\]-ac-eg-mo-qswy-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|x[0-9A-Fa-f]{2}|(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))|\\(?:\r\n|[\n\r]))|\\(?:\r\n|[\n\r]))+)?')|(?:"(?:(?:\\(?:(?:["'\\bfnrtv]|(?:[\0-\t\x0B\f\x0E-!#-&\(-/:-\[\]-ac-eg-mo-qswy-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|x[0-9A-Fa-f]{2}|(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))|(?:(?:[\0-\t\x0B\f\x0E-!#-\[\]-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])|\\(?:(?:["'\\bfnrtv]|(?:[\0-\t\x0B\f\x0E-!#-&\(-/:-\[\]-ac-eg-mo-qswy-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|x[0-9A-Fa-f]{2}|(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))|\\(?:\r\n|[\n\r]))|\\(?:\r\n|[\n\r]))+)?")/;

	// exports.Template        = /(?:`(?:(?:\$(?!\{)|\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n])|(?:\r\n|[\r\n])|[^`\\$\n\r])+)?`|`(?:(?:\$(?!\{)|\\(?:(?:['"\\bfnrtv]|[^'"\\bfnrtv0-9ux\n\r])|x[0-9a-fA-F]{2}|(?:u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]{4}\}))|\\(?:\r\n|[\r\n])|(?:\r\n|[\r\n])|[^`\\$\n\r])+)?\$\{)/u;

	exports.ReservedWord = /(?:(?:instanceof|function|debugger|continue|default|extends|finally|delete|export|import|typeof|return|switch|const|throw|while|yield|catch|super|class|break|case|void|this|with|else|var|new|for|try|if|do|in)|null|(?:true|false))/;

	exports.IdentifierName = /(?:(?:[\$A-Z_a-z]|\\(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))(?:[\$0-9A-Z_a-z\u200C\u200D]|\\(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))*)/;

/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	var a = 0;
	var id = function id() {
	  return a++;
	};

	exports.TokenNumericLiteral = id();
	exports.TokenStringLiteral = id();
	exports.TokenIdentifier = id();
	exports.TokenKeyword = id();
	exports.TokenPunctuator = id();

/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	var sortLongest = function sortLongest(a, b) {
		return b.length - a.length;
	};

	var punctuators = ['{', '(', ')', '[', ']', '.', '...', ';', ',', '<', '>', '<=', '>=', '==', '!=', '===', '!==', '+', '-', '*', '**', '%', '++', '--', '<<', '>>', '>>>', '&', '|', '^', '!', '~', '&&', '||', '?', ':', '=', '+=', '-=', '*=', '**=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '=>', '/', '/=', '}'].sort(sortLongest);

	var keywords = ['break', 'do', 'in', 'typeof', 'case', 'else', 'instanceof', 'var', 'catch', 'export', 'new', 'void', 'class', 'extends', 'return', 'while', 'const', 'finally', 'super', 'with', 'continue', 'for', 'switch', 'yield', 'debugger', 'function', 'this', 'default', 'if', 'throw', 'delete', 'import', 'try'].sort(sortLongest);

	var assignment = {
		'=': true,
		'*=': true,
		'/=': true,
		'%=': true,
		'+=': true,
		'-=': true,
		'<<=': true,
		'>>=': true,
		'>>>=': true,
		'&=': true,
		'^=': true,
		'|=': true,
		'**=': true
	};

	module.exports = {
		keywords: keywords,
		punctuators: punctuators,
		assignment: assignment
	};

/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict';

	function walk(ast) {
		var handlers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		recurse(ast, null);

		function recurse(node, parent, override) {
			if (node === null && parent && 'ArrayExpression' === parent.type) {
				return;
			}

			var type = override || node.type;
			var handler = handlers[type];

			if (visitors[type] === undefined) {
				throw new Error('Unrecogenized node ' + type);
			}

			visitors[type](node, recurse);

			if (handler) {
				handler(node, parent);
			}
		}
	}

	var visitors = {

		ThisExpression: noop,

		Literal: noop,

		Identifier: noop,

		SequenceExpression: loop('expressions'),

		SpreadElement: function SpreadElement(node, recurse) {
			recurse(node.argument, node);
		},
		NewExpression: function NewExpression(node, recurse) {
			recurse(node.callee, node);
			visitors.Arguments(node.arguments, node, recurse);
		},
		CallExpression: function CallExpression(node, recurse) {
			recurse(node.callee, node);
			visitors.Arguments(node.arguments, node, recurse);
		},
		MemberExpression: function MemberExpression(node, recurse) {
			recurse(node.object, node);
			recurse(node.property, node);
		},
		YieldExpression: function YieldExpression(node, recurse) {
			recurse(node.argument, node);
		},


		ArrayExpression: loop('elements'),

		// ArrayExpression(node, recurse) {
		// 	const elements = node.elements;
		// 	for (var i = 0; i < elements.length; i++) {
		// 		if (elements[i] !== null) {

		// 		}
		// 	}
		// },

		Property: function Property(node, recurse) {
			recurse(node.key, node);

			if (node.value) {
				recurse(node.value, node);
			}
		},


		ObjectExpression: loop('properties'),

		UpdateExpression: function UpdateExpression(node, recurse) {
			recurse(node.argument, node);
		},
		UnaryExpression: function UnaryExpression(node, recurse) {
			recurse(node.argument, node);
		},
		LogicalExpression: function LogicalExpression(node, recurse) {
			recurse(node.left, node);
			recurse(node.right, node);
		},
		BinaryExpression: function BinaryExpression(node, recurse) {
			recurse(node.left, node);
			recurse(node.right, node);
		},
		Arguments: function Arguments(items, parent, recurse) {
			for (var i = 0; i < items.length; i++) {
				recurse(items[i], parent);
			}
		},
		ArrowExpression: function ArrowExpression(node, recurse) {
			visitors.Arguments(node.parameters, node, recurse);
			recurse(node.body, node);
		},
		ConditionalExpression: function ConditionalExpression(node, recurse) {
			recurse(node.test, node);
			recurse(node.consequent, node);
			recurse(node.alternate, node);
		},
		AssignmentExpression: function AssignmentExpression(node, recurse) {
			recurse(node.left, node);
			recurse(node.right, node);
		},
		ExpressionStatement: function ExpressionStatement(node, recurse) {
			recurse(node.expression, node);
		},


		Program: loop('body')

	};

	function loop(prop) {
		return function (node, recurse) {
			var items = node[prop];
			var length = items.length;

			for (var i = 0; i < length; i++) {
				recurse(items[i], node);
			}
		};
	}

	function noop() {}

	module.exports = {
		walk: walk,
		visitors: visitors
	};

/***/ }
/******/ ])
});
;