"use strict";
// Electron preload script - secure bridge between main and renderer
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// IPC without exposing the entire ipcRenderer module
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
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
//# sourceMappingURL=preload.js.map