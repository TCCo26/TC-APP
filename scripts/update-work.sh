#!/usr/bin/env bash
# Refreshes apps/work from a local checkout of tcco26/morning-dashboard.
# Usage: ./scripts/update-work.sh /path/to/morning-dashboard
set -e
SRC="${1:?Usage: update-work.sh /path/to/morning-dashboard}"
cd "$(dirname "$0")/.."

cp "$SRC/index.html" apps/work/index.html
cp "$SRC/manifest.json" apps/work/manifest.json
cp "$SRC/sw.js" apps/work/sw.js
# apps/work/icon.svg is kept as-is unless the source repo's changed too.
if [ -f "$SRC/icon.svg" ]; then cp "$SRC/icon.svg" apps/work/icon.svg; fi

echo "apps/work updated from $SRC"
