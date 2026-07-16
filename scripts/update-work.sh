#!/usr/bin/env bash
# Refreshes apps/work from a local checkout of tcco26/morning-dashboard.
# Usage: ./scripts/update-work.sh /path/to/morning-dashboard
set -e
SRC="${1:?Usage: update-work.sh /path/to/morning-dashboard}"
cd "$(dirname "$0")/.."

cp "$SRC/index.html" apps/work/index.html
cp "$SRC/manifest.json" apps/work/manifest.json
cp "$SRC/sw.js" apps/work/sw.js
# sw.js's cache-on-install list (SHELL) fails entirely if any one file in it
# 404s, so every icon file sw.js/manifest.json can reference needs to exist
# here too — not just the one used as the Electron window icon (logo.png,
# maintained separately in this repo, not overwritten by this script).
for f in icon-192.png icon-512.png apple-touch-icon.png; do
  if [ -f "$SRC/$f" ]; then cp "$SRC/$f" "apps/work/$f"; fi
done

echo "apps/work updated from $SRC"
