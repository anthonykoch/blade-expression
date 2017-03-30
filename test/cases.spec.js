'use strict';

const fs = require('fs');
const path = require('path');

const acorn = require('acorn');

const compare = require('./compare');
const Parser = require('../lib/parser');
const Lexer = require('../lib/lexer');

[
    {
        options: {
            throwSourceError: false
        }
    }
].map(({ options: opts }) => {
    compare(path.join(__dirname, './cases/lexer/**/*'), {
        prefix: 'Lexer - ',
        transform: {
            data: ({ data, header }) => {
                const options = Object.assign({}, opts, header.options);
                return Lexer.all(data, options)
            },
            comparator: ({ comparator, header }) => {
                const options = Object.assign({}, opts, header.options);
                return JSON.parse(comparator, options);
            }
        }
    });
});

[
    {
        options: {
            throwSourceError: false
        }
    }
].map(({ options: opts }) => {
    compare(path.join(__dirname, './cases/parser/**/*'), {
        prefix: 'Parser - ',
        transform: {
            data: ({ data, header }) => {
                const options = Object.assign({}, opts, header.options);
                return Parser.parse(data, options).body
            },
            comparator({ comparator, header }) {
                const options = Object.assign({}, opts, header.options);
                return JSON.parse(comparator);
            }
        }
    });
});

// TODO: acorn compare

// [{}].map(({ options: opts }) => {
//     compare(path.join(__dirname, './cases/parser/nodes/ArrayExpression/**/*'), {
//         prefix: 'Acorn - ',
//         exclude: ['./cases/parser/features/**/*'],
//         error: ['message', 'line', 'column'],
//         transform: {
//             data: ({ data, header }) => {
//                 const options = Object.assign({}, opts, header.options);
//                 return Parser.parse(data, options).body
//             },
//             comparator({ comparator }) {
//                 return acorn.parse(comparator).body;
//             }
//         }
//     });
// });
