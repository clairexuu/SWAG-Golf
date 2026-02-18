// Auto-updater — checks GitHub Releases for new versions and applies updates

import { autoUpdater, UpdateInfo } from 'electron-updater';
import { BrowserWindow, dialog, ipcMain, app } from 'electron';

/**
 * Initialize the auto-updater. Call once after the main window is created.
 *
 * - Checks for updates 5s after launch, then every 4 hours
 * - Prompts user before downloading (no auto-download)
 * - Downloads in background, then offers restart
 * - Errors are logged silently (never interrupts the user)
 */
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdate] Checking for update...');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log(`[AutoUpdate] Update available: ${info.version}`);
    promptUserForUpdate(mainWindow, info);
  });

  autoUpdater.on('update-not-available', () => {
    console.log(`[AutoUpdate] Current version ${app.getVersion()} is up to date.`);
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[AutoUpdate] Downloading: ${Math.round(progress.percent)}%`);
    mainWindow.webContents.send('update-download-progress', progress.percent);
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log(`[AutoUpdate] Update downloaded: ${info.version}`);
    promptUserToRestart(mainWindow, info);
  });

  autoUpdater.on('error', (err: Error) => {
    console.error('[AutoUpdate] Error:', err.message);
  });

  // Allow renderer to trigger a manual check
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { available: !!result?.updateInfo, version: result?.updateInfo?.version };
    } catch (err) {
      return { available: false, error: (err as Error).message };
    }
  });

  // First check: 5 seconds after launch
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[AutoUpdate] Initial check failed:', err.message);
    });
  }, 5_000);

  // Recurring check: every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[AutoUpdate] Periodic check failed:', err.message);
    });
  }, 4 * 60 * 60 * 1000);
}

async function promptUserForUpdate(win: BrowserWindow, info: UpdateInfo): Promise<void> {
  const { response } = await dialog.showMessageBox(win, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available. You are currently on version ${app.getVersion()}.`,
    detail: 'Would you like to download the update now? The download happens in the background.',
    buttons: ['Download Update', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (response === 0) {
    autoUpdater.downloadUpdate();
  }
}

async function promptUserToRestart(win: BrowserWindow, info: UpdateInfo): Promise<void> {
  const { response } = await dialog.showMessageBox(win, {
    type: 'info',
    title: 'Update Ready',
    message: `Version ${info.version} has been downloaded.`,
    detail: 'The update will be installed when you restart the app. Restart now?',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (response === 0) {
    autoUpdater.quitAndInstall();
  }
}
