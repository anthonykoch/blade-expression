'use strict';

const path = require('path');

const glob = require('glob');

glob
    .sync(path.join(__dirname, './**/*.spec.js'))
    .forEach(file => {
        require(path.resolve(file));
    });
