'use strict';

module.exports = Parser;

const Lexer  = require('./lexer');
const walk = require('./walk').walk;

const {
    TokenKeyword,
    TokenIdentifier,
    TokenPunctuator,
    TokenNullLiteral,
    TokenBooleanLiteral,
    TokenStringLiteral,
    TokenNumericLiteral,
  } = require('./constants/tokens');

const { assignment } = require('./constants/grammar');

const {
    replace,
    count,
    createSourceError,
  } = require('./utils');

/**
 * Error messages
 */

const StrictDelete                    = 'Delete of an unqualified identifier in strict mode.';
const UnexpectedEnd                   = 'Unexpected end of input';
const UnexpectedToken                 = 'Unexpected token {token}';
const UnexpectedType                  = 'Unexpected {type}';
const InvalidLHSAssignment            = 'Invalid left-hand side in assignment';
const InvalidLHSAssignmentPrefix      = 'Invalid left-hand side expression in prefix operation';
const InvalidLHSAssignmentPostfix     = 'Invalid left-hand side expression in postfix operation';
const UnexpectedStrictReservedWord    = 'Unexpected strict mode reserved word';
const UnexpectedStrictEvalOrArguments = 'Unexpected eval or arguments in strict mode';

const UnsupportedFunctionBody         = 'Unsupported function body';
const UnsupportedMeta                 = 'Meta expressions are not supported';
const Unsupported                     = '{token} is not supported';

const ES7_TRAILING_COMMA = 'es7_trailing_comma';

const Raw = {
  null: null,
  true: true,
  false: false,
};

const objnoop = Object.freeze({});

const operatorPrecedence = {
  '!':          15,
  '~':          15,
  '++':         15,
  '--':         15,
  'typeof':     15,
  'void':       15,
  'delete':     15,

  '**':         14,
  '*':          14,
  '/':          14,
  '%':          14,

  '+':          13,
  '-':          13,

  '<<':         12,
  '>>':         12,
  '>>>':        12,

  '<':          11,
  '<=':         11,
  '>':          11,
  '>=':         11,
  'in':         11,
  'instanceof': 11,

  '==':         10,
  '!=':         10,
  '===':        10,
  '!==':        10,

  '&':          9,
  '^':          8,
  '|':          7,

  '&&':         6,
  '||':         5,
};

function getRaw(value, type) {
  // eslint-disable-next-line no-undef-init
  let raw = undefined;

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
  let value = '';

  if (token) {
    value = token.value;
  } else {
    return false;
  }

  if (TokenPunctuator !== token.type && TokenKeyword !== token.type) {
    return false;
  }

  return (
    value === '+'      ||
    value === '-'      ||
    value === '!'      ||
    value === 'void'   ||
    value === '~'      ||
    value === 'delete' ||
    value === 'typeof'
  );
}

/**
 * Returns the precedence of the operator passed or 0 if the
 * token is not an operator.
 *
 * @param  {Object} token
 * @return {Number}
 */

function precedence(token) {
  if (token === null) {
    return 0;
  }

  return operatorPrecedence[token.value];
}

/**
 * Returns true if the token is a node by itself
 *
 * @param  {Object}  token - A token object
 * @return {Boolean}
 */

function isSimplePrimary(type) {
  return (
    type === TokenIdentifier     ||
    type === TokenNumericLiteral ||
    type === TokenStringLiteral  ||
    type === TokenNullLiteral    ||
    type === TokenBooleanLiteral
  );
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
  return !! assignment[punc];
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
  if (node.type === 'Identifier' || node.value === 'let') {
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

const CONDITIONAL_PRECEDENCE = 4;

function Literal(value, raw, start, end) {
  this.type  = 'Literal';
  this.value = value;
  this.raw   = raw;
  this.start = start;
  this.end   = end;
}

function Identifier(name, start, end) {
  this.type  = 'Identifier';
  this.name  = name;
  this.start = start;
  this.end   = end;
}

function SpreadElement(expr, start, end) {
  this.type     = 'SpreadElement';
  this.argument = expr;
  this.start    = start;
  this.end      = end;
}

function ThisExpression(start, end) {
  this.type  = 'ThisExpression';
  this.start = start;
  this.end   = end;
}

function SequenceExpression(body, start, end) {
  this.type        = 'SequenceExpression';
  this.expressions = body;
  this.start       = start;
  this.end         = end;
}

function NewExpression(callee, args, start, end) {
  this.type      = 'NewExpression';
  this.callee    = callee;
  this.arguments = args;
  this.start     = start;
  this.end       = end;
}

function CallExpression(callee, args, start, end) {
  this.type      = 'CallExpression';
  this.callee    = callee;
  this.arguments = args;
  this.start     = start;
  this.end       = end;
}

function MemberExpression(object, property, computed, start, end) {
  this.type     = 'MemberExpression';
  this.object   = object;
  this.property = property;
  this.computed = computed;
  this.start    = start;
  this.end      = end;
}

function YieldExpression(argument, delegates, start, end) {
  this.type      = 'YieldExpression';
  this.argument  = argument;
  this.delegates = delegates;
  this.start     = start;
  this.end       = end;
}

function ArrayExpression(elements, start, end) {
  this.type     = 'ArrayExpression';
  this.elements = elements;
  this.start    = start;
  this.end      = end;
}

function Property(shorthand, kind, computed, method, key, value, start, end) {
  this.type      = 'Property';
  this.shorthand = shorthand;
  this.kind      = kind;
  this.computed  = computed;
  this.method    = method;
  this.key       = key;
  this.value     = value;
  this.start     = start;
  this.end       = end;
}

function ObjectExpression(properties, start, end) {
  this.type       = 'ObjectExpression';
  this.properties = properties;
  this.start      = start;
  this.end        = end;
}

function UpdateExpression(operator, argument, isPrefix, start, end) {
  this.type     = 'UpdateExpression';
  this.operator = operator;
  this.argument = argument;
  this.prefix   = isPrefix;
  this.start    = start;
  this.end      = end;
}

function UnaryExpression(operator, argument, start, end) {
  this.type     = 'UnaryExpression';
  this.operator = operator;
  this.argument = argument;
  this.prefix   = true;
  this.start    = start;
  this.end      = end;
}

function LogicalExpression(operator, left, right, start, end) {
  this.type     = 'LogicalExpression';
  this.operator = operator;
  this.left     = left;
  this.right    = right;
  this.start    = start;
  this.end      = end;
}

function BinaryExpression(operator, left, right, start, end) {
  this.type     = 'BinaryExpression';
  this.operator = operator;
  this.left     = left;
  this.right    = right;
  this.start    = start;
  this.end      = end;
}

function ArrowExpression(parameters, defaults, rest, body, generator, start, end) {
  this.type       = 'ArrowExpression';
  this.parameters = parameters;
  this.defaults   = defaults;
  this.rest       = rest;
  this.body       = body;
  this.generator  = generator;
  this.expression = true;
  this.start      = start;
  this.end        = end;
}

function ConditionalExpression(test, consequent, alternate, start, end) {
  this.type       = 'ConditionalExpression';
  this.test       = test;
  this.consequent = consequent;
  this.alternate  = alternate;
  this.start      = start;
  this.end        = end;
}

function AssignmentExpression(operator, left, right, start, end) {
  this.type     = 'AssignmentExpression';
  this.operator = operator;
  this.left     = left;
  this.right    = right;
  this.start    = start;
  this.end      = end;
}

function ExpressionStatement(expr, start, end) {
  this.type       = 'ExpressionStatement';
  this.expression = expr;
  this.start      = start;
  this.end        = end;
}

function Program(body) {
  this.type = 'Program';
  this.body = body;
}

/**
 * Creates a lexer object.
 *
 * @param  {Object} options
 * @return {Object}
 */

function Parser(data, opts) {
  if (this === undefined) {
    throw new Error('Must call constructor with new');
  }

  const options = opts || objnoop;
  const {
    throwSourceError=true,
    consumeLeast=false,
    allowDelimited=true,
    context=objnoop,
  } = options;

  this.context          = context;
  this.lexer            = new Lexer(data);
  this.hasMore          = false;
  this.consumeLeast     = consumeLeast;
  this.throwSourceError = throwSourceError;
  this.allowDelimited   = allowDelimited;
}

Parser.walk = walk;
Parser.Lexer = Lexer;

/**
 * Parses the data string and returns the AST.
 */

// eslint-disable-next-line no-unused-vars
const parse = Parser.parse = function (data, options) {
  return new Parser(data, options).parse();
};

Parser.prototype = {

  /**
   * Consumes the next token and returns it if the token value is the
   * same as the value passed. If it does not match, the parser throws
   * an error. If there are no more tokens in the stream, the parser
   * throws for unexpected end of input.
   *
   * @param {String} value
   */

  expect(value) {
    const token = this.nextToken();

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

  ensure(index=1, last) {
    const token = this.lexer.lookahead(index);

    if (token === null) {
      this.error(UnexpectedEnd, last);
    }

    return token;
  },

  lookahead(index) {
    return this.lexer.lookahead(index);
  },

  peek() {
    return this.lexer.peek();
  },

  nextToken() {
    return this.lexer.nextToken();
  },

  /**
   * Consumes tokens until the type is found.
   *
   * @param {String} type
   * @param {Token} begin - Used for error reporting
   */

  // consumeUntil(value, begin) {
  //   let token = this.peek();

  //   while (token !== null) {
  //     token = this.peek();

  //     if (token === null) {
  //       this.error(UnexpectedEnd, begin);
  //     } else if (value === token.value) {
  //       return;
  //     }

  //     token = this.nextToken();
  //   }
  // },

  /**
   * Returns true if the current token value matches the one passed.
   *
   * @param {String} value
   */

  match(value) {
    const token = this.peek();

    return token !== null && token.value === value;
  },

  /**
   * Returns the number of newlines between the two nodes or tokens.
   *
   * @param {Object} before
   * @param {Object} after
   * @return {Number}
   */

  hasNewlineBetween(before, after) {
    return count(this.source.substring(before.end, after.start), '\n');
  },

  /**
   * Returns true if a feature (e.g. strict or es7 trailing comma) is enabled.
   *
   * @return {Boolean}
   */

  feature(name) {
    return !! this.context[name];
  },

  /**
   * Throws an error from the message passed
   */

  error(message, _token, expr) {
    const typeTranslation = {
      [TokenNumericLiteral]: 'number',
      [TokenStringLiteral]: 'string',
    };
    const token = _token || {};
    const value = token.value;
    const name  = 'ParseError';
    let line    = null;
    let column  = null;
    let type    = null;
    let err     = null;
    let errorMessage = message;

    if (token && token.value) {
      if (message === UnexpectedToken && typeTranslation[token.type]) {
        errorMessage = UnexpectedType;
        type = typeTranslation[token.type];
      }
    }

    const hasPosition = token && isFinite(token.line) && isFinite(token.column);

    if (hasPosition) {
      column = token.column;
      line = token.line;
    }

    errorMessage =
      replace(errorMessage, {
        token: `"${value}"`,
        expression: expr,
        type: type,
      });

    err = createSourceError({
      name: name,
      line: line,
      column: column,
      showSource: this.throwSourceError && hasPosition,
      source: this.source,
      message: errorMessage,
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

  rewriteNonPattern(body) {
    // TODO: Finish writing this
    for (let i = 0; i < body.length; i++) {
      const expr = body[i];

      if (expr.type === 'ArrayExpression' || expr.type === 'ObjectExpression') {
        this.error('Destructuring not yet supported');
      }
    }

    return body;
  },

  parseArrowRemains(parameters, defaults, rest, start) {
    this.expect('=>');
    const body = this.parseFunctionBody(true);
    let params = parameters;

    if (parameters.length) {
      params = this.rewriteNonPattern(parameters);
    }

    return new ArrowExpression(params, null, rest, body, false, start, body.end);
  },

  parseSequenceExpression() {
    const begin = this.expect('(');
    let defaults = null;
    let body = [];
    let restToken = null;
    let rest = null;
    let node = null;
    let expr = null;
    let trailingCommaToken = null;

    while ( ! this.match(')')) {
      if (this.match('...')) {
        restToken = this.peek();
        rest = this.parseSpreadElement(true).argument;
        body.push(rest);
        break;
      }

      expr = this.parseAssignmentExpression();
      body.push(expr);

      if (this.match(',')) {
        const token = this.nextToken();
        const nextToken = this.peek();

        if (nextToken && nextToken.value === ')') {
          trailingCommaToken = token;
        }
      } else {
        break;
      }
    }

    this.expect(')');

    const hasArrow = this.match('=>');

    if (hasArrow && trailingCommaToken && ! this.feature(ES7_TRAILING_COMMA)) {
      // Was a sequence expression with a trailing comma
      this.error(UnexpectedToken, trailingCommaToken);
    }

    if ( ! hasArrow && rest) {
      this.error(UnexpectedToken, restToken);
    }

    if (hasArrow) {
      node = this.parseArrowRemains(body, defaults, rest, begin.start);
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

  parseIdentifier() {
    const token = this.nextToken();

    if (this.context.strict && isValdSimpleAssignmentTargetIdentifier(token.value)) {
      this.error(UnexpectedStrictEvalOrArguments, token);
    }

    return new Identifier(token.value, token.start, token.end);
  },

  parsePrimaryExpression() {
    const token = this.lookahead(1);

    if (token === null) {
      this.error(UnexpectedEnd);
    }

    const type = token.type;
    const value = token.value;
    const start = token.start;
    const end = token.end;

    if (isSimplePrimary(type)) {
      return this.getSimplePrimary();
    }

    if (type === TokenKeyword) {
      switch (value) {
        case 'this':
          this.nextToken();

          return new ThisExpression(start, end);
        case 'function':
          return this.error(Unsupported, token);
        case 'class':
          return this.error(Unsupported, token);
        case 'yield':
          if (this.context.strict) {
            this.error(UnexpectedStrictReservedWord, token);
          }

          return this.parseIdentifier();
        case 'let':
          return this.parseIdentifier();
        case 'super':
          return this.error(Unsupported, token);
        default:
          return this.error(UnexpectedToken, token);
      }
    } else if (type === TokenPunctuator) {
      switch (value) {
        case '(':
          return this.parseSequenceExpression();
        case '{':
          return this.parseObjectLiteral();
        case '[':
          return this.parseArrayLiteral();
        default:
          break;
      }
    }

    return this.error(UnexpectedToken, token);
  },

  parseSpreadElement(assertIdentifier) {
    const token = this.expect('...');
    const begin = this.peek();
    const expr = this.parseAssignmentExpression();
    const start = token.start;
    const end = expr.end;

    if (assertIdentifier) {
      if (expr.type !== 'Identifier') {
        this.error(UnexpectedToken, begin);
      }
    }

    return new SpreadElement(expr, start, end);
  },

  parseArrayLiteral() {
    const begin = this.expect('[');
    const elements = [];
    let end = null;

    while ( ! this.match(']')) {
      let token = this.peek();
      let value = '';

      if ( ! token) {
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
          const expr = this.parseAssignmentExpression();

          elements.push(expr);
        }

        if ( ! this.match(']')) {
          this.expect(',');
        }
      }
    }

    end = this.expect(']').end;

    return new ArrayExpression(elements, begin.start, end);
  },

  parseObjectLiteral() {
    const begin = this.expect('{');
    const properties = [];

    while ( ! this.match('}')) {
      const token = this.peek();

      if ( ! token) {
        this.error(UnexpectedEnd, begin);
      }

      const start = token.start;
      let shorthand = false;
      let computed = false;
      let method = false;
      let value = null;
      let key = null;
      let end = null;
      let kind = 'init';

      if (token.value === '[') {
        this.nextToken();
        key = this.parseAssignmentExpression();
        computed = true;
        this.expect(']');
        this.expect(':');
        value = this.parseAssignmentExpression();
        end = value.end;
      } else if (TokenIdentifier === token.type) {
        key = this.parseIdentifier();

        const nextToken = this.peek();

        if (nextToken) {
          if (nextToken.value === '=') {
            this.error('Initializer is not supported');
          } else if (nextToken.value === '(') {
            this.error('Method definitions are not supported');
          } else if (nextToken.value === ':') {
            this.nextToken();
            value = this.parseAssignmentExpression();
            end = value.end;
          } else {
            // FIXME: This is probably a semantic error if the
            //        key is not a identifier
            shorthand = true;
            value = key;
            end = token.end;
          }
        }

      } else if (
          token.type === TokenStringLiteral || token.type === TokenNumericLiteral
        ) {
        this.nextToken();
        key = new Literal(token.value, getRaw(token.value, token.type), token.start, token.end);
        this.expect(':');
        value = this.parseAssignmentExpression();
        end = value.end;
      } else {
        this.error(UnexpectedToken, begin);
      }

      const property = new Property(shorthand, kind, computed, method, key, value, start, end);

      properties.push(property);

      if ( ! this.match('}')) {
        this.expect(',');
      }
    }

    const end = this.expect('}').end;

    return new ObjectExpression(properties, begin.start, end);
  },

  parseFunctionBody() {
    if (this.match('{')) {
      this.error(UnsupportedFunctionBody, this.peek());
    }

    return this.parseAssignmentExpression();
  },

  parseArguments() {
    this.expect('(');

    const args = [];
    let token = null;

    while ((token = this.peek()) !== null) {
      const value = token.value;

      if (value === ',') {
        this.expect(',');

        const token = this.peek();

        if (token && token.value === ')' && ! this.feature(ES7_TRAILING_COMMA)) {
          this.error(UnexpectedToken, token);
        }
      } else if (value === ')') {
        break;
      } else if (value === '...') {
        this.expect('...');
        args.push(this.parseSpreadElement(true));
        break;
      } else {
        args.push(this.parseAssignmentExpression());
      }
    }

    return args;
  },

  parseNewExpression() {
    const begin = this.expect('new');
    const start = begin.start;

    if (this.match('.')) {
      this.error(UnsupportedMeta, begin);
    }

    const callee = this.parseLHSExpression();
    const matches = this.match('(');
    const args = matches ? this.parseArguments() : [];
    const end = matches ? this.expect(')').end : callee.end;

    return new NewExpression(callee, args, start, end);
  },

  parseMemberExpression(object, withArguments) {
    let token = null;

    /* eslint-disable no-param-reassign */
    while ((token = this.peek())) {
      const value = token.value;

      if (value === '.') {
        this.nextToken();

        const nextToken = this.nextToken();

        if (nextToken === null) {
          this.error(UnexpectedEnd);
        } else if (TokenIdentifier !== nextToken.type && TokenKeyword !== nextToken.type) {
          this.error(UnexpectedToken, nextToken);
        }

        const property = new Identifier(nextToken.value, nextToken.start, nextToken.end);

        object = new MemberExpression(object, property, false, object.start, property.end);
      } else if (value === '[') {
        this.nextToken();

        const argument = this.parseExpression();
        const end = this.expect(']').end;

        object = new MemberExpression(object, argument, true, object.start, end);
      } else if (withArguments && value === '(') {
        const args = this.parseArguments();
        const end = this.expect(')').end;

        object = new CallExpression(object, args, object.start, end);
      } else {
        break;
      }
    }

    /* eslint-enable no-param-reassign */

    return object;
  },

  parseLHSExpressionWithArgs() {
    const token = this.peek();
    let expr = null;

    if (token !== null && token.value === 'new') {
      expr = this.parseNewExpression();
    } else {
      expr = this.parsePrimaryExpression();
    }

    return this.parseMemberExpression(expr, true);
  },

  parseLHSExpression() {
    let token = this.peek();
    let expr = null;

    if (token !== null && token.value === 'new') {
      expr = this.parseNewExpression();
    } else {
      expr = this.parsePrimaryExpression();
    }

    return this.parseMemberExpression(expr, false);
  },

  parseUpdateExpression() {
    const begin = this.peek();
    let token = null;
    let node = null;

    if ( ! begin) {
      this.error(UnexpectedEnd);
    }

    if (begin.value === '++' || begin.value === '--') {
      this.nextToken();

      const expr = this.parseUnaryExpression();

      // Postfix update expression
      node = new UpdateExpression(begin.value, expr, true, begin.start, expr.end);
    } else {
      node = this.parseLHSExpressionWithArgs();
    }

    while ((token = this.peek())) {
      if (token.value === '++' || token.value === '--') {
        if (this.hasNewlineBetween(node, token)) {
          return node;
        }

        this.nextToken();
        node = new UpdateExpression(token.value, node, false, node.start, token.end);

        if ( ! isValidSimpleAssignmentTargetUpdate(node.argument)) {
          this.error(InvalidLHSAssignmentPostfix, token);
        }
      } else {
        break;
      }
    }

    return node;
  },

  parseUnaryExpression() {
    const token = this.peek();
    let value = '';
    let type = null;

    if (token) {
      value = token.value;
      type = token.type;
    }

    if (TokenPunctuator === type && (value === '++' || value === '--')) {
      // Prefix update expression
      const expr = this.parseUpdateExpression();

      if ( ! isValidSimpleAssignmentTargetUpdate(expr.argument)) {
        this.error(InvalidLHSAssignmentPrefix, token);
      }

      return expr;
    } else if (isUnaryOperator(token)) {
      this.nextToken();

      const expr = this.parseUnaryExpression();

      if (this.context.strict && value === 'delete' && expr.type === 'Identifier') {
        // #sec-delete-operator-static-semantics-early-errors
        this.error(StrictDelete, token);
      }

      return new UnaryExpression(value, expr, token.start, expr.end);
    }

    return this.parseUpdateExpression();
  },

  /**
   * Copyright 2014, the V8 project authors. All rights reserved.
   *
   * https://github.com/nodejs/node/blob/91b40944a41f8ab1e499ed5bebeed520a215b9a5/deps/v8/src/parsing/parser-base.h#L2675
   */

  parseBinaryExpression(prec) {
    let left  = this.parseUnaryExpression();
    let right = null;
    let Fn    = null;

    for (let prec1 = precedence(this.peek()); prec1 >= prec; prec1--) {

      while (precedence(this.peek()) === prec1) {
        const operator = this.nextToken();
        const op = operator.value;
        const nextPrec = op === '**' ? prec1 : prec1 + 1;

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

  parseConditionalExpression() {
    let node = this.parseBinaryExpression(CONDITIONAL_PRECEDENCE);
    const token = this.peek();

    if (token && token.value === '?') {
      this.nextToken();

      const consequent = this.parseAssignmentExpression();

      this.expect(':');

      const alternate = this.parseAssignmentExpression();

      node = new ConditionalExpression(node, consequent, alternate, node.start, alternate.end);
    } else if (token && token.value === '=>') {
      node = this.parseArrowRemains([node], null, null, node.start);
    }

    return node;
  },

  // #sec-generator-function-definitions

  parseYieldExpression() {
    const begin = this.expect('yield');
    const start = begin.start;
    const delegates = this.match('*');
    let argument = null;

    if (delegates) {
      this.nextToken();
    }

    const token = this.peek();
    const hasMore = !! (token && token.line === begin.line);

    if (delegates || hasMore) {
      argument = this.parseAssignmentExpression();
    }

    const end = argument ? argument.end : begin.end;

    return new YieldExpression(argument, delegates, start, end);
  },

  /**
   * TODO: #sec-assignment-operators-static-semantics-early-errors
   */

  parseAssignmentExpression() {
    let node = null;

    if (this.match('yield') && this.context.generator) {
      node = this.parseYieldExpression();
    } else {
      node = this.parseConditionalExpression();
      const token = this.peek();

      if (token && TokenPunctuator === token.type && isAssignment(token.value)) {

        if ( ! isValidSimpleAssignmentTargetAssign(node, this.context.strict)) {
          this.error(InvalidLHSAssignment);
        }

        this.nextToken();

        const rhs = this.parseAssignmentExpression();

        node = new AssignmentExpression(token.value, node, rhs, node.start, rhs.end);
      }
    }

    return node;
  },

  getSimplePrimary() {
    const token = this.peek();

    if (token !== null) {
      const type = token.type;
      const value = token.value;
      let node = null;

      if (type === TokenIdentifier || value === 'let') {
        return this.parseIdentifier();
      } else if (
          type === TokenStringLiteral  ||
          type === TokenNumericLiteral ||
          type === TokenBooleanLiteral ||
          type === TokenNullLiteral
        ) {
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

  parseExpression() {
    const expr = this.parseAssignmentExpression();
    const nextToken = this.peek();
    const start = expr.start;

    if (nextToken && TokenPunctuator === nextToken.type && nextToken.value === ',') {
      const body = [expr];

      while (this.match(',')) {
        this.nextToken();

        const expr = this.parseAssignmentExpression();

        body.push(expr);
      }

      return new SequenceExpression(body, start, body[body.length - 1].end);
    }

    return expr;
  },

  parseExpressionStatement() {
    const begin = this.peek();
    const expr = this.parseExpression();
    const second = this.peek();

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
    }

    return new ExpressionStatement(expr, begin.start, expr.end);
  },

  parse() {
    const begin = this.lexer.lookahead(4, 1);

    this.hasMore = false;

    if (begin === null) {
      return new Program([]);
    } else if (this.lexer.stash.length === 1 && isSimplePrimary(begin.type)) {
      const expr = this.getSimplePrimary(begin);

      return new Program([new ExpressionStatement(expr, begin.start, expr.end)]);
    }

    return new Program([this.parseExpressionStatement()]);
  },

  nodes: {
    Literal,
    Identifier,
    SpreadElement,
    ThisExpression,
    SequenceExpression,
    NewExpression,
    CallExpression,
    MemberExpression,
    YieldExpression,
    ArrayExpression,
    Property,
    ObjectExpression,
    UpdateExpression,
    UnaryExpression,
    LogicalExpression,
    BinaryExpression,
    ArrowExpression,
    ConditionalExpression,
    AssignmentExpression,
    ExpressionStatement,
    Program,
  },

};
