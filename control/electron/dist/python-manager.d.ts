import { ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';
/**
 * Decrypt an .env.encrypted file and return all key-value pairs
 * (both the plaintext config and the decrypted sensitive keys).
 */
export declare function decryptEnvFile(filePath: string): Record<string, string>;
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
 * Returns the path to the Python backend log file (if logging is active).
 */
export declare function getPythonLogPath(): string | null;
/**
 * Returns true if the Python process has exited (crashed or stopped).
 */
export declare function isPythonProcessAlive(): boolean;
/**
 * Returns the exit code of the Python process, or null if still running.
 */
export declare function getPythonExitCode(): number | null;
/**
 * Check if a TCP port is already in use.
 * Returns true if the port is occupied.
 */
export declare function isPortInUse(port: number): Promise<boolean>;
/**
 * Start the Python FastAPI backend as a child process.
 * Logs all output to {dataDir}/python-backend.log.
 */
export declare function startPythonBackend(config: PythonConfig): ChildProcess;
export type HealthCheckResult = {
    status: 'healthy';
} | {
    status: 'crashed';
    exitCode: number | null;
} | {
    status: 'timeout';
};
/**
 * Wait for the Python backend to respond to health checks.
 * Returns early if the process crashes (no point waiting 90s).
 * Updates the splash window with elapsed time.
 */
export declare function waitForPythonHealth(port?: number, maxWaitMs?: number, splashWindow?: BrowserWindow | null): Promise<HealthCheckResult>;
