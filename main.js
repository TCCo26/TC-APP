const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startStaticServer } = require('./static-server');

const APPS = {
  work: {
    title: 'Qualitech — Morning Dashboard',
    dir: path.join(__dirname, 'apps', 'work'),
    icon: path.join(__dirname, 'apps', 'work', 'icon.svg'),
  },
  personal: {
    title: 'Project Jhabes — Life OS',
    dir: path.join(__dirname, 'apps', 'personal'),
    icon: path.join(__dirname, 'apps', 'personal', 'icon.svg'),
  },
};

// key -> { port, window }
const runtime = {};
let pickerWindow = null;

async function ensureServer(key) {
  if (runtime[key] && runtime[key].port) return runtime[key].port;
  const { port } = await startStaticServer(APPS[key].dir);
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

  const port = await ensureServer(key);
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
  createPickerWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPickerWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
