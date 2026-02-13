import { ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';
export interface PythonConfig {
    pythonBin: string;
    dataDir: string;
    envFilePath: string;
    requirementsPath: string;
    port: number;
}
/**
 * Ensure standalone Python is available. Downloads it if not present.
 * This app always uses its own managed Python build — never system Python.
 */
export declare function findOrDownloadPython(dataDir: string, splashWindow?: BrowserWindow | null): Promise<string>;
/**
 * Ensure all Python dependencies are installed.
 * Installs directly into the standalone Python — no venv needed.
 * Uses a hash of requirements.txt to detect when reinstallation is needed.
 */
export declare function ensurePythonDeps(config: PythonConfig, splashWindow?: BrowserWindow | null): Promise<void>;
/**
 * Get recent Python output (for diagnostics when health check fails).
 */
export declare function getRecentPythonOutput(): string;
/**
 * Start the Python FastAPI backend as a child process.
 */
export declare function startPythonBackend(config: PythonConfig): ChildProcess;
/**
 * Wait for the Python backend to respond to health checks.
 */
export declare function waitForPythonHealth(port?: number, maxWaitMs?: number): Promise<boolean>;
