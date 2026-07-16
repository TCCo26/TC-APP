# Life OS Desktop

An Electron launcher that opens two dashboards as native app windows on your laptop, outside the browser:

- **Work** — [tcco26/morning-dashboard](https://github.com/tcco26/morning-dashboard) (Qualitech morning dashboard)
- **Personal** — [tcco26/jm1-dashboard](https://github.com/tcco26/jm1-dashboard) (Project Jhabes life OS)

Launching the app opens a small picker window with two buttons. Each opens its dashboard in its
own window, served from a local static file server on a **fixed** `127.0.0.1` port per app (Work:
`47411`, Personal: `47412` — see `main.js`). Fixed, not random, matters: each dashboard's
`localStorage` (PIN, tasks, everything) is scoped to its exact origin, so a stable port keeps that
origin — and your data — the same across restarts. Don't change these ports once you're using the
app for real.

## How it's put together

- `main.js` — Electron main process: starts a static server per app, opens/focuses windows.
- `static-server.js` — a small dependency-free static file server.
- `picker.html` / `picker-preload.js` — the picker window.
- `apps/work/` and `apps/personal/` — **vendored copies** of each dashboard's static files, not
  git submodules. This repo doesn't fetch them live; see "Updating the dashboards" below.

## Local vs. cloud

Running as a desktop app doesn't mean offline — it's a real Chromium window with your laptop's
normal internet connection, it just isn't wired to either dashboard's backend by default:

- **Finnhub live prices** (Personal → Portfolio) call `finnhub.io` directly from the browser, no
  backend involved — just paste a free API key into that dashboard's own Settings page and it
  works immediately, desktop app or not.
- **Cloud sync** (both dashboards), **TMDb autocomplete** (Personal → Watchlist), and **Pulse
  headlines** (Personal) are server-side — each dashboard's own `api/*.js` Vercel functions. Those
  only exist once you deploy that dashboard's repo to Vercel.

### Pointing this app at a deployed backend

Once a dashboard is deployed on Vercel, edit `config.json` in this repo:

```json
{
  "work": { "apiBase": "https://your-morning-dashboard.vercel.app" },
  "personal": { "apiBase": "https://your-jm1-dashboard.vercel.app" }
}
```

`static-server.js` proxies any `/api/...` request to that URL instead of 404ing — the dashboards'
own code is unchanged, they already call their APIs with relative paths. Leave either `apiBase`
blank to keep that app local-only. Restart the app after editing `config.json`.

### Deploying a dashboard to Vercel

Same steps for either repo (`tcco26/morning-dashboard` or `tcco26/jm1-dashboard`):

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the GitHub repo. No build
   settings needed (it's static + serverless functions, Vercel detects `api/` automatically).
2. **Storage → Create Database → Upstash for Redis** (free tier), connect it to the project. This
   auto-injects the `KV_REST_API_URL`/`TOKEN` (or `UPSTASH_REDIS_REST_URL`/`TOKEN`) env vars both
   dashboards' sync endpoints look for.
3. For `morning-dashboard` only: **Settings → Environment Variables** → add `DASHBOARD_PIN` (a PIN
   you choose — gates the sync endpoint server-side).
4. For `jm1-dashboard` only, if you want TMDb autocomplete: add `TMDB_API_KEY` (free key from
   [themoviedb.org](https://www.themoviedb.org/settings/api)). Not needed for cloud sync or
   headlines.
5. Redeploy if you added env vars after the first deploy. Copy the resulting `https://...vercel.app`
   URL into `config.json` as above.
6. Cloud sync itself is turned on *inside* each dashboard (Settings → Cloud sync / rail footer →
   Connect), by entering a PIN there — separate from the `DASHBOARD_PIN` env var, which just gates
   the endpoint.

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
