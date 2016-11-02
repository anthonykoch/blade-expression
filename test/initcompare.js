'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');
const glob = require('glob');
const test = require('tape');

const {	Parser } = require('./utils');

function parse(data, options) {
	return Parser.parse(data, options);
}

exports.initCompare = function (pattern) {
	glob
		.sync(pattern)
		.map((dir) => glob.sync(path.join(dir, '*.js')))
		.filter((files) => files.length)
		// .map((files) => console.log(files) || files)
		.map((files) => {
			return files
				.map((file) => {
					const parts = path.parse(file);
					const dirs = parts.dir
						.replace(/\//g, '/')
						.split(/\//g);
					const nodeName = dirs.pop();

					return {
						testInfo: require(file),
						basename: parts.name,
						nodeName,
						file,
					};
				})
				.filter(({ nodeName, testInfo: { skip, data, node }}) => {
					if ('string' !== typeof data) {
						throw new Error(`Invalid data in \n${file}`);
					} else if ( ! node || 'object' !== typeof node) {
						throw new Error(`Invalid node in \n${file}`);
					}

					if (skip) {
						console.log(`Skipping ${nodeName}: ${skip}`)
						return false;
					}

					return true;
				});
		})
		.filter((arr) => arr.length)
		.map((files) => {
			let name;
			const hasOnly = files.reduce((ret, info) => {
				if (info.testInfo.only) {
					return true;
				}

				name = info.nodeName;
				return ret;
			}, false);

			const testOptions = { objectPrintDepth : 100 };
			const message = `Node '${name}' matches expected`;

			if (hasOnly) {
				test.only(message, testOptions, assertionTest);
			} else {
				test(message, testOptions, assertionTest);
			}

			function assertionTest(assert) {
				files
					.forEach((info) => {
						const {
							file,
							nodeName,
							basename,
							testInfo: { data, context, node, only, skip },
						} = info;
						const ast = parse(data, { context }).body[0].expression;

						if (hasOnly && only) {
							assert.deepEquals(ast, node, basename);
						} else {
							assert.deepEquals(ast, node, basename);
						}
					});

				assert.end();
			}
		});
};
