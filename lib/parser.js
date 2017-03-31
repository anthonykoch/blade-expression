'use strict';

// module.exports = Parser;

const assign = require('object-assign');

const Lexer  = require('./lexer');

const { TokenKeyword,
        TokenIdentifier,
        TokenPunctuator,
        TokenNullLiteral,
        TokenBooleanLiteral,
        TokenStringLiteral,
        TokenNumericLiteral } = require('./constants/tokens');

const { assignment, simpleop } = require('./constants/grammar');

const { replace,
        count,
        createSourceError } = require('./utils');

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
const UnexpectedExpression            = 'Unexpected {expression}';

const UnsupportedFunctionBody         = 'Unsupported function body';
const UnsupportedClass                = 'Class expressions are not supported';
const UnsupportedFunction             = 'Function expressions are not supported';
const UnsupportedMeta                 = 'Meta expressions are not supported';
const UnsupportedSuper                = '"super" expressions are not supported';

const ES7_TRAILING_COMMA = 'es7_trailing_comma';

const Raw = {
    null: null,
    true: true,
    false: false
};

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
    '||':         5
};

function getRaw(value, type) {
    let raw;

    switch (type) {
        case TokenStringLiteral:
            raw = value.slice(1, -1);
            break;
        case TokenNumericLiteral:
            raw = Number(value);
            break;
        case TokenBooleanLiteral:
        case TokenNullLiteral:
            raw = Raw[value];
    }

    return raw;
}

function isUnaryOperator(token) {
    let value;

    if (token) {
        value = token.value;
    } else {
        return false;
    }

    if (TokenPunctuator !== token.type && TokenKeyword !== token.type) {
        return false;
    }

    return (   '+' === value || '-' === value
            || '!' === value || 'void' === value
            || '~' === value || 'delete' === value
            || 'typeof' === value
        );
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
    return !! assignment[punc];
}

/**
 * Returns true if the token is a valid property name.
 *
 * @param  {Object}  token
 * @return {Boolean}
 */

function isValidPropertyName(token) {
    const type = token.type;
    const value = token.value;

    if (TokenIdentifier === type) {
        return true;
    }

    return type === TokenNullLiteral || type === TokenBooleanLiteral;
}

function isValidSimpleAssignmentTarget_Assign(node, strict) {
    if ('Identifier' === node.type) {
        if (strict && isValdSimpleAssignmentTarget_Identifier(node.name)) {
            return false;
        }

        return true;
    } else if ('MemberExpression' === node.type) {
        return true;
    }

    return false;
}

function isValidSimpleAssignmentTarget_Update(node) {
    const isObject =
        'ArrayExpression' === node.type || 'ObjectExpression' === node.type;
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
    const type = expr.type;

    return (
               'Identifier'       === type
            || 'SpreadElement'    === type
            || 'ArrayExpression'  === type
            || 'ObjectExpression' === type
        );
}

const CONDITIONAL_PRECEDENCE = 4;
const WHILE_FAILSAFE = 1000000;

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

const Parser = {

    /**
     * Creates a lexer object.
     *
     * @param  {Object} options
     * @return {Object}
     */

    create(data, options) {
        return Object.create(ParserPrototype).init(data, options);
    },

    walk: require('./walk').walk,

    Lexer,

};

const ParserPrototype = {

    init(data, opts) {
        const options = opts || {};
        const {
            throwSourceError=true,
            consumeLeast=false,
            allowDelimited=false
        } = options;

        this.context          = assign({}, options.context);
        this.lexer            = Lexer.create(data);
        this.hasMore          = false;
        this.consumeLeast     = consumeLeast;
        this.throwSourceError = throwSourceError;
        this.allowDelimited   = allowDelimited;

        return this;
    },

    /**
     * Parses the data string and returns the AST.
     */

    parse(data, options) {
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
        let token;

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

    consumeUntil(value, begin) {
        let token;

        while (true) {
            token = this.peek();

            if ( ! token) {
                this.error(UnexpectedEnd, begin);
            }
            else if (value === token.value) {
                return;
            }

            token = this.nextToken()
        }
    },

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
        return this.context[name] === true;
    },

    /**
     * Throws an error from the message passed
     */

    error(message, _token, expr) {
        const typeTranslation = {
            [TokenNumericLiteral]: 'number',
            [TokenStringLiteral]: 'string'
        };
        const token = _token || {};
        const value = token.value;
        const name    = 'ParseError';
        let line    = undefined;
        let column  = undefined;
        let type;
        let err;
        let errorMessage;

        if (token && token.value) {
            if (message === UnexpectedToken && typeTranslation[token.type]) {
                message = UnexpectedType;
                type = typeTranslation[token.type];
            }
        }

        const hasPosition = token && isFinite(token.line) && isFinite(token.column);

        if (hasPosition) {
            column = token.column;
            line = token.line;
        }

        errorMessage =
            replace(message, {
                token: `"${value}"`,
                expression: expr,
                type: type
            });

        if (this.throwSourceError && hasPosition) {
            err = createSourceError({
                name,
                line: line,
                column: column,
                source: this.source,
                message: errorMessage,
            });
        } else {
            err = new Error(errorMessage + (hasPosition ? ` (${line}:${column})` : ''));
            err.name = name;

            if (hasPosition) {
                err.line = line;
                err.column = column;
            }
        }

        throw err;
    },

    get source() {
        return this.lexer.source;
    },

};

const ParsingFunctions = {

    /**
     * Rewrites object and array expressions as destructuring.
     */

    rewriteNonPattern(body) {
        for (let i = 0; i < body.length; i++) {
            const expr = body[i];

            if (   'ArrayExpression'  === expr.type
                || 'ObjectExpression' === expr.type) {
                this.error('Destructuring not yet supported');
            }
        }

        return body;
    },

    parseArrowRemains(parameters, defaults, rest, start) {
        // The expression was arrow parameters
        const token = this.nextToken();
        const body = this.parseFunctionBody(true);

        if (parameters.length) {
            parameters = this.rewriteNonPattern(parameters);
        }

        return new ArrowExpression(parameters, null, rest, body, false, start, body.end);
    },

    parseSequenceExpression() {
        const token = this.expect('(');
        let defaults = null;
        let body = [];
        let restToken;
        let rest = null;
        let node;
        let expr;

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

                if (token && ')' === token.valule && ! this.feature(ES7_TRAILING_COMMA)) {
                    this.error('UnexpectedToken', this.peek());
                }
            } else {
                break;
            }
        }

        const end = this.expect(')').end;
        const hasArrow = this.match('=>');

        if ( ! hasArrow && rest) {
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

    /**
     * Parses identifiers. nextToken() should not return null here.
     */

    parseIdentifier() {
        const token = this.nextToken();
        return new Identifier(token.value, token.start, token.end);
    },

    parsePrimaryExpression() {
        const token = this.peek();
        const { strict, inGenerator } = this.context;
        let node = null;

        if (token === null) {
            this.error(UnexpectedEnd);
        }

        const type = token.type;
        const value = token.value;
        const start = token.start;
        const end = token.end;

        if (
                type === TokenNullLiteral ||
                type === TokenBooleanLiteral ||
                type === TokenNumericLiteral ||
                type === TokenStringLiteral
            ) {
            this.nextToken();
            node = new Literal(value, getRaw(value, type), start, end);
        } else if (type === TokenIdentifier) {
            if (strict && isValdSimpleAssignmentTarget_Identifier(value)) {
                this.error(UnexpectedStrictEvalOrArguments, token);
            }

            node = this.parseIdentifier();
        } else if (type === TokenKeyword) {
            switch(value) {
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

    parseSpreadElement(assertIdentifier) {
        const token = this.expect('...');
        const begin = this.peek();
        const expr = this.parseAssignmentExpression();
        const start = token.start;
        const end = expr.end;

        if (assertIdentifier) {
            if ('Identifier' !== expr.type) {
                this.error(UnexpectedToken, begin);
            }
        }

        return new SpreadElement(expr, start, end);
    },

    parseArrayLiteral() {
        const begin = this.expect('[');
        const elements = [];
        let end;

        while ( ! this.match(']')) {
            let token = this.peek();
            let value;

            if ( ! token) {
                this.error(UnexpectedEnd, begin);
            }

            value = token.value;

            if (',' === value) {
                this.nextToken();
                elements.push(null);
            }
            else {
                if ('...' === value) {
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
            let key;
            let end;
            let kind = 'init';

            if ('[' === token.value) {
                this.nextToken();
                key = this.parseAssignmentExpression();
                computed = true;
                this.expect(']');
                this.expect(':');
                value = this.parseAssignmentExpression();
                end = value.end;
            }
            else if (TokenIdentifier === token.type) {
                key = this.parseIdentifier();

                const nextToken = this.peek();

                if (nextToken) {
                    if ('=' === nextToken.value) {
                        this.error('Initializer is not supported');
                    } else if ('(' === nextToken.value) {
                        this.error('Method definitions are not supported');
                    } else if (':' === nextToken.value) {
                        this.nextToken();
                        value = this.parseAssignmentExpression();
                        end = value.end;
                    } else {
                        // FIXME: This is probably a semantic error if the
                        //        key is not na identifier
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

    parseFunctionExpression() {
        this.error(UnsupportedFunction);
    },

    parseFunctionBody(isArrow) {
        if (this.match('{')) {
            this.error(UnsupportedFunctionBody, this.peek());
        }

        if (isArrow) {
            return this.parseAssignmentExpression();
        }

        this.error(UnexpectedToken, this.peek());
    },

    parseArguments() {
        const begin = this.expect('(');
        const args = [];
        let token = this.peek();

        if (token && ')' !== token.value) {
            while (true) {
                if (this.match('...')) {
                    const expr = this.parseAssignmentExpression();
                    args.push(new SpreadElement(expr))
                    this.expect(')')
                    break;
                } else {
                    args.push(this.parseAssignmentExpression());
                }

                if ( ! this.match(')')) {
                    this.expect(',');
                } else {
                    break;
                }
            }
        }

        return args;
    },

    parseNewExpression() {
        const begin = this.expect('new');
        const start = begin.start;

        if (this.match('.')) {
            this.error(UnsupportedMeta);
        }

        const callee = this.parseLHSExpression();
        const matches = this.match('(');
        const args = matches ? this.parseArguments() : [];
        const end = matches ? this.expect(')').end : callee.end;

        return new NewExpression(callee, args, start, end);
    },

    parseNonComputedProperty() {
        const token = this.nextToken();

        if (token === null) {
            this.error(UnexpectedEnd);
        } else if (TokenIdentifier !== token.type && TokenKeyword !== token.type) {
            this.error(UnexpectedToken, token);
        }

        return new Identifier(token.value, token.start, token.end);
    },

    parseMemberExpression(object, withArguments) {
        let token;

        while (token = this.peek()) {
            const value = token.value;

            if ('.' === value) {
                this.nextToken();
                const property = this.parseNonComputedProperty();
                object = new MemberExpression(object, property, false, object.start, property.end);
            } else if ('[' === value) {
                this.nextToken();
                const argument = this.parseExpression();
                const end = this.expect(']').end;
                object = new MemberExpression(object, argument, true, object.start, end);
            } else if (withArguments && '(' === value) {
                const args = this.parseArguments();
                const end = this.expect(')').end;
                object = new CallExpression(object, args, object.start, end);
            } else {
                break;
            }
        }

        return object;
    },

    parseLHSExpressionWithArgs() {
        let token = this.peek();
        let expr;

        if ( ! token) {
            this.error(UnexpectedEnd);
        }

        if ('new' === token.value) {
            expr = this.parseNewExpression();
        } else if (this.match('super')) {
            this.error(UnsupportedSuper, token);
        } else {
            expr = this.parsePrimaryExpression();
        }

        const node = this.parseMemberExpression(expr, true);
        return node;
    },

    parseLHSExpression() {
        let token = this.peek();
        let expr;

        if (this.match('new')) {
            expr = this.parseNewExpression();
        } else if (this.match('super')) {
            this.error(UnsupportedSuper, token);
        } else {
            expr = this.parsePrimaryExpression();
        }

        const node = this.parseMemberExpression(expr, false);
        return node;
    },

    parseUpdateExpression() {
        const begin = this.peek();
        let token;
        let node;

        if ( ! begin) {
            this.error(UnexpectedEnd);
        }

        if ('++' === begin.value || '--' === begin.value) {
            this.nextToken();
            const expr = this.parseUnaryExpression();
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

                if ( ! isValidSimpleAssignmentTarget_Update(node.argument)) {
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
        let node;
        let value;
        let type;

        const primary = this.checkSimplePrimary(token);

        if (primary !== null) {
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
            const expr = this.parseUpdateExpression();

            if ( ! isValidSimpleAssignmentTarget_Update(expr.argument)) {
                this.error(InvalidLHSAssignmentPrefix, token);
            }

            return expr;
        } else if (isUnaryOperator(token)) {
            this.nextToken();
            const expr = this.parseUnaryExpression();

            if ('delete' === value) {
                if (this.context.strict && 'delete' === value && 'Identifier' == expr.type) {
                    // #sec-delete-operator-static-semantics-early-errors
                    this.error(StrictDelete, token);
                }
            }

            return new UnaryExpression(value, expr, token.start, expr.end);
        } else {
            return this.parseUpdateExpression();
        }
    },

    /**
     * Copyright 2014, the V8 project authors. All rights reserved.
     *
     * https://github.com/nodejs/node/blob/91b40944a41f8ab1e499ed5bebeed520a215b9a5/deps/v8/src/parsing/parser-base.h#L2675
     */

    parseBinaryExpression(prec) {
        let left = this.parseUnaryExpression();
        const token = this.peek();
        let right;
        let fn;

        // NOTE: Not sure if this is the best way to do this
        // Catch JS keywords that are not valid

        if ((token && TokenKeyword === token.type)
            && ! (token.value in operatorPrecedence)) {
            this.error(UnexpectedToken, token);
        }

        for (let prec1 = precedence(this.peek()); prec1 >= prec; prec1--) {

            while (precedence(this.peek()) === prec1) {
                const operator = this.nextToken();
                const op = operator.value;
                const nextPrec = '**' === op ? prec1 : prec1 + 1;
                const start = left.start
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

    parseConditionalExpression() {
        const begin = this.peek();
        let node = this.parseBinaryExpression(CONDITIONAL_PRECEDENCE);
        const token = this.peek();

        if (token && '?' === token.value) {
            this.nextToken()
            const consequent = this.parseAssignmentExpression();
            this.expect(':');
            const alternate = this.parseAssignmentExpression();
            node = new ConditionalExpression(node, consequent, alternate, node.start, alternate.end);
        } else if (token && '=>' === token.value) {
            node = this.parseArrowRemains([node], null, null, node.start);
        }

        return node;
    },

    // #sec-generator-function-definitions

    parseYieldExpression() {
        const begin = this.expect('yield');
        const start = begin.start;
        let delegates = false;
        let argument = null;

        if (delegates = this.match('*')) {
            this.nextToken();
        }

        const token = this.peek();
        const hasMore = !!(token && token.line === begin.line);

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
        const token = this.peek();
        let node = null;

        if (this.match('yield') && this.context.inGenerator) {
            node = this.parseYieldExpression();
        } else {
            node = this.parseConditionalExpression(CONDITIONAL_PRECEDENCE);
            const token = this.peek();

            if (token && TokenPunctuator === token.type && isAssignment(token.value)) {

                if ( ! isValidSimpleAssignmentTarget_Assign(node, this.context.strict)) {
                    this.error(InvalidLHSAssignment);
                }

                this.nextToken();
                const rhs = this.parseAssignmentExpression();
                node = new AssignmentExpression(token.value, node, rhs, node.start, rhs.end);
            }
        }

        return node;
    },

    checkSimplePrimary(token, skipSimpleOperatorCheck) {
        const lookahead = this.lexer.lookahead(2);

        if (token && skipSimpleOperatorCheck || lookahead && simpleop[lookahead.value]) {
            const type = token.type;
            const value = token.value;
            let node = null;

            if (type === TokenIdentifier) {
                node = new Identifier(value, token.start, token.end);
            } else if (
                    type === TokenStringLiteral ||
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
        const lookahead = this.lexer.lookahead(2);
        const begin = this.peek();

        if (null === lookahead && begin) {
            const node = this.checkSimplePrimary(begin, true);

            if (node) {
                return node;
            }
        }

        const expr = this.parseAssignmentExpression();
        const nextToken = this.peek();
        const start = expr.start;
        let end;

        if (nextToken && TokenPunctuator === nextToken.type && ',' === nextToken.value) {
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
        const first     = this.peek();
        const expr      = this.parseExpression();
        const second    = this.peek();
        const lookahead = this.lexer.lookahead(2);

        // console.log(JSON.stringify(expr, null, 2));

        if (this.allowDelimited && second && (';' === second.value)) {
            this.nextToken();
            this.hasMore = this.peek() !== null;
        }
        else if (second && this.hasNewlineBetween(expr, second)) {
            this.hasMore = true;
        }
        else if (this.consumeLeast === true && second != null) {
            this.hasMore = true;
        }
        else if (second) {
            this.error(UnexpectedToken, second);
        }
        else {
            this.hasMore = false;
        }

        return new ExpressionStatement(expr, first.start, expr.end);
    },

    parse() {
        let expr;

        if (this.peek() === null) {
            return new Program([]);
        } else {
            expr = this.parseExpressionStatement()
        }

        return new Program([expr]);
    },

};

assign(ParserPrototype, {
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
    }
});

assign(ParserPrototype, ParsingFunctions);

function parse(data, options) {
    return Parser.create(data, options).parse();
}

Parser.parse = parse;

module.exports = Parser;
