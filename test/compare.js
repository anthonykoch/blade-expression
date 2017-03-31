'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');

const glob = require('glob');
const fm = require('front-matter');
const test = require('tape');
const dedent = require('dedent-js');

// Splits a string, normalizing line endings and filtering empty lines
const split = str => str.replace(/\r\n|\r/g, '\n')
                        .split(/\n/g)
                        .filter(line => line.trim().length);

// Plucks keys from an object
const pluck = (keys, from) => {
    return keys.reduce((obj, key) => {
        if (from.hasOwnProperty(key)) {
            obj[key] = from[key];
        }

        return obj;
    }, {});
};
/**
 * Compares a data file with a comparator file. Each transform function
 * is passed an object containing the its respective data as `value`, the
 * yaml front matter as `header`, the data file name as `dataFile`, and
 * the comparator file as `comparatorFile`.
 *
 * The modifiers are "error", "expected", and "multiple", where "multiple"
 * modifies the first two.
 *
 * "error" expects the data transform to throw an
 * error, and throws one itself if it doesn't. The error object is compared
 * against the user returned comparator.
 *
 * "expected" checks deep equality of the two transform results.
 *
 * "multiple" will run the transforms on each line of each file. Empty lines
 * are ignored.
 *
 * @param  {String} pattern - The pattern for the data files
 * @param  {Function} options.transform.data
 *  - The transform for the data before it's compared
 * @param  {Function} options.transform.comparator
 *  - The transform for the comparator data before it's compared
 * @param  {Object} options.ext.data - The ext for data files (required)
 * @return {void}
 */

function compare(pattern, options) {
    const {
        prefix='',
        depth: objectPrintDepth=30,
        exclude,
        errorProps=['message', 'line', 'column'],
        transform,
        ext: { data: dExt='js', comparator: cExt='json' }={},
    } = options;

    if ([dExt, cExt].some(ext => typeof ext !== 'string')) {
        throw new Error('compare: Invalid extentions');
    }

    const comparatorExt = cExt.replace(/^\.+/g, '');
    const dataExt = dExt.replace(/^\.+/g, '');
    const regext = new RegExp(`.${comparatorExt}$`)
    const files =
        glob
            .sync(pattern, { exclude })
            .filter(file => regext.test(file));

    let stop = false;

    const promises =
        files.map(file => {
            const dir = path.dirname(file);
            const ext = path.extname(file);
            const basename = path.basename(file, ext);
            const [base, ...modifiers] = path.basename(file, ext).split(/\./);
            const comparatorFile = `${dir}/${basename}.${comparatorExt}`;
            const dataFile = `${dir}/${base}.${dataExt}`;

            let data = fs.readFileSync(dataFile, 'utf8');
            let comparatorData = fs.readFileSync(comparatorFile, 'utf8');

            const { attributes: header, body: comparator } = fm(comparatorData);

            const hasMultiple = modifiers.includes('multiple');
            const only = header.only ? 'only' : null;
            const skip = header.skip ? 'skip' : null;
            const title = prefix + header.name;

            let fn;
            let dataWrapper;
            let comparatorWrapper;

            // Normalize to an array of items
            if (hasMultiple) {
                dataWrapper = split(data);
                comparatorWrapper = split(comparator);
            } else {
                dataWrapper = [data];
                comparatorWrapper = [comparator];
            }


            if (modifiers.includes('expected')) {
                fn = t => {
                    // Map through the comparators since it declares the standard
                    try {
                        comparatorWrapper.map((comparator, index) => {
                            const transformArgs = {
                                comparator,
                                data: dataWrapper[index],
                                dataFile,
                                comparatorFile,
                                header
                            };
                            const actual = transform.data(transformArgs);
                            const expected = transform.comparator(transformArgs);
                            t.deepEquals(actual,expected, header.description);
                        });
                    } catch (err) {
                        throw new Error(
                            dedent`
                            compare: deepEqual check threw, use "error" modifier to compare errors:
                              from: ${dataFile}

                              ${err.stack}

                              `
                        );
                    }

                    t.end();
                };
            } else if (modifiers.includes('error')) {
                fn = t => {
                    comparatorWrapper.map((comparator, index) => {
                        const transformArgs = {
                            comparator,
                            data: dataWrapper[index],
                            dataFile,
                            comparatorFile,
                            header
                        };

                        try {
                            transform.data(transformArgs);
                            throw new Error(`compare: Error was not thrown ${dataFile}`);
                        } catch (err) {
                            const actual = pluck(errorProps, err);
                            const expected = transform.comparator(transformArgs);
                            t.deepEquals(actual,
                                expected, (hasMultiple ? `#${index} ` : '') + header.description);
                        }
                    });

                    t.end();
                }
            } else {
                const message =
                    `Unknown modifier "${modifiers}" from filename ${dataFile}`;
                throw new Error(message);
            }

            // tape will throw with multiple onlys, so we have to stop
            if (stop) {
                return;
            }

            if (only) {
                test.only(title, { objectPrintDepth }, fn);
                stop = true;
            } else if (skip) {
                if (options.onSkip) {
                    options.onSkip(dataFile);
                }

                test.skip(title, { objectPrintDepth }, fn);
            } else {
                test(title, { objectPrintDepth }, fn);
            }
        });
}

module.exports = compare;
