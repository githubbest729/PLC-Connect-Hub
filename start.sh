#!/bin/sh
cd "$(dirname "$0")/backend" || exit 1
[ -d node_modules ] || npm install
node server.js "$@"