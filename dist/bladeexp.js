(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Bladexp"] = factory();
	else
		root["Bladexp"] = factory();
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

	var Lexer = __webpack_require__(2);
	var walk = __webpack_require__(9).walk;

	var _require = __webpack_require__(7);

	var TokenKeyword = _require.TokenKeyword;
	var TokenIdentifier = _require.TokenIdentifier;
	var TokenPunctuator = _require.TokenPunctuator;
	var TokenNullLiteral = _require.TokenNullLiteral;
	var TokenBooleanLiteral = _require.TokenBooleanLiteral;
	var TokenStringLiteral = _require.TokenStringLiteral;
	var TokenNumericLiteral = _require.TokenNumericLiteral;

	var _require2 = __webpack_require__(8);

	var assignment = _require2.assignment;
	var simpleop = _require2.simpleop;

	var _require3 = __webpack_require__(3);

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

	var UnsupportedFunctionBody = 'Unsupported function body';
	var UnsupportedClass = 'Class expressions are not supported';
	var UnsupportedFunction = 'Function expressions are not supported';
	var UnsupportedMeta = 'Meta expressions are not supported';
	var UnsupportedSuper = '"super" expressions are not supported';

	var ES7_TRAILING_COMMA = 'es7_trailing_comma';

	var Raw = {
	  null: null,
	  true: true,
	  false: false
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

	function getRaw(value, type) {
	  // eslint-disable-next-line no-undef-init
	  var raw = undefined;

	  if (type === TokenStringLiteral) {
	    raw = value.slice(1, -1);
	  } else if (type === TokenNumericLiteral) {
	    raw = Number(value);
	  } else if (type === TokenBooleanLiteral || type === TokenNullLiteral) {
	    raw = Raw[value];
	  }

	  return raw;
	}

	function isUnaryOperator(token) {
	  var value = '';

	  if (token) {
	    value = token.value;
	  } else {
	    return false;
	  }

	  if (TokenPunctuator !== token.type && TokenKeyword !== token.type) {
	    return false;
	  }

	  return value === '+' || value === '-' || value === '!' || value === 'void' || value === '~' || value === 'delete' || value === 'typeof';
	}

	/**
	 * Returns the precedence of the operator passed or 0 if the
	 * token is not an operator.
	 *
	 * @param  {Object} token
	 * @return {Number}
	 */

	// function precedence(token, acceptIn) {
	function precedence(token) {
	  if (token === null) {
	    return 0;
	  }

	  // FIXME: Not sure when acceptIn is supposed to be false
	  // if (token.value === 'in' && ! acceptIn) {
	  //  return 0;
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

	// /**
	//  * Returns true if the token is a valid property name.
	//  *
	//  * @param  {Object}  token
	//  * @return {Boolean}
	//  */

	// function isValidPropertyName(token) {
	//   const type = token.type;
	//   const value = token.value;

	//   if (TokenIdentifier === type) {
	//     return true;
	//   }

	//   return type === TokenNullLiteral || type === TokenBooleanLiteral;
	// }

	function isValidSimpleAssignmentTargetAssign(node, strict) {
	  if (node.type === 'Identifier') {
	    if (strict && isValdSimpleAssignmentTargetIdentifier(node.name)) {
	      return false;
	    }

	    return true;
	  } else if (node.type === 'MemberExpression') {
	    return true;
	  }

	  return false;
	}

	function isValidSimpleAssignmentTargetUpdate(node) {
	  // FIXME: What is isObject for?
	  // const isObject = node.type === 'ArrayExpression' || node.type === 'ObjectExpression';

	  return isValidSimpleAssignmentTargetAssign(node);
	}

	// function isValidSimpleAssignmentTargetArguments(node) {
	//   return isValidSimpleAssignmentTargetAssign(node);
	// }

	/**
	 * #sec-identifiers-static-semantics-early-errors
	 */

	function isValdSimpleAssignmentTargetIdentifier(name) {
	  return name === 'eval' || name === 'arguments';
	}

	// /**
	//  * Returns true if the expression possibly has binding identifiers.
	//  */

	// function isBinding(expr) {
	//   const type = expr.type;

	//   return (
	//          'Identifier'       === type
	//       || 'SpreadElement'    === type
	//       || 'ArrayExpression'  === type
	//       || 'ObjectExpression' === type
	//     );
	// }

	var CONDITIONAL_PRECEDENCE = 4;

	function Literal(value, raw, start, end) {
	  this.type = 'Literal';
	  this.value = value;
	  this.raw = raw;
	  this.start = start;
	  this.end = end;
	}

	function Identifier(name, start, end) {
	  this.type = 'Identifier';
	  this.name = name;
	  this.start = start;
	  this.end = end;
	}

	function SpreadElement(expr, start, end) {
	  this.type = 'SpreadElement';
	  this.argument = expr;
	  this.start = start;
	  this.end = end;
	}

	function ThisExpression(start, end) {
	  this.type = 'ThisExpression';
	  this.start = start;
	  this.end = end;
	}

	function SequenceExpression(body, start, end) {
	  this.type = 'SequenceExpression';
	  this.expressions = body;
	  this.start = start;
	  this.end = end;
	}

	function NewExpression(callee, args, start, end) {
	  this.type = 'NewExpression';
	  this.callee = callee;
	  this.arguments = args;
	  this.start = start;
	  this.end = end;
	}

	function CallExpression(callee, args, start, end) {
	  this.type = 'CallExpression';
	  this.callee = callee;
	  this.arguments = args;
	  this.start = start;
	  this.end = end;
	}

	function MemberExpression(object, property, computed, start, end) {
	  this.type = 'MemberExpression';
	  this.object = object;
	  this.property = property;
	  this.computed = computed;
	  this.start = start;
	  this.end = end;
	}

	function YieldExpression(argument, delegates, start, end) {
	  this.type = 'YieldExpression';
	  this.argument = argument;
	  this.delegates = delegates;
	  this.start = start;
	  this.end = end;
	}

	function ArrayExpression(elements, start, end) {
	  this.type = 'ArrayExpression';
	  this.elements = elements;
	  this.start = start;
	  this.end = end;
	}

	function Property(shorthand, kind, computed, method, key, value, start, end) {
	  this.type = 'Property';
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
	  this.type = 'ObjectExpression';
	  this.properties = properties;
	  this.start = start;
	  this.end = end;
	}

	function UpdateExpression(operator, argument, isPrefix, start, end) {
	  this.type = 'UpdateExpression';
	  this.operator = operator;
	  this.argument = argument;
	  this.prefix = isPrefix;
	  this.start = start;
	  this.end = end;
	}

	function UnaryExpression(operator, argument, start, end) {
	  this.type = 'UnaryExpression';
	  this.operator = operator;
	  this.argument = argument;
	  this.prefix = true;
	  this.start = start;
	  this.end = end;
	}

	function LogicalExpression(operator, left, right, start, end) {
	  this.type = 'LogicalExpression';
	  this.operator = operator;
	  this.left = left;
	  this.right = right;
	  this.start = start;
	  this.end = end;
	}

	function BinaryExpression(operator, left, right, start, end) {
	  this.type = 'BinaryExpression';
	  this.operator = operator;
	  this.left = left;
	  this.right = right;
	  this.start = start;
	  this.end = end;
	}

	function ArrowExpression(parameters, defaults, rest, body, generator, start, end) {
	  this.type = 'ArrowExpression';
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
	  this.type = 'ConditionalExpression';
	  this.test = test;
	  this.consequent = consequent;
	  this.alternate = alternate;
	  this.start = start;
	  this.end = end;
	}

	function AssignmentExpression(operator, left, right, start, end) {
	  this.type = 'AssignmentExpression';
	  this.operator = operator;
	  this.left = left;
	  this.right = right;
	  this.start = start;
	  this.end = end;
	}

	function ExpressionStatement(expr, start, end) {
	  this.type = 'ExpressionStatement';
	  this.expression = expr;
	  this.start = start;
	  this.end = end;
	}

	function Program(body) {
	  this.type = 'Program';
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
	    return new _Parser(data, options);
	  },


	  /**
	   * Parses the data string and returns the AST.
	   */

	  parse: function parse(data, options) {
	    return Parser.create(data, options).parse();
	  },


	  walk: walk,

	  Lexer: Lexer

	};

	var objnoop = Object.freeze({});

	function _Parser(data, opts) {
	  var options = opts || objnoop;
	  var _options$throwSourceE = options.throwSourceError;
	  var throwSourceError = _options$throwSourceE === undefined ? true : _options$throwSourceE;
	  var _options$consumeLeast = options.consumeLeast;
	  var consumeLeast = _options$consumeLeast === undefined ? false : _options$consumeLeast;
	  var _options$allowDelimit = options.allowDelimited;
	  var allowDelimited = _options$allowDelimit === undefined ? false : _options$allowDelimit;
	  var _options$context = options.context;
	  var context = _options$context === undefined ? objnoop : _options$context;


	  this.context = context;
	  this.lexer = Lexer.create(data);
	  this.hasMore = false;
	  this.consumeLeast = consumeLeast;
	  this.throwSourceError = throwSourceError;
	  this.allowDelimited = allowDelimited;
	}

	_Parser.prototype = {

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

	  ensure: function ensure() {
	    var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
	    var last = arguments[1];

	    var token = null;

	    if (index === undefined) {
	      token = this.peek();
	    } else {
	      token = this.lexer.lookahead(index);
	    }

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
	    var token = this.peek();

	    while (token !== null) {
	      token = this.peek();

	      if (token === null) {
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
	    var name = 'ParseError';
	    var line = null;
	    var column = null;
	    var type = null;
	    var err = null;
	    var errorMessage = message;

	    if (token && token.value) {
	      if (message === UnexpectedToken && typeTranslation[token.type]) {
	        errorMessage = UnexpectedType;
	        type = typeTranslation[token.type];
	      }
	    }

	    var hasPosition = token && isFinite(token.line) && isFinite(token.column);

	    if (hasPosition) {
	      column = token.column;
	      line = token.line;
	    }

	    errorMessage = replace(errorMessage, {
	      token: '"' + value + '"',
	      expression: expr,
	      type: type
	    });

	    err = createSourceError({
	      name: name,
	      line: line,
	      column: column,
	      showSource: this.throwSourceError && hasPosition,
	      source: this.source,
	      message: errorMessage
	    });

	    throw err;
	  },


	  get source() {
	    return this.lexer.source;
	  },

	  // ParsingFunctions
	  // ------------------------------------------------

	  /**
	   * Rewrites object and array expressions as destructuring.
	   */

	  rewriteNonPattern: function rewriteNonPattern(body) {
	    for (var i = 0; i < body.length; i++) {
	      var expr = body[i];

	      if (expr.type === 'ArrayExpression' || expr.type === 'ObjectExpression') {
	        this.error('Destructuring not yet supported');
	      }
	    }

	    return body;
	  },
	  parseArrowRemains: function parseArrowRemains(parameters, defaults, rest, start) {
	    // The expression was arrow parameters
	    this.expect('=>');
	    var body = this.parseFunctionBody(true);
	    var params = parameters;

	    if (parameters.length) {
	      params = this.rewriteNonPattern(parameters);
	    }

	    return new ArrowExpression(params, null, rest, body, false, start, body.end);
	  },
	  parseSequenceExpression: function parseSequenceExpression() {
	    var token = this.expect('(');
	    var defaults = null;
	    var body = [];
	    var restToken = null;
	    var rest = null;
	    var node = null;
	    var expr = null;

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

	        if (_token2 && _token2.valule === ')' && !this.feature(ES7_TRAILING_COMMA)) {
	          this.error('UnexpectedToken', this.peek());
	        }
	      } else {
	        break;
	      }
	    }

	    this.expect(')');

	    var hasArrow = this.match('=>');

	    if (!hasArrow && rest) {
	      this.error(UnexpectedToken, restToken);
	    }

	    if (hasArrow) {
	      node = this.parseArrowRemains(body, defaults, rest, token.start);
	    } else if (body.length > 1) {
	      // FIXME: Start is undefined, no code coverage
	      // node = new SequenceExpression(body, start, end);
	    } else {
	      node = expr;
	    }

	    return node;
	  },


	  /**
	   * Parses identifiers. nextToken() should not return null here.
	   */

	  parseIdentifier: function parseIdentifier() {
	    var token = this.nextToken();

	    return new Identifier(token.value, token.start, token.end);
	  },
	  parsePrimaryExpression: function parsePrimaryExpression() {
	    var token = this.peek();
	    var strict = this.context.strict;

	    var node = null;

	    if (token === null) {
	      this.error(UnexpectedEnd);
	    }

	    var type = token.type;
	    var value = token.value;
	    var start = token.start;
	    var end = token.end;

	    if (type === TokenNullLiteral || type === TokenBooleanLiteral || type === TokenNumericLiteral || type === TokenStringLiteral) {
	      this.nextToken();
	      node = new Literal(value, getRaw(value, type), start, end);
	    } else if (type === TokenIdentifier) {
	      if (strict && isValdSimpleAssignmentTargetIdentifier(value)) {
	        this.error(UnexpectedStrictEvalOrArguments, token);
	      }

	      node = this.parseIdentifier();
	    } else if (type === TokenKeyword) {
	      switch (value) {
	        case 'this':
	          node = new ThisExpression(start, end);
	          this.nextToken();
	          break;
	        case 'function':
	          this.error(UnsupportedFunction, token);
	          break;
	        case 'class':
	          this.error(UnsupportedClass, token);
	          break;
	        case 'yield':
	          if (this.context.strict) {
	            this.error(UnexpectedStrictReservedWord, token);
	          }

	          node = this.parseIdentifier();
	          break;
	        default:
	          this.error(UnexpectedToken, token);
	      }
	    } else if (type === TokenPunctuator) {
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
	    }

	    if (node === null) {
	      this.error(UnexpectedToken, token);
	    }

	    return node;
	  },
	  parseSpreadElement: function parseSpreadElement(assertIdentifier) {
	    var token = this.expect('...');
	    var begin = this.peek();
	    var expr = this.parseAssignmentExpression();
	    var start = token.start;
	    var end = expr.end;

	    if (assertIdentifier) {
	      if (expr.type !== 'Identifier') {
	        this.error(UnexpectedToken, begin);
	      }
	    }

	    return new SpreadElement(expr, start, end);
	  },
	  parseArrayLiteral: function parseArrayLiteral() {
	    var begin = this.expect('[');
	    var elements = [];
	    var end = null;

	    while (!this.match(']')) {
	      var token = this.peek();
	      var value = '';

	      if (!token) {
	        this.error(UnexpectedEnd, begin);
	      }

	      value = token.value;

	      if (value === ',') {
	        this.nextToken();
	        elements.push(null);
	      } else {
	        if (value === '...') {
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

	      if (!token) {
	        this.error(UnexpectedEnd, begin);
	      }

	      var start = token.start;
	      var shorthand = false;
	      var computed = false;
	      var method = false;
	      var value = null;
	      var key = null;
	      var _end = null;
	      var kind = 'init';

	      if (token.value === '[') {
	        this.nextToken();
	        key = this.parseAssignmentExpression();
	        computed = true;
	        this.expect(']');
	        this.expect(':');
	        value = this.parseAssignmentExpression();
	        _end = value.end;
	      } else if (TokenIdentifier === token.type) {
	        key = this.parseIdentifier();

	        var nextToken = this.peek();

	        if (nextToken) {
	          if (nextToken.value === '=') {
	            this.error('Initializer is not supported');
	          } else if (nextToken.value === '(') {
	            this.error('Method definitions are not supported');
	          } else if (nextToken.value === ':') {
	            this.nextToken();
	            value = this.parseAssignmentExpression();
	            _end = value.end;
	          } else {
	            // FIXME: This is probably a semantic error if the
	            //        key is not na identifier
	            shorthand = true;
	            value = key;
	            _end = token.end;
	          }
	        }
	      } else if (token.type === TokenStringLiteral || token.type === TokenNumericLiteral) {
	        this.nextToken();
	        key = new Literal(token.value, getRaw(token.value, token.type), token.start, token.end);
	        this.expect(':');
	        value = this.parseAssignmentExpression();
	        _end = value.end;
	      } else {
	        this.error(UnexpectedToken, begin);
	      }

	      var property = new Property(shorthand, kind, computed, method, key, value, start, _end);

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

	    return this.error(UnexpectedToken, this.peek());
	  },
	  parseArguments: function parseArguments() {
	    this.expect('(');
	    var args = [];
	    var token = this.peek();

	    if (token && token.value !== ')') {
	      /* eslint-disable no-constant-condition */
	      while (true) {
	        if (this.match('...')) {
	          var expr = this.parseAssignmentExpression();

	          args.push(new SpreadElement(expr));
	          this.expect(')');
	          break;
	        } else {
	          args.push(this.parseAssignmentExpression());
	        }

	        if (this.match(')') === false) {
	          this.expect(',');
	        } else {
	          break;
	        }
	      }
	    }
	    /* eslint-enable no-constant-condition */

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
	    var token = null;

	    /* eslint-disable no-param-reassign */
	    while (token = this.peek()) {
	      var value = token.value;

	      if (value === '.') {
	        this.nextToken();

	        var property = this.parseNonComputedProperty();

	        object = new MemberExpression(object, property, false, object.start, property.end);
	      } else if (value === '[') {
	        this.nextToken();

	        var argument = this.parseExpression();
	        var end = this.expect(']').end;

	        object = new MemberExpression(object, argument, true, object.start, end);
	      } else if (withArguments && value === '(') {
	        var args = this.parseArguments();
	        var _end2 = this.expect(')').end;

	        object = new CallExpression(object, args, object.start, _end2);
	      } else {
	        break;
	      }
	    }

	    /* eslint-enable no-param-reassign */

	    return object;
	  },
	  parseLHSExpressionWithArgs: function parseLHSExpressionWithArgs() {
	    var token = this.peek();
	    var expr = null;

	    if (!token) {
	      this.error(UnexpectedEnd);
	    }

	    if (token.value === 'new') {
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
	    var expr = null;

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
	    var token = null;
	    var node = null;

	    if (!begin) {
	      this.error(UnexpectedEnd);
	    }

	    if (begin.value === '++' || begin.value === '--') {
	      this.nextToken();

	      var expr = this.parseUnaryExpression();

	      node = new UpdateExpression(begin.value, expr, true, begin.start, expr.end);
	    } else {
	      node = this.parseLHSExpressionWithArgs();
	    }

	    while (token = this.peek()) {
	      if (token.value === '++' || token.value === '--') {
	        if (this.hasNewlineBetween(node, token)) {
	          return node;
	        }

	        this.nextToken();
	        node = new UpdateExpression(token.value, node, false, node.start, token.end);

	        if (!isValidSimpleAssignmentTargetUpdate(node.argument)) {
	          this.error(InvalidLHSAssignmentPostfix, token);
	        }
	      } else {
	        break;
	      }
	    }

	    return node;
	  },
	  parseUnaryExpression: function parseUnaryExpression() {
	    var token = this.peek();
	    var value = '';
	    var type = null;

	    var primary = this.checkSimplePrimary(token);

	    if (primary !== null) {
	      return primary;
	    }

	    // FIXME: I think this should error out in parsePrimaryExpression
	    //        Maybe change this.error to this.parseUpdateExpression();
	    if (token) {
	      value = token.value;
	      type = token.type;
	    }

	    if (TokenPunctuator === type && (value === '++' || value === '--')) {
	      // token is prefixed update expression
	      var expr = this.parseUpdateExpression();

	      if (!isValidSimpleAssignmentTargetUpdate(expr.argument)) {
	        this.error(InvalidLHSAssignmentPrefix, token);
	      }

	      return expr;
	    } else if (isUnaryOperator(token)) {
	      this.nextToken();

	      var _expr = this.parseUnaryExpression();

	      if (this.context.strict && value === 'delete' && _expr.type === 'Identifier') {
	        // #sec-delete-operator-static-semantics-early-errors
	        this.error(StrictDelete, token);
	      }

	      return new UnaryExpression(value, _expr, token.start, _expr.end);
	    }

	    return this.parseUpdateExpression();
	  },


	  /**
	   * Copyright 2014, the V8 project authors. All rights reserved.
	   *
	   * https://github.com/nodejs/node/blob/91b40944a41f8ab1e499ed5bebeed520a215b9a5/deps/v8/src/parsing/parser-base.h#L2675
	   */

	  parseBinaryExpression: function parseBinaryExpression(prec) {
	    var left = this.parseUnaryExpression();
	    var token = this.peek();
	    var right = null;
	    var Fn = null;

	    // NOTE: Not sure if this is the best way to do this
	    // Catch JS keywords that are not valid

	    if (token && TokenKeyword === token.type && !(token.value in operatorPrecedence)) {
	      this.error(UnexpectedToken, token);
	    }

	    for (var prec1 = precedence(this.peek()); prec1 >= prec; prec1--) {

	      while (precedence(this.peek()) === prec1) {
	        var operator = this.nextToken();
	        var op = operator.value;
	        var nextPrec = op === '**' ? prec1 : prec1 + 1;

	        right = this.parseBinaryExpression(nextPrec);

	        if (op === '||' || op === '&&') {
	          Fn = LogicalExpression;
	        } else {
	          Fn = BinaryExpression;
	        }

	        left = new Fn(op, left, right, left.start, right.end);
	      }
	    }

	    return left;
	  },
	  parseConditionalExpression: function parseConditionalExpression() {
	    var node = this.parseBinaryExpression(CONDITIONAL_PRECEDENCE);
	    var token = this.peek();

	    if (token && token.value === '?') {
	      this.nextToken();

	      var consequent = this.parseAssignmentExpression();

	      this.expect(':');

	      var alternate = this.parseAssignmentExpression();

	      node = new ConditionalExpression(node, consequent, alternate, node.start, alternate.end);
	    } else if (token && token.value === '=>') {
	      node = this.parseArrowRemains([node], null, null, node.start);
	    }

	    return node;
	  },


	  // #sec-generator-function-definitions

	  parseYieldExpression: function parseYieldExpression() {
	    var begin = this.expect('yield');
	    var start = begin.start;
	    var delegates = this.match('*');
	    var argument = null;

	    if (delegates) {
	      this.nextToken();
	    }

	    var token = this.peek();
	    var hasMore = !!(token && token.line === begin.line);

	    if (delegates || hasMore) {
	      argument = this.parseAssignmentExpression();
	    }

	    var end = argument ? argument.end : begin.end;

	    return new YieldExpression(argument, delegates, start, end);
	  },


	  /**
	   * TODO: #sec-assignment-operators-static-semantics-early-errors
	   */

	  parseAssignmentExpression: function parseAssignmentExpression() {
	    var node = null;

	    if (this.match('yield') && this.context.inGenerator) {
	      node = this.parseYieldExpression();
	    } else {
	      node = this.parseConditionalExpression(CONDITIONAL_PRECEDENCE);
	      var token = this.peek();

	      if (token && TokenPunctuator === token.type && isAssignment(token.value)) {

	        if (!isValidSimpleAssignmentTargetAssign(node, this.context.strict)) {
	          this.error(InvalidLHSAssignment);
	        }

	        this.nextToken();

	        var rhs = this.parseAssignmentExpression();

	        node = new AssignmentExpression(token.value, node, rhs, node.start, rhs.end);
	      }
	    }

	    return node;
	  },
	  checkSimplePrimary: function checkSimplePrimary(token, skipSimpleOperatorCheck) {
	    var lookahead = this.lexer.lookahead(2);

	    if (token && (skipSimpleOperatorCheck || lookahead && simpleop[lookahead.value])) {
	      var type = token.type;
	      var value = token.value;
	      var node = null;

	      if (type === TokenIdentifier) {
	        node = new Identifier(value, token.start, token.end);
	      } else if (type === TokenStringLiteral || type === TokenNumericLiteral || type === TokenBooleanLiteral || type === TokenNullLiteral) {

	        node = new Literal(value, getRaw(value, type), token.start, token.end);
	      }

	      if (node) {
	        this.nextToken();

	        return node;
	      }
	    }

	    return null;
	  },


	  /**
	   * #sec-expressions
	   */

	  parseExpression: function parseExpression() {
	    var lookahead = this.lexer.lookahead(2);
	    var begin = this.peek();

	    if (lookahead === null && begin) {
	      var node = this.checkSimplePrimary(begin, true);

	      if (node) {
	        return node;
	      }
	    }

	    var expr = this.parseAssignmentExpression();
	    var nextToken = this.peek();
	    var start = expr.start;

	    if (nextToken && TokenPunctuator === nextToken.type && nextToken.value === ',') {
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

	    // console.log(JSON.stringify(expr, null, 2));

	    if (this.allowDelimited && second && second.value === ';') {
	      this.nextToken();
	      this.hasMore = this.peek() !== null;
	    } else if (second && this.hasNewlineBetween(expr, second)) {
	      this.hasMore = true;
	    } else if (this.consumeLeast === true && second != null) {
	      this.hasMore = true;
	    } else if (second) {
	      this.error(UnexpectedToken, second);
	    } else {
	      this.hasMore = false;
	    }

	    return new ExpressionStatement(expr, first.start, expr.end);
	  },
	  parse: function parse() {
	    if (this.peek() === null) {
	      return new Program([]);
	    }

	    return new Program([this.parseExpressionStatement()]);
	  },


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

	};

	function parse(data, options) {
	  return Parser.create(data, options).parse();
	}

	Parser.parse = parse;

	module.exports = Parser;

	// console.log(JSON.stringify(parse('2 * 2'), null, 2));

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// module.exports = Lexer;

	var _require = __webpack_require__(3);

	var createSourceError = _require.createSourceError;


	var Regex = __webpack_require__(6);

	var _require2 = __webpack_require__(7);

	var TokenKeyword = _require2.TokenKeyword;
	var TokenIdentifier = _require2.TokenIdentifier;
	var TokenPunctuator = _require2.TokenPunctuator;
	var TokenNullLiteral = _require2.TokenNullLiteral;
	var TokenBooleanLiteral = _require2.TokenBooleanLiteral;
	var TokenStringLiteral = _require2.TokenStringLiteral;
	var TokenNumericLiteral = _require2.TokenNumericLiteral;

	var _require3 = __webpack_require__(8);

	var keywords = _require3.keywords;


	var Lexer = {

	  /**
	   * Creates a lexer object.
	   *
	   * @param  {Object} options
	   * @return {Object}
	   */

	  create: function create(data, options) {
	    return new _Lexer(data, options);
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
	    var token = null;

	    while (token = lexer.nextToken()) {
	      tokens.push(token);
	    }

	    return tokens;
	  },


	  _Lexer: _Lexer

	};

	/**
	 * Initiates a lexer object.
	 *
	 * @param {Object} options
	 * @param {String} options.data - The data to be lexed
	 * @param {String} options.customDirectives - Custom directives lex
	 * @return {this}
	 */

	var objnoop = Object.freeze({});

	function _Lexer(data, opts) {
	  var options = opts || objnoop;
	  var _options$throwSourceE = options.throwSourceError;
	  var throwSourceError = _options$throwSourceE === undefined ? true : _options$throwSourceE;

	  var source = data.charAt(0) === '\uFEFF' ? data.slice(1) : data;

	  this.line = 1;
	  this.column = 0;
	  this.position = 0;
	  this.stash = [];
	  this.source = this.input = source;
	  this.inputLength = this.source.length;
	  this.ended = false;
	  this.throwSourceError = throwSourceError;

	  return this;
	}

	_Lexer.prototype = {

	  /**
	   * Returns a token from the input or `null` if no tokens can be found.
	   *
	   * @return {Object|null}
	   */

	  lex: function lex() {
	    var token = null || this.getNullLiteralToken() || this.getBooleanLiteralToken() || this.getIdentifierNameToken() || this.getNumericLiteralToken() || this.getPunctuatorToken() || this.getStringLiteralToken();

	    if (token == null) {
	      this.lexError();
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

	    this.error('Unexpected token "' + char + '"', errorInfo);
	  },


	  /**
	   * Handles whitespace for when regex uses sticky flag
	   */

	  skipWhitespace: function skipWhitespace() {
	    var start = this.position;
	    var column = this.column;
	    var line = this.line;
	    var pos = start;
	    var skipped = 0;
	    var previousLine = line;
	    var char = '';

	    while (char = this.source[pos]) {
	      if (char === '\n') {
	        line = line + 1;
	      } else if (char === ' ' || char === '\t') {
	        // Keep on movin
	      } else if (char === '\r') {
	        if (this.source[pos + 1] === '\n') {
	          pos = pos + 1;
	          skipped = skipped + 1;
	        }
	      } else {
	        break;
	      }

	      pos = pos + 1;
	      skipped = skipped + 1;

	      if (line > previousLine) {
	        column = 0;
	      } else {
	        column = column + 1;
	      }

	      previousLine = line;
	    }

	    this.input = this.input.substring(skipped, this.inputLength);
	    this.position = start + skipped;
	    this.line = line;
	    this.column = column;
	  },
	  handleWhitespace: function handleWhitespace() {
	    this.skipWhitespace();

	    if (this.input.length === 0) {
	      this.ended = true;
	    }
	  },


	  /**
	   * Returns the token at `index` or `null` if there are no more tokens.
	   *
	   * @param  {Number} index - The number of tokens to look ahead
	   * @return {Object|null}
	   */

	  lookahead: function lookahead(index) {
	    var item = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : index;
	    var stash = this.stash;

	    var times = index - stash.length;
	    var token = null;

	    if (index < 1) {
	      this.error('Lookahead index must be more than 0');
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

	    return stash[item - 1] || null;
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
	    var token = null;

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
	   * Throws an error with the message passed.
	   *
	   * @param {String} message
	   */

	  error: function error(message) {
	    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    var line = _ref.line;
	    var column = _ref.column;

	    var err = createSourceError({
	      name: 'LexError',
	      message: message,
	      showSource: this.throwSourceError,
	      line: line,
	      column: column,
	      source: this.source
	    });

	    throw err;
	  },


	  /**
	   * Advances the lexer's position  and column based on whether or
	   * not the lexer is using sticky regex.
	   *
	   * @param {Number} start     - The starting position before lexing
	   * @param {Number} length    - The length of the matched string
	   * @return {Number} - The new position
	   */

	  forward: function forward(start, length) {
	    this.input = this.input.substring(length, this.inputLength);
	    this.position = start + length;
	    this.column = this.column + length;

	    return this.position;
	  },


	  getBooleanLiteralToken: createLex(Regex.BooleanLiteral, TokenBooleanLiteral),

	  getNullLiteralToken: createLex(Regex.NullLiteral, TokenNullLiteral),

	  getNumericLiteralToken: createLex(Regex.NumericLiteral, TokenNumericLiteral),

	  getStringLiteralToken: createLex(Regex.StringLiteral, TokenStringLiteral),

	  getPunctuatorToken: createLex(Regex.Punctuator, TokenPunctuator),

	  getIdentifierNameToken: function getIdentifierNameToken() {
	    var start = this.position;
	    var regex = Regex.IdentifierName;
	    var line = this.line;
	    var column = this.column;
	    var match = regex.exec(this.input);

	    if (match) {
	      var value = match['0'];

	      var end = this.forward(start, value.length);
	      var type = keywords.hasOwnProperty(value) ? TokenKeyword : TokenIdentifier;

	      return { type: type, value: value, line: line, column: column, start: start, end: end };
	    }

	    return null;
	  }
	};

	function createLex(regex, tokenType) {
	  return function () {
	    var start = this.position;
	    var line = this.line;
	    var column = this.column;
	    var match = regex.exec(this.input);

	    if (match) {
	      var value = match['0'];

	      var end = this.forward(start, value.length);
	      var type = tokenType === undefined ? value : tokenType;

	      return { type: type, value: value, line: line, column: column, start: start, end: end };
	    }

	    return null;
	  };
	}

	module.exports = Lexer;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
	  createSourceError: createSourceError,
	  replace: replace,
	  count: count
	};

	var padStart = __webpack_require__(4);
	var repeat = __webpack_require__(5);

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
	  return Object.keys(replacers).reduce(function (str, key) {
	    return str.replace(new RegExp('\\{ *' + key + ' *\\}', 'g'), replacers[key]);
	  }, data);
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

	function createSourceError(options) {
	  var name = options.name;
	  var originalLine = options.line;
	  var originalColumn = options.column;
	  var source = options.source;
	  var message = options.message;
	  var _options$showSource = options.showSource;
	  var showSource = _options$showSource === undefined ? true : _options$showSource;
	  var _options$show = options.show;
	  var show = _options$show === undefined ? 3 : _options$show;
	  var _options$filename = options.filename;
	  var filename = _options$filename === undefined ? '[Source]' : _options$filename;


	  var column = originalColumn;
	  var isLineNumber = typeof originalLine === 'number' && isFinite(originalLine);
	  var isColumnNumber = typeof column === 'number' && isFinite(column);
	  var linecol = isLineNumber && isColumnNumber ? ' (' + originalLine + ':' + originalColumn + ')' : '';
	  var errorMessage = '' + message + linecol;

	  if (showSource) {
	    (function () {
	      // TODO: Might want to optimize this in case the string is large
	      var headerMessage = message ? ' ' + message : message;
	      var lines = source.split('\n');
	      var length = lines.length;

	      // Restrict the line to be between 0 and the total number of lines
	      var line = Math.min(lines.length, Math.max(originalLine, 1));
	      var _start = Math.min(length - show, Math.max(line - show - 1));
	      var start = Math.max(_start, 0);
	      var end = Math.min(length, line + show);

	      // Pointer line can not be more or less than the start
	      var pointerLine = Math.max(start, Math.min(line, end));
	      var padding = lines.length.toString().length + POINTER.length;

	      var sourceLines = lines.slice(start, end).map(function (text, index) {
	        var currentLine = start + index + 1;
	        var beginning = String(currentLine);
	        var leadingSpace = '';
	        var arrowSpacing = '';
	        var lineText = text;

	        if (currentLine === pointerLine) {
	          beginning = POINTER + beginning;

	          if (isColumnNumber) {
	            leadingSpace = repeat(' ', padding + 1);
	            arrowSpacing = repeat(' ', Math.max(0, column + 1));
	            lineText = text + '\n' + leadingSpace + ' ' + arrowSpacing + '^';
	          }
	        }

	        return padStart(beginning, padding, ' ') + ' | ' + lineText + '\n';
	      }).join('');

	      errorMessage = filename + ':' + headerMessage + linecol + '\n' + sourceLines;
	    })();
	  }

	  var err = new Error(errorMessage);

	  err.message = errorMessage;
	  err.name = name;

	  if (isLineNumber && isColumnNumber) {
	    err.line = originalLine;
	    err.column = column;
	  }

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
/* 4 */
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
/* 5 */
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
/* 6 */
/***/ function(module, exports) {

	'use strict';

	/* Generated from ./regex.js */

	exports.Punctuator = /^(?:(?:>>>=|>>>|===|!==|\.\.\.|\*\*=|<<=|>>=|\*\*|\+\+|--|<<|>>|&&|>=|\+=|-=|\*=|==|%=|!=|\/=|<=|&=|\|=|\^=|=>|\|\||\||\^|!|~|\]|\.|\?|:|=|\{|;|\+|-|\*|,|%|<|>|\)|\[|\(|\/|&|\}))/;

	exports.NumericLiteral = /^(?:(?:(?:0x[0-9A-Fa-f]+|0X[0-9A-Fa-f]+)|(?:0[Oo][0-7]+)|(?:0[Bb][01]+)|(?:(?:0|[1-9](?:[0-9]+)?)\.(?:[0-9]+)?|\.[0-9]+|(?:0|[1-9](?:[0-9]+)?))(?:[Ee](?:[\+\-][0-9]+))?))/;

	exports.StringLiteral = /^(?:(?:'(?:(?:\\(?:(?:["'\\bfnrtv]|(?:[\0-\t\x0B\f\x0E-!#-&\(-/:-\[\]-ac-eg-mo-qswy-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|x[0-9A-Fa-f]{2}|(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))|(?:(?:[\0-\t\x0B\f\x0E-&\(-\[\]-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])|\\(?:(?:["'\\bfnrtv]|(?:[\0-\t\x0B\f\x0E-!#-&\(-/:-\[\]-ac-eg-mo-qswy-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|x[0-9A-Fa-f]{2}|(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))|\\(?:\r\n|[\n\r]))|\\(?:\r\n|[\n\r]))+)?')|(?:"(?:(?:\\(?:(?:["'\\bfnrtv]|(?:[\0-\t\x0B\f\x0E-!#-&\(-/:-\[\]-ac-eg-mo-qswy-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|x[0-9A-Fa-f]{2}|(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))|(?:(?:[\0-\t\x0B\f\x0E-!#-\[\]-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])|\\(?:(?:["'\\bfnrtv]|(?:[\0-\t\x0B\f\x0E-!#-&\(-/:-\[\]-ac-eg-mo-qswy-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|x[0-9A-Fa-f]{2}|(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))|\\(?:\r\n|[\n\r]))|\\(?:\r\n|[\n\r]))+)?"))/;

	exports.NullLiteral = /^(?:(?:null))/;

	exports.BooleanLiteral = /^(?:(?:true|false))/;

	exports.ReservedWord = /^(?:(?:(?:instanceof|function|debugger|continue|default|extends|finally|delete|export|import|typeof|return|switch|const|throw|while|yield|catch|super|class|break|case|void|this|with|else|var|new|for|try|if|do|in)|(?:null)|(?:true|false)))/;

	exports.IdentifierName = /^(?:(?:(?:[\$A-Z_a-z]|\\(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))(?:[\$0-9A-Z_a-z\u200C\u200D]|\\(?:u[0-9A-Fa-f]{4}|u\{[0-9A-Fa-f]{4}\}))*))/;

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';

	exports.TokenNumericLiteral = 0;
	exports.TokenStringLiteral = 1;
	exports.TokenIdentifier = 2;
	exports.TokenKeyword = 3;
	exports.TokenPunctuator = 4;
	exports.TokenNullLiteral = 5;
	exports.TokenBooleanLiteral = 6;

/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	var punctuators = {
	  '{': true,
	  '(': true,
	  ')': true,
	  '[': true,
	  ']': true,
	  '.': true,
	  '...': true,
	  ';': true,
	  ',': true,
	  '<': true,
	  '>': true,
	  '<=': true,
	  '>=': true,
	  '==': true,
	  '!=': true,
	  '===': true,
	  '!==': true,
	  '+': true,
	  '-': true,
	  '*': true,
	  '**': true,
	  '%': true,
	  '++': true,
	  '--': true,
	  '<<': true,
	  '>>': true,
	  '>>>': true,
	  '&': true,
	  '|': true,
	  '^': true,
	  '!': true,
	  '~': true,
	  '&&': true,
	  '||': true,
	  '?': true,
	  ':': true,
	  '=': true,
	  '+=': true,
	  '-=': true,
	  '*=': true,
	  '**=': true,
	  '%=': true,
	  '<<=': true,
	  '>>=': true,
	  '>>>=': true,
	  '&=': true,
	  '|=': true,
	  '^=': true,
	  '=>': true,
	  '/': true,
	  '/=': true,
	  '}': true
	};

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
	  'try': true
	};

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

	module.exports = {
	  simpleop: simpleop,
	  keywords: keywords,
	  punctuators: punctuators,
	  assignment: assignment
	};

/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	var noop = function noop() {};

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

	function walk(ast) {
	  var handlers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	  recurse(ast, null);

	  function recurse(node, parent, override) {
	    if (node === null && parent && parent.type === 'ArrayExpression') {
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

	function loop(prop) {
	  return function (node, recurse) {
	    var items = node[prop];
	    var length = items.length;

	    for (var i = 0; i < length; i++) {
	      recurse(items[i], node);
	    }
	  };
	}

	module.exports = {
	  walk: walk,
	  visitors: visitors
	};

/***/ }
/******/ ])
});
;