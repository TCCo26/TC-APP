#!/usr/bin/env bash
# Refreshes apps/personal from a local checkout of tcco26/jm1-dashboard.
# Usage: ./scripts/update-personal.sh /path/to/jm1-dashboard
set -e
SRC="${1:?Usage: update-personal.sh /path/to/jm1-dashboard}"
cd "$(dirname "$0")/.."

cp "$SRC/index.html" apps/personal/index.html
cp "$SRC/manifest.json" apps/personal/manifest.json
cp "$SRC/sw.js" apps/personal/sw.js
# apps/personal/icon.png is maintained in this repo (used as the Electron
# window icon; jm1-dashboard's own icon-*.png/apple-touch-icon.png are for
# its own PWA install, a separate concern from the desktop app's icon).

echo "apps/personal updated from $SRC"
