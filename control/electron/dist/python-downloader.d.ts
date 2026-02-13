import { BrowserWindow } from 'electron';
export interface StandalonePythonPaths {
    pythonBin: string;
    baseDir: string;
}
/**
 * Get the expected directory where standalone Python is installed.
 */
export declare function getStandalonePythonDir(userDataDir: string): string;
/**
 * Check if a valid standalone Python is already downloaded.
 */
export declare function isStandalonePythonInstalled(userDataDir: string): boolean;
/**
 * Get paths to the standalone Python installation.
 * Returns null if not installed.
 */
export declare function getStandalonePythonPaths(userDataDir: string): StandalonePythonPaths | null;
/**
 * Download and install standalone Python.
 * Reports progress to the splash window.
 */
export declare function downloadStandalonePython(userDataDir: string, splashWindow?: BrowserWindow | null): Promise<StandalonePythonPaths>;
