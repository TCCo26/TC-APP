# Life OS Desktop

An Electron launcher that opens two dashboards as native app windows on your laptop, outside the browser:

- **Work** — [tcco26/morning-dashboard](https://github.com/tcco26/morning-dashboard) (Qualitech morning dashboard)
- **Personal** — [tcco26/jm1-dashboard](https://github.com/tcco26/jm1-dashboard) (Project Jhabes life OS)

Launching the app opens a small picker window with two buttons. Each opens its dashboard in its
own window, served from a local static file server on an OS-assigned `127.0.0.1` port (so each
dashboard keeps its own separate origin, same as it would in a browser — separate `localStorage`,
separate service worker scope for Work's PWA behavior).

## How it's put together

- `main.js` — Electron main process: starts a static server per app, opens/focuses windows.
- `static-server.js` — a small dependency-free static file server.
- `picker.html` / `picker-preload.js` — the picker window.
- `apps/work/` and `apps/personal/` — **vendored copies** of each dashboard's static files, not
  git submodules. This repo doesn't fetch them live; see "Updating the dashboards" below.

## Local vs. cloud

Both dashboards work fully offline in this desktop build (local storage on your laptop only).
Neither is wired up to a live Vercel deployment here, so:

- Cloud sync (either dashboard), Finnhub live prices, and TMDb autocomplete are inactive —
  same as opening either dashboard in a fresh browser profile with no PIN/API keys set.
- If you later want those working here, the fix is the same for either app: point its relative
  `/api/...` calls at your deployed Vercel URL instead of (or via a proxy in front of) the local
  static server. Ask for this to be wired in if you want it — it needs your deployed URL(s).

## Running in development

```
npm install
npm start
```

## Updating the dashboards

The `apps/work` and `apps/personal` folders are snapshots, not live links. To pull in the latest
from each source repo:

```
./scripts/update-work.sh /path/to/your/morning-dashboard/checkout
./scripts/update-personal.sh /path/to/your/jm1-dashboard/checkout
git add apps && git commit -m "Update vendored dashboards"
```

## Building an installer

```
npm run dist
```

Produces a platform-specific installer in `dist/` (DMG on macOS, NSIS installer on Windows,
AppImage on Linux) via `electron-builder`, using whichever platform you run it on.

**App icons**: `build/icon.icns` (mac), `build/icon.ico` (Windows), and `build/icon.png` (Linux,
512×512) aren't included yet — `apps/work/icon.svg` and `apps/personal/icon.svg` are the source
marks to convert (e.g. via an online SVG→ICNS/ICO converter, or `electron-icon-builder` with
ImageMagick installed). Without them, `electron-builder` falls back to the default Electron icon.

**Cross-platform builds**: `electron-builder` builds for the OS it runs on by default (a proper
signed DMG needs to be built on macOS, an NSIS installer is easiest on Windows). If you want CI to
build all three from one push, that's a follow-up (GitHub Actions matrix build) — not set up yet.
