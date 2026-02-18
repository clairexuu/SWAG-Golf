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
 * Sync bundled data to userData on launch.
 *
 * - App code (api/, generate/, prompt/, *.py in mixed dirs) is synced when the
 *   build-time code hash changes (or on first run). This catches code updates
 *   even without a version bump, while skipping unnecessary I/O when unchanged.
 * - Config files (.env.encrypted, requirements.txt, etc.) are ALWAYS synced.
 * - User data (style_library, reference_images, cache, generated_outputs,
 *   feedback/logs) is seeded on FIRST RUN only — never overwritten.
 */
export declare function initializeUserData(): void;
