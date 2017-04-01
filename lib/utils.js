'use strict';

module.exports = {
  createSourceError,
  replace,
  count,
};

const padStart = require('pad-start');
const repeat = require('repeat-string');

const POINTER = '> ';

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
  const {
      name,
      line: originalLine,
      column: originalColumn,
      source,
      message,
      showSource=true,
      show=3,
      filename='[Source]',
    } = options;

  const column = originalColumn;
  const isLineNumber  = (typeof originalLine === 'number' && isFinite(originalLine));
  const isColumnNumber = typeof column === 'number' && isFinite(column);
  const linecol = isLineNumber && isColumnNumber ? ` (${originalLine}:${originalColumn})` : '';
  let errorMessage = `${message}${linecol}`;

  if (showSource) {
    // TODO: Might want to optimize this in case the string is large
    const headerMessage = message ? ` ${message}` : message;
    const lines  = source.split('\n');
    const length = lines.length;

    // Restrict the line to be between 0 and the total number of lines
    const line   = Math.min(lines.length, Math.max(originalLine, 1));
    const _start = Math.min(length - show, Math.max(line - show - 1));
    const start  = Math.max(_start, 0);
    const end    = Math.min(length, line + show);

    // Pointer line can not be more or less than the start
    const pointerLine = Math.max(start, Math.min(line, end));
    const padding = lines.length.toString().length + POINTER.length;

    const sourceLines = lines
      .slice(start, end)
      .map((text, index) => {
        const currentLine = start + index + 1;
        let beginning    = String(currentLine);
        let leadingSpace = '';
        let arrowSpacing = '';
        let lineText     = text;

        if (currentLine === pointerLine) {
          beginning = POINTER + beginning;

          if (isColumnNumber) {
            leadingSpace = repeat(' ', padding + 1);
            arrowSpacing = repeat(' ', Math.max(0, column));
            lineText = `${text}\n${leadingSpace} ${arrowSpacing}^`;
          }
        }

        return `${padStart(beginning, padding, ' ')} | ${lineText}\n`;
      })
      .join('');

    errorMessage = `${filename}:${headerMessage}${linecol}\n${sourceLines}`;
  }

  const err = new Error(errorMessage);

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
  let index = str.indexOf(substr);
  let occurrences = 0;

  while (index !== -1) {
    index = str.indexOf(substr, index + 1);
    occurrences = occurrences + 1;
  }

  return occurrences;
}
