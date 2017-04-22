'use strict';

module.exports = Lexer;

const { frame, error, cook } = require('./utils');

const Regex = require('./constants/regex');
const Token = require('./constants/tokens');

const { keywords } = require('./constants/grammar');

/**
 * Initiates a lexer object.
 *
 * @param {Object} options
 * @param {String} options.data - The data to be lexed
 * @param {String} options.customDirectives - Custom directives lex
 * @return {this}
 */

const objnoop = Object.freeze({});

/**
 * Creates a lexer object.
 *
 * @param  {Object} options
 * @return {Object}
 */

function Lexer(data, opts) {
  const options = opts || objnoop;
  const { throwSourceError=true, throws=true } = options;
  const source = data.charAt(0) === '\uFEFF' ? data.slice(1) : data;

  this.line             = 1;
  this.column           = 0;
  this.position         = 0;
  this.stash            = [];
  this.source           = this.input = source;
  this.inputLength      = this.source.length;
  this.ended            = false;
  this.throwSourceError = throwSourceError;
  this.templateStack    = 0;
  this.throws           = throws;

  return this;
}

/**
 * Returns all tokens for a given string.
 *
 * @param  {String} data - The data to be tokenized
 * @param  {String} options - Options to pass to lexer.init
 * @return {Array.<Object>}
 */

Lexer.all = function (data, options) {
  const lexer = new Lexer(data, options);
  const tokens = [];
  let token = null;

  while ((token = lexer.nextToken())) {
    tokens.push(token);
  }

  return tokens;
};

Lexer.prototype = {

  /**
   * Returns a token from the input or `null` if no tokens can be found.
   *
   * @return {Object|null}
   */

  lex() {
    const char = this.source.charCodeAt(this.position);
    let token = null;

    if (char === 46) {
      // .
      token = this.getNumericLiteral() || this.getPunctuator();
    } else if (char === 36 || char === 95) {
      // $ or _
      token = this.getIdentifier();
    } else if (char >= 48 && char <= 57) {
      // 0-9
      token = this.getNumericLiteral();
    } else if (char === 34 || char === 39) {
      // ' or "
      token = this.getStringLiteral();
    } else if (
        // This range also includes numbers, so we check for them first
        char === 96                ||
        char >= 33 && char <= 63   ||
        char >= 123 && char <= 126 ||
        char >= 91 && char <= 94
      ) {
        token =
          this.getTemplateNoSub() ||
          this.getTemplate()      ||
          this.getPunctuator();
    } else {
      token = this.getRealIdentifier();
    }

    if (token == null && this.throws) {
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

    this.error(`Unexpected token "${char}"`, errorInfo);
  },

  /**
   * Handles whitespace for when regex uses sticky flag
   */

  skipWhitespace() {
    const start      = this.position;
    let column       = this.column;
    let line         = this.line;
    let pos          = start;
    let skipped      = 0;
    let previousLine = line;
    let char         = 0;

    while ((char = this.source.charCodeAt(pos))) {
      if (char === 10) {
        line += 1;
      } else if (char === 32 || char === 9) {
        // Keep on movin
      } else if (char === 13) {
        if (this.source.charCodeAt(pos + 1) === 10) {
          pos += 1;
          skipped += 1;
        }

        line += 1;
      } else {
        break;
      }

      pos += 1;
      skipped += 1;

      if (line > previousLine) {
        column = 0;
      } else {
        column += 1;
      }

      previousLine = line;
    }

    this.input    = this.input.substring(skipped, this.inputLength);
    this.position = start + skipped;
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

  lookahead(index, item=index) {
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

    return stash[item - 1] || null;
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
    throw error(message, {
      name:   'LexerError',
      source: this.source,
      frames: this.throwSourceError,
      line,
      column,
    });
  },

  /**
   * Advances the lexer's position  and column based on whether or
   * not the lexer is using sticky regex.
   *
   * @param {Number} start     - The starting position before lexing
   * @param {Number} length    - The length of the matched string
   * @return {Number} - The new position
   */

  forward(value) {
    this.input     = this.input.substring(value.length, this.inputLength);
    this.position += value.length;

    let line = this.line;
    let column = this.column;

    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(0);

      if (char === 10) {
        // \n
        line++;
        column = 0;
      } else if (char === 13) {
        // \r
        line++;
        column = 0;
        if (value.charCodeAt(i + 1) === 10) {
          i++; // skip the \n
        }
      } else {
        column++;
      }
    }

    this.line = line;
    this.column = column;

    return this.position;
  },

  getTemplate() {
    let token = this.getTemplateHead();


    if (token == null && this.templateStack > 0) {
      token = this.getTemplateTail() || this.getTemplateMiddle();
    }

    if (token) {
      if (token.type === Token.TemplateHead) {
        this.templateStack++;
      } else if (token.type === Token.TemplateTail) {
        this.templateStack--;
      }
    }

    return token;
  },

  /**
   * Gets an identifier
   */

  getRealIdentifier() {
    const token = this.getIdentifier();

    if (token) {
      if (token.value === 'true' || token.value === 'false') {
        token.type = Token.BooleanLiteral;
      } else if (token.value === 'null') {
        token.type = Token.NullLiteral;
      } else if (keywords.hasOwnProperty(token.value)) {
        token.type = Token.Keyword;
      }
    }

    return token;
  },

};

function createTokenGetter(regex, type, tokenName) {
  return function () {
    const match = regex.exec(this.input);

    if (match) {
      const start  = this.position;
      const line   = this.line;
      const column = this.column;
      let value    = match[0];

      // if (
      //     type === Token.TemplateTail      ||
      //     type === Token.TemplateHead      ||
      //     type === Token.getTemplateMiddle ||
      //     type === Token.StringLiteral
      //   ) {
      //   if (this.cook && value.indexOf('\\') > -1) {
      //     value = cook(value);
      //   }
      // }

      const end = this.forward(value);

      return { type, value, line, column, start, end };
    }

    return null;
  };
}

Object.keys(Regex).reduce((proto, tokenName) => {
  proto[`get${tokenName}`] = createTokenGetter(Regex[tokenName], Token[tokenName], tokenName);
  // console.log(tokenName);

  return proto;
}, Lexer.prototype);
