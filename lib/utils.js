'use strict';

module.exports = {
  count,
  frame,
  error,
  isNumber,
  replace,
  hexValue,
  cook,
};

const padStart = require('pad-start');
const repeat = require('repeat-string');

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
  return Object.keys(replacers)
    .reduce((str, key) => {
      return str.replace(new RegExp(`\\{ *${key} *\\}`, 'g'), replacers[key]);
    }, data);
}


const betwixt = (number, min, max) => Math.min(Math.max(min, number), max);

/**
 * Creates a code frame for error reporting. Line numbers should start
 * at 1 and columns should start at 1. The line is required but the column
 * is optional. When the column is not passed, the frame will not point to
 * the column with the caret.
 *
 * @param {String} source - The source with which to create the frames from
 * @param {Number} options.line - The line on which the error occurred
 * @param {Number} [options.column] - The column on which the error occured
 * @param {Number} [options.shown=3] - The number of lines to show
 */

function frame(source, { line: _line, column: _column, shown: _shown }) {
  const lines    = source.toString().split(/\r\n|[\r\n]/g);
  const shown    = betwixt(_shown || 3, 1, 15);
  // - 1 because array indexing starts at 0
  const line     = betwixt(_line, 1, lines.length) - 1;
  const column   = Math.max(1, _column);
  // Between lowest array indexing point and number of lines
  const start    = betwixt(line, 0, lines.length);
  // No lower than the starting line and no more than the number of lines
  const end      = betwixt(start + shown, start, lines.length);
  const padding  = String(line).length + 2;

  const frames =
    lines
      .slice(start, end)
      .map((content, lineNumber) => {
        // Back up 1 because line counting starts at 1 and lineNumber starts at 0
        const currentLine = start + lineNumber + 1;
        const displayLine = String(currentLine);
        let prefix = displayLine;
        let suffix = '';

        if (currentLine === (line + 1)) {
          prefix = `> ${displayLine}`;

          if (isNumber(_column)) {
            // - 1 when repeating column spaces because of the caret itself
            suffix = `\n${repeat(' ', padding)} | ${repeat(' ', column - 1)}^`;
          }
        }

        return `${padStart(prefix, padding, ' ')} | ${content}${suffix}`;
      })
      .join('\n');

  return frames;
}

/**
 * Counts the number of occurences of a string.
 *
 * @param {String} str The string to count the occurrences.
 */

function count(str, substr) {
  let index = str.indexOf(substr);
  let occurrences = 0;

  while (index !== -1) {
    index = str.indexOf(substr, index + 1);
    occurrences = occurrences + 1;
  }

  return occurrences;
}

/**
 * Returns an error object with a message. A code frame will be added
 * if line is a finite number.
 *
 * @param  {String} message          - The message for the error
 * @param  {Number} [options.line]   - The line number for the code frame
 * @param  {Number} [options.column] - The column number for the code frame
 * @return {Error}
 */
function error(message, { name='Error', data={}, frames=true, source, line, column }={}) {
  const code =
    frames && isNumber(line)
      ? ` \n${frame(source, { line, column: column + 1 })}`
      : '';
  const position =
    isNumber(line) && isNumber(column)
      ? ` (${line}:${column})`
      : '';
  const err  = new Error(`${replace(message, data)}${position}${code}`);

  err.name   = name;

  if (isNumber(line)) {
    err.line = line;
  }

  if (isNumber(column)) {
    err.column = column;
  }

  return err;
}

function isNumber(value) {
  return typeof value === 'number' && value === value;
}

const EscapeSequence = /\\(?:(?:x(?:[0-9a-fA-F]{1,2})?|(?:u(?:\{[0-9a-fA-F]*\}?|[0-9a-fA-F]{1,4})?))|(.))/g;
const InvalidEscape = `Invalid {type} escape sequence`;

const EscapeChars = {
  39:  '\'',
  34:  '"',
  92:  '\\',
  98:  '\b',
  102: '\f',
  110: '\n',
  114: '\r',
  116: '\t',
  118: '\v',
};

function hexValue(charCode) {
  if (charCode >= 48 && charCode <= 57) {
    return charCode - 48;
  } else if (charCode >= 97 && charCode <= 102) {
    return charCode - 97 + 10;
  } else if (charCode >= 65 && charCode <= 70) {
    return charCode - 65 + 10;
  }

  return -1;
}

const hexEscapeError     = { data: { type: 'hex' } };
const unicodeEscapeError = { data: { type: 'unicode' } };

function replaceSequence(match, otherEscape) {
  const last           = match.length - 1;
  const char           = match.charCodeAt(1);
  const hasStartBrace  = match.charCodeAt(2) === 123;
  const hasBraceAndHex = hasStartBrace && hexValue(match.charCodeAt(3)) === -1;
  const hasEndBrace    = match.charCodeAt(last) === 125;
  let start            = 2;
  let end              = 0;
  let point            = 0;
  let errorType        = unicodeEscapeError;

  switch (char) {
    case 117:
      // u
      if (hasStartBrace) {
        if ( ! hasEndBrace || hexValue(match.charCodeAt(3)) === -1) {
          throw error(InvalidEscape, unicodeEscapeError);
        }

        start = 3;
        end   = last;
      } else if (hexValue(match.charCodeAt(5)) === -1) {
        throw error(InvalidEscape, unicodeEscapeError);
      } else {
        end = 6;
      }

      break;
    case 120:
      // x
      start = 2;
      end = 4;
      errorType = hexEscapeError;

      if (hexValue(match.charCodeAt(3)) === -1) {
        throw error(InvalidEscape, hexEscapeError);
      }

      break;
    default:
      if (EscapeChars[char]) {
        return EscapeChars[char];
      }

      return otherEscape;
  }

  for (let i = start; i < end; i++) {
    const index = hexValue(match.charCodeAt(i));

    if (index === -1) {
      error(InvalidEscape, errorType);
    }

    point = (point * 16) + index;
  }

  return hasStartBrace ? fromCodePoint(point) : String.fromCharCode(point);
}

/**
 * Replace escape sequences with their escape sequence value
 * @param {String} data - The data to transform
 * @return {String} - The transformed data
 */

function cook(data) {
  return data.replace(EscapeSequence, replaceSequence);
}

/**
 * A cheap version of String.fromCodePoint polyfill
 */

function fromCodePoint(point) {
  if (point < 0 || point > 0x10FFFF) {
    throw error('Invalid unicode code-point');
  }

  if (point <= 0xFFFF) {
    return String.fromCharCode(point);
  }

  const code = point - 0x10000;
  const highSurrogate = (code >> 10) + 0xD800;
  const lowSurrogate = (code % 0x400) + 0xDC00;

  return String.fromCharCode(highSurrogate, lowSurrogate);
}
