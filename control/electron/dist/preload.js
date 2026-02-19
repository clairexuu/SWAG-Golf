"use strict";
// Electron preload script — secure bridge between main and renderer
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getPlatform: () => process.platform,
    getVersion: () => process.versions.electron,
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    getPythonStatus: () => electron_1.ipcRenderer.invoke('get-python-status'),
    restartBackend: () => electron_1.ipcRenderer.invoke('restart-python-backend'),
    checkForUpdates: () => electron_1.ipcRenderer.invoke('check-for-updates'),
    onUpdateProgress: (callback) => {
        electron_1.ipcRenderer.on('update-download-progress', (_event, percent) => callback(percent));
    },
});
console.log('Preload script loaded');
//# sourceMappingURL=preload.js.map