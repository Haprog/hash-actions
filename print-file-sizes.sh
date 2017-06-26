#!/bin/sh
FILE_SRC='src/hash-actions.js'
FILE_NOMIN='lib/hash-actions.js'
FILE_MIN='lib/hash-actions.min.js'

SIZE_SRC=$(ls -nl "$FILE_SRC" | awk '{print $5}')
SIZE_NOMIN=$(ls -nl "$FILE_NOMIN" | awk '{print $5}')
SIZE_NOMIN_GZ=$(gzip -c "$FILE_NOMIN" | wc -c | awk '{print $1}')
SIZE_MIN=$(ls -nl "$FILE_MIN" | awk '{print $5}')
SIZE_MIN_GZ=$(gzip -c "$FILE_MIN" | wc -c | awk '{print $1}')

echo "$SIZE_SRC bytes ES6 source (non-minified)"
echo "$SIZE_NOMIN bytes built non-minified"
echo "$SIZE_NOMIN_GZ bytes built non-minified gzipped"
echo "$SIZE_MIN bytes built minified"
echo "$SIZE_MIN_GZ bytes built minified gzipped"
