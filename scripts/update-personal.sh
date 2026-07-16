#!/usr/bin/env bash
# Refreshes apps/personal from a local checkout of tcco26/jm1-dashboard.
# Usage: ./scripts/update-personal.sh /path/to/jm1-dashboard
set -e
SRC="${1:?Usage: update-personal.sh /path/to/jm1-dashboard}"
cd "$(dirname "$0")/.."

cp "$SRC/index.html" apps/personal/index.html
# apps/personal/icon.svg is maintained in this repo (jm1-dashboard has none).

echo "apps/personal updated from $SRC"
