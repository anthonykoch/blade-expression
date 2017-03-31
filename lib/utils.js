'use strict';

module.exports = {
  createSourceError,
  replace,
  count
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
  for (let str in replacers) {
    data = data.replace(new RegExp(`{${str}}`, 'g'), replacers[str])
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

const toLine = num => num + 1;

function createSourceError(options) {
  const { name,
      line: _line,
      column: _column,
      source,
      message='',
      filename='[Source]' } = options;

  const column = _column + 1;
  const isLineNumber  = (typeof _line === 'number' && isFinite(_line));
  const isColumnNumber = typeof column === 'number' && column === column;
  const tolerance = 3;
  let errorMessage;

  if (isLineNumber) {
    // TODO: Might want to optimize this in case the string is large
    const lines  = source.split('\n');
    const length = lines.length;

    // Restrict the line to be between 0 and the total number of lines
    const line   = Math.min(lines.length, Math.max(_line, 1));

    const _start = Math.min(length - tolerance, Math.max(line - tolerance - 1));
    const start  = Math.max(_start, 0);
    const end    = Math.min(length, line + tolerance);

    // Pointer line can not be more or less than the start
    const pointerLine = Math.max(start, Math.min(line, end));

    const linecol =
      isLineNumber && isColumnNumber
        ? ` (${pointerLine}:${_column})`
        : '';

    const header  = `${filename}:${message ? ' ' + message : ''}${linecol}\n`;
    const padding = lines.length.toString().length + POINTER.length;

    errorMessage = header +
      lines.slice(start, end).map(function (text, index) {
        const currentLine = start + index + 1;
        let beginning = String(currentLine);
        let leadingSpace;
        let arrowSpacing;

        if (currentLine === pointerLine) {
          beginning = POINTER + beginning;

          if (isColumnNumber) {
            leadingSpace = repeat(' ', padding + 1);
            arrowSpacing = repeat(' ', Math.max(0, column));
            text =
            `${text}\n${leadingSpace} ${arrowSpacing}^`;
          }
        }

        return `${padStart(beginning, padding, ' ')} | ${text}\n`;
      })
      .join('');
  } else {
    errorMessage = message;
  }

  const err = new Error(errorMessage);
  err.message = errorMessage;
  err.name = name;
  err.line = _line;
  err.column = column;
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
