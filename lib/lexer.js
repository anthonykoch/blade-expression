'use strict';

// module.exports = Lexer;

const assign = require('object-assign');

const { count,
        createSourceError } = require('./utils');

const Regex = require('./constants/regex');

const { TokenKeyword,
        TokenIdentifier,
        TokenPunctuator,
        TokenStringLiteral,
        TokenNumericLiteral } = require('./constants/tokens');

const { keywords } = require('./constants/grammar');

const Lexer = {

    /**
     * Creates a lexer object.
     *
     * @param  {Object} options
     * @return {Object}
     */

    create(data, options) {
        return Object.create(LexerPrototype).init(data, options);
    },

    /**
     * Returns all tokens for a given string.
     *
     * @param  {String} data - The data to be tokenized
     * @param  {String} options - Options to pass to lexer.init
     * @return {Array.<Object>}
     */

    all(data, options) {
        const lexer = Lexer.create(data, options);
        const tokens = [];
        let token;

        while (token = lexer.nextToken()) {
            tokens.push(token);
        }

        return tokens;
    }

};

const LexerPrototype = {};

assign(LexerPrototype, {

    /**
     * Initiates a lexer object.
     *
     * @param {Object} options
     * @param {String} options.data - The data to be lexed
     * @param {String} options.customDirectives - Custom directives lex
     * @return {this}
     */

    init(data, opts) {
        const options = opts || {};
        const { throwSourceError=true } = options;

        let source = data
            .replace(/\r\n|[\n\r]/g, '\n')

        if (source.charAt(0) === '\uFEFF') {
            source = source.slice(1);
        }

        this.line             = 1;
        this.column           = 0;
        this.position         = 0;
        this.stash            = [];
        this.source           = this.input = source;
        this.inputLength      = this.source.length;
        this.ended            = false;
        this.throwSourceError = throwSourceError;

        this.Punctuator     = Regex.Punctuator;
        this.NumericLiteral = Regex.NumericLiteral;
        this.StringLiteral  = Regex.StringLiteral;
        this.ReservedWord   = Regex.ReservedWord;
        this.IdentifierName = Regex.IdentifierName;

        return this;
    },

    /**
     * Returns a token from the input or `null` if no tokens can be found.
     *
     * @return {Object|null}
     */

    lex() {
        const token = null
                || this.getNumericLiteraloken()
                || this.getStringLiteralToken()
                || this.getPunctuatorToken()
                || this.getIdentifierNameToken();

        if (token == null) {
            this.lexError();
        }

        return token;
    },

    lexError() {
        const position = this.position;
        const char = this.source[position];

        const errorInfo = {
            line: this.line,
            column: this.column
        };

        // if (/^['"]/.test(char)) {
        //     errorInfo.column = this.column + 1;
        //     this.error('Unterminated string literal', errorInfo);
        // }

        this.error(`Unexpected token "${char}"`, errorInfo);
    },

    /**
     * Handles whitespace for when regex uses sticky flag
     */

    skipWhitespace() {
        let column       = this.column
        let line         = this.line;
        let start        = this.position;
        let pos          = this.position;
        let times        = 0;
        let previousLine = line;
        let char;

        while (char = this.source[pos]) {
            if ('\n' === char) {
                line = line + 1;
            } else if (' ' === char || '\t' === char) {
            } else {
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

        this.input = this.input.substring(times, this.inputLength);
        this.position = pos;
        this.line     = line;
        this.column   = column;
    },

    handleWhitespace() {
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

    lookahead(index) {
        const { stash } = this;
        let times = index - stash.length;
        let token;

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

    peek() {
        return this.lookahead(1);
    },

    /**
     * Returns and consumes the next token or `null` if there are no more
     * tokens to be consumed from the input.
     *
     * @return {Object|null}
     */

    nextToken() {
        let token;

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

    next() {
        const token = this.nextToken();

        if (token === null) {
            return {
                done: true,
                value: undefined
            }
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

    error(message, { line, column }={}) {
        let err;

        if (this.throwSourceError) {
            err = createSourceError({
                name: 'LexerError',
                message,
                line,
                column,
                source: this.source,
            });
        } else {
            err = new Error(message);
            err.name = 'LexError';
            err.line = line;
            err.column = column;
        }

        throw err;
    }

});

if (typeof Symbol !== 'undefined') {

    /**
     * Implements the iterable protocol.
     */

    LexerPrototype[Symbol.iterator] = function () {
        return this;
    }
}

function createLex(accessor, tokenType) {
    return function lexing() {
        const position = this.position;
        const regex = this[accessor];
        const line = this.line;
        const column = this.column;
        let match;

        regex.lastIndex = 0;

        if (match = regex.exec(this.input)) {
            let { '0': str } = match;
            const end = this.forward(position, str.length, regex.lastIndex);

            return {
                type: tokenType !== undefined ? tokenType : str,
                value: str,
                line: line,
                column: column,
                start: position,
                end: end
            };
        }

        return null;
    };
}

assign(LexerPrototype, {

    /**
     * Advances the lexer's position  and column based on whether or
     * not the lexer is using sticky regex.
     *
     * @param {Number} start     - The starting position before lexing
     * @param {Number} length    - The length of the matched string
     * @param {Number} lastIndex - The lastIndex of the regex that matched
     */

    forward(start, length, lastIndex) {
        this.input = this.input.substring(length, this.inputLength);
        this.position = start + length;
        this.column = this.column + length;

        return this.position;
    },

    getNumericLiteraloken:
        createLex('NumericLiteral', TokenNumericLiteral),

    getStringLiteralToken:
        createLex('StringLiteral',  TokenStringLiteral),

    getIdentifierNameToken:
        createLex('IdentifierName', TokenIdentifier),

    getPunctuatorToken:
        createLex('Punctuator',     TokenPunctuator),

    getIdentifierNameToken() {
        const position = this.position;
        const regex = this.IdentifierName;
        const line = this.line;
        const column = this.column;
        let match;

        regex.lastIndex = 0;

        if (match = regex.exec(this.input)) {
            const { '0': str } = match;
            const end = this.forward(position, str.length, regex.lastIndex);

            return {
                type: keywords.hasOwnProperty(str) ? TokenKeyword : TokenIdentifier,
                value: str,
                line: line,
                column: column,
                start: position,
                end: end,
            };
        }

        return null;
    }

    // FIXME: Not yet implemented
    // getTemplateTemplate: createLex('Template'),

});

module.exports = Lexer;
