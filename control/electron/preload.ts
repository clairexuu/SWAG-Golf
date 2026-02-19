// Electron preload script — secure bridge between main and renderer

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getPlatform: () => process.platform,
  getVersion: () => process.versions.electron,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPythonStatus: () => ipcRenderer.invoke('get-python-status'),
  restartBackend: () => ipcRenderer.invoke('restart-python-backend'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateProgress: (callback: (percent: number) => void) => {
    ipcRenderer.on('update-download-progress', (_event, percent) => callback(percent));
  },
});

console.log('Preload script loaded');
