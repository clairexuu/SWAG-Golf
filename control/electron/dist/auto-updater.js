"use strict";
// Auto-updater — checks GitHub Releases for new versions and applies updates
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAutoUpdater = initAutoUpdater;
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
/**
 * Initialize the auto-updater. Call once after the main window is created.
 *
 * - Checks for updates 5s after launch, then every 4 hours
 * - Prompts user before downloading (no auto-download)
 * - Downloads in background, then offers restart
 * - Errors are logged silently (never interrupts the user)
 */
function initAutoUpdater(mainWindow) {
    electron_updater_1.autoUpdater.autoDownload = false;
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
    electron_updater_1.autoUpdater.on('checking-for-update', () => {
        console.log('[AutoUpdate] Checking for update...');
    });
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        console.log(`[AutoUpdate] Update available: ${info.version}`);
        promptUserForUpdate(mainWindow, info);
    });
    electron_updater_1.autoUpdater.on('update-not-available', () => {
        console.log(`[AutoUpdate] Current version ${electron_1.app.getVersion()} is up to date.`);
    });
    electron_updater_1.autoUpdater.on('download-progress', (progress) => {
        console.log(`[AutoUpdate] Downloading: ${Math.round(progress.percent)}%`);
        mainWindow.webContents.send('update-download-progress', progress.percent);
    });
    electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
        console.log(`[AutoUpdate] Update downloaded: ${info.version}`);
        promptUserToRestart(mainWindow, info);
    });
    electron_updater_1.autoUpdater.on('error', (err) => {
        console.error('[AutoUpdate] Error:', err.message);
    });
    // Allow renderer to trigger a manual check
    electron_1.ipcMain.handle('check-for-updates', async () => {
        try {
            const result = await electron_updater_1.autoUpdater.checkForUpdates();
            return { available: !!result?.updateInfo, version: result?.updateInfo?.version };
        }
        catch (err) {
            return { available: false, error: err.message };
        }
    });
    // First check: 5 seconds after launch
    setTimeout(() => {
        electron_updater_1.autoUpdater.checkForUpdates().catch((err) => {
            console.error('[AutoUpdate] Initial check failed:', err.message);
        });
    }, 5_000);
    // Recurring check: every 4 hours
    setInterval(() => {
        electron_updater_1.autoUpdater.checkForUpdates().catch((err) => {
            console.error('[AutoUpdate] Periodic check failed:', err.message);
        });
    }, 4 * 60 * 60 * 1000);
}
async function promptUserForUpdate(win, info) {
    const { response } = await electron_1.dialog.showMessageBox(win, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available. You are currently on version ${electron_1.app.getVersion()}.`,
        detail: 'Would you like to download the update now? The download happens in the background.',
        buttons: ['Download Update', 'Later'],
        defaultId: 0,
        cancelId: 1,
    });
    if (response === 0) {
        electron_updater_1.autoUpdater.downloadUpdate();
    }
}
async function promptUserToRestart(win, info) {
    const { response } = await electron_1.dialog.showMessageBox(win, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail: 'The update will be installed when you restart the app. Restart now?',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
    });
    if (response === 0) {
        electron_updater_1.autoUpdater.quitAndInstall();
    }
}
//# sourceMappingURL=auto-updater.js.map