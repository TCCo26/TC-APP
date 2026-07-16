const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcher', {
  openApp: (key) => ipcRenderer.invoke('open-app', key),
});
