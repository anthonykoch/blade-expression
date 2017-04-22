'use strict';

module.exports = {
  count,
  frame,
  replace,
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

function frame(source, { line: _line, column: _column, shown: _shown=3 }) {
  const lines    = source.split(/\r\n|[\r\n]/g);
  const shown    = betwixt(_shown, 1, 15);
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

          if (isFinite(_column)) {
            // - 1 when repeating column spaces because of the caret itself
            suffix = `\n${repeat(' ', padding)} | ${repeat(' ', column - 1)}^` ;
          }
        }

        return `${padStart(prefix, padding, ' ')} | ${content}${suffix}`;
      }).join('\n');

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
