"use strict";
// Electron preload script — secure bridge between main and renderer
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getPlatform: () => process.platform,
    getVersion: () => process.versions.electron,
    getPythonStatus: () => electron_1.ipcRenderer.invoke('get-python-status'),
});
console.log('Preload script loaded');
//# sourceMappingURL=preload.js.map