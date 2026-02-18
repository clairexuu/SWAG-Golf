import { BrowserWindow } from 'electron';
/**
 * Initialize the auto-updater. Call once after the main window is created.
 *
 * - Checks for updates 5s after launch, then every 4 hours
 * - Prompts user before downloading (no auto-download)
 * - Downloads in background, then offers restart
 * - Errors are logged silently (never interrupts the user)
 */
export declare function initAutoUpdater(mainWindow: BrowserWindow): void;
