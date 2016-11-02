'use strict';

const path = require('path');

const {	initCompare } = require('../initcompare');

initCompare(path.join(__dirname, './nodes/*/'));
initCompare(path.join(__dirname, './complex-nodes/*/'));
