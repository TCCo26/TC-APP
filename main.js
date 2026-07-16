const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { startStaticServer } = require('./static-server');

// Required for Windows to correctly attribute/display notifications and
// taskbar grouping when running unpackaged (npm start / the .vbs launcher)
// rather than from an installed .exe — without this, Windows can silently
// drop or misattribute notifications even though the JS-level code is
// correct. Must match package.json's build.appId, and must be set before
// app.whenReady() / before any notification is shown.
if (process.platform === 'win32') {
  app.setAppUserModelId('com.tcco26.lifeosdesktop');
}

// { work: { apiBase }, personal: { apiBase } } — apiBase is a deployed Vercel
// URL for that dashboard's own repo. Empty/missing means /api/* just 404s
// locally, same as opening the dashboard fresh with no backend connected.
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  } catch (e) {
    return {};
  }
}
const CONFIG = loadConfig();

// Ports are fixed (not OS-assigned) so each dashboard's origin — and
// therefore its localStorage — stays the same across restarts. Don't
// change these once you've started using the app for real, or it'll look
// like your data vanished (it'll actually just be sitting under the old
// port's now-unused origin).
const LAUNCHER_ICON = path.join(__dirname, 'build', 'icon.png');

const APPS = {
  work: {
    title: 'Qualitech — Morning Dashboard',
    dir: path.join(__dirname, 'apps', 'work'),
    icon: path.join(__dirname, 'apps', 'work', 'logo.png'),
    port: 47411,
  },
  personal: {
    title: 'Project Jhabes — Life OS',
    dir: path.join(__dirname, 'apps', 'personal'),
    icon: path.join(__dirname, 'apps', 'personal', 'icon.png'),
    port: 47412,
  },
};

// key -> { port, window }
const runtime = {};
let pickerWindow = null;

async function ensureServer(key) {
  if (runtime[key] && runtime[key].port) return runtime[key].port;
  const apiBase = (CONFIG[key] && CONFIG[key].apiBase) || '';
  const { port } = await startStaticServer(APPS[key].dir, apiBase || undefined, APPS[key].port);
  runtime[key] = runtime[key] || {};
  runtime[key].port = port;
  return port;
}

async function openApp(key) {
  const meta = APPS[key];
  if (!meta) return;

  if (runtime[key] && runtime[key].window && !runtime[key].window.isDestroyed()) {
    runtime[key].window.show();
    runtime[key].window.focus();
    return;
  }

  let port;
  try {
    port = await ensureServer(key);
  } catch (e) {
    dialog.showErrorBox(
      'Could not start ' + meta.title,
      `Port ${meta.port} is already in use by something else on this machine, so this dashboard can't start.\n\nClose whatever else is using port ${meta.port} and try again.`
    );
    return;
  }
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 760,
    minHeight: 560,
    title: meta.title,
    icon: meta.icon,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}/`);
  runtime[key] = runtime[key] || {};
  runtime[key].window = win;

  win.on('closed', () => {
    if (runtime[key]) runtime[key].window = null;
  });
}

function createPickerWindow() {
  pickerWindow = new BrowserWindow({
    width: 480,
    height: 360,
    resizable: false,
    title: 'Life OS',
    icon: LAUNCHER_ICON,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'picker-preload.js'),
    },
  });
  pickerWindow.loadFile('picker.html');
  pickerWindow.on('closed', () => { pickerWindow = null; });
}

ipcMain.handle('open-app', (_event, key) => openApp(key));

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(LAUNCHER_ICON);
  }

  createPickerWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPickerWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
