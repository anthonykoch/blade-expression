#!/bin/bash

BABEL_COMMAND='./node_modules/babel-cli/bin/babel.js --presets=babili --no-comments'

DIST_DIR=dist/
DIST_FILES=$(find dist/*.js -type f ! -name "*min.js")
MIN_FILES=$(find dist/* -type f -name "*min.js")

rm -f $MIN_FILES
mkdir -p "$DIST_DIR"

for file in $DIST_FILES; do
  echo "Minifying $file"
  DIR=$(dirname $file)
  BASENAME=$(basename $file '.js')
  OUTPUT_FILE="$DIR/$BASENAME.min.js"
  $BABEL_COMMAND "$file" > "$OUTPUT_FILE"
done
