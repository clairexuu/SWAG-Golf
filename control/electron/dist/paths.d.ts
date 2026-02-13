/**
 * Resolve path to bundled read-only resource data.
 * Dev: project root. Prod: extraResources/data/.
 */
export declare function getResourcePath(relativePath: string): string;
/**
 * Resolve path to user-writable data directory.
 * Dev: project root. Prod: app.getPath('userData')/.
 */
export declare function getUserDataPath(relativePath: string): string;
/**
 * Get path to the built frontend index.html.
 */
export declare function getFrontendPath(): string;
/**
 * On first run in production, copy bundled data from extraResources
 * to the writable userData directory so styles/embeddings can be modified.
 */
export declare function initializeUserData(): void;
