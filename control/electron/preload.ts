// Electron preload script — secure bridge between main and renderer

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => process.platform,
  getVersion: () => process.versions.electron,
  getPythonStatus: () => ipcRenderer.invoke('get-python-status'),
});

console.log('Preload script loaded');
