// Electron preload script - secure bridge between main and renderer

import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// IPC without exposing the entire ipcRenderer module
contextBridge.exposeInMainWorld('electronAPI', {
  // Add IPC methods here as needed
  // Example:
  // getPlatform: () => process.platform,
  // getVersion: () => process.versions.electron,
});

// For MVP, this is minimal. Will be extended when we add:
// - File system access for downloads
// - Python subprocess communication
// - Native notifications
// - etc.

console.log('Preload script loaded');
