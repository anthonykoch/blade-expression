'use strict';

// module.exports = Lexer;

const { createSourceError } = require('./utils');

const Regex = require('./constants/regex');

const {
    TokenKeyword,
    TokenIdentifier,
    TokenPunctuator,
    TokenNullLiteral,
    TokenBooleanLiteral,
    TokenStringLiteral,
    TokenNumericLiteral,
  } = require('./constants/tokens');

const { keywords } = require('./constants/grammar');

const Lexer = {

  /**
   * Creates a lexer object.
   *
   * @param  {Object} options
   * @return {Object}
   */

  create(data, options) {
    return new _Lexer(data, options);
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
    let token = null;

    while ((token = lexer.nextToken())) {
      tokens.push(token);
    }

    return tokens;
  },

};

/**
 * Initiates a lexer object.
 *
 * @param {Object} options
 * @param {String} options.data - The data to be lexed
 * @param {String} options.customDirectives - Custom directives lex
 * @return {this}
 */

function _Lexer(data, opts) {

  const options = opts || {};
  const { throwSourceError=true } = options;

  let source = data.replace(/\r\n|[\n\r]/g, '\n');

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

  return this;
}

_Lexer.prototype = {

  /**
   * Returns a token from the input or `null` if no tokens can be found.
   *
   * @return {Object|null}
   */

  lex() {
    const token = null              ||
      this.getNullLiteralToken()    ||
      this.getBooleanLiteralToken() ||
      this.getNumericLiteralToken() ||
      this.getStringLiteralToken()  ||
      this.getPunctuatorToken()     ||
      this.getIdentifierNameToken();

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
      column: this.column,
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
    let column       = this.column;
    let line         = this.line;
    let pos          = this.position;
    let times        = 0;
    let previousLine = line;
    let char = '';

    while ((char = this.source[pos])) {
      if (char === '\n') {
        line = line + 1;
      } else if (char === ' ' || char === '\t') {
        // Keep on movin
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
    let token = null;

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
    let token = null;

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

  error(message, { line, column }={}) {
    const err = createSourceError({
      name: 'LexError',
      message,
      showSource: this.throwSourceError,
      line,
      column,
      source: this.source,
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

  forward(start, length) {
    this.input = this.input.substring(length, this.inputLength);
    this.position = start + length;
    this.column = this.column + length;

    return this.position;
  },

  getBooleanLiteralToken:
    createLex(Regex.BooleanLiteral, TokenBooleanLiteral),

  getNullLiteralToken:
    createLex(Regex.NullLiteral,    TokenNullLiteral),

  getNumericLiteralToken:
    createLex(Regex.NumericLiteral, TokenNumericLiteral),

  getStringLiteralToken:
    createLex(Regex.StringLiteral,  TokenStringLiteral),

  getPunctuatorToken:
    createLex(Regex.Punctuator,     TokenPunctuator),

  getIdentifierNameToken() {
    const position = this.position;
    const regex = Regex.IdentifierName;
    const line = this.line;
    const column = this.column;
    let match = null;

    regex.lastIndex = 0;

    if ((match = regex.exec(this.input))) {
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
  },

  // FIXME: Not yet implemented
  // getTemplateTemplate: createLex('Template'),

};

function createLex(regex, tokenType) {
  return function lexing() {
    const position = this.position;
    const line = this.line;
    const column = this.column;
    let match = null;

    regex.lastIndex = 0;

    if ((match = regex.exec(this.input))) {
      let { '0': str } = match;
      const end = this.forward(position, str.length, regex.lastIndex);

      return {
        type: tokenType === undefined ? str : tokenType,
        value: str,
        line: line,
        column: column,
        start: position,
        end: end,
      };
    }

    return null;
  };

}

module.exports = Lexer;
