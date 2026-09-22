#!/usr/bin/env bash
# Rebuilds dist/deck.html — the whole deck as one self-contained file.
# Installs the build dependencies first if they aren't there yet.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules/esbuild ] || [ ! -d node_modules/d3 ]; then
  echo "Installing build dependencies…"
  npm install
fi

node tools/build-standalone.mjs
echo "Open it with: open dist/deck.html"
