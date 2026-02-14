// notarize.js — electron-builder afterSign hook
// Notarizes the macOS .app bundle with Apple's notarytool service.
// Uses xcrun notarytool directly (submit + poll + staple) for reliability.
// Works around a SIGBUS crash in notarytool by extracting the submission ID
// from partial output even if the process crashes after uploading.

const { execFile, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Minimal .env parser (matches parseEnvFile in python-manager.ts)
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Promise wrapper that resolves with output even on non-zero exit / signal
function execFileCapture(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, opts, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        code: error ? (error.code || null) : 0,
        signal: error ? (error.signal || null) : null,
        error,
      });
    });
  });
}

// Extract UUID submission ID from notarytool text output
function extractSubmissionId(text) {
  const match = text.match(/id:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match ? match[1] : null;
}

// electron-builder afterSign hook
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    console.log('Notarize: Skipping — not a macOS build.');
    return;
  }

  const envPath = path.join(__dirname, '.env');
  const envVars = loadEnv(envPath);

  const appleId = process.env.APPLE_ID || envVars.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD || envVars.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID || envVars.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('Notarize: Missing Apple credentials. Skipping notarization.');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarize: Submitting ${appPath} to Apple notary service...`);

  // Step 1: Zip the .app for submission
  const zipPath = path.join(appOutDir, `${appName}.zip`);
  console.log('Notarize: Zipping app bundle...');
  execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent',
    `${appName}.app`, zipPath], { cwd: appOutDir, stdio: 'inherit' });

  // Step 2: Submit to Apple
  // Note: notarytool may crash with SIGBUS after successful upload (known issue).
  // We extract the submission ID from whatever output was produced.
  console.log('Notarize: Uploading to Apple notary service...');
  let submissionId;
  try {
    const result = await execFileCapture('xcrun', [
      'notarytool', 'submit', zipPath,
      '--apple-id', appleId,
      '--password', appleIdPassword,
      '--team-id', teamId,
    ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 300000 });

    const combined = result.stdout + '\n' + result.stderr;
    submissionId = extractSubmissionId(combined);

    if (result.signal) {
      console.warn(`Notarize: notarytool crashed with signal ${result.signal} (known issue).`);
    }

    if (!submissionId) {
      console.error('Notarize: Could not extract submission ID from notarytool output.');
      console.error('Notarize: stdout:', result.stdout || '(empty)');
      console.error('Notarize: stderr:', result.stderr || '(empty)');
      throw new Error('Failed to submit for notarization: no submission ID received.');
    }

    console.log(`Notarize: Submission ID = ${submissionId}`);
  } finally {
    try { fs.unlinkSync(zipPath); } catch (_) {}
  }

  // Step 3: Poll for completion (no timeout — waits until Apple finishes or rejects)
  console.log('Notarize: Waiting for Apple to process...');
  const pollInterval = 15000; // 15 seconds
  const startTime = Date.now();
  let finalStatus = 'In Progress';

  while (true) {
    await sleep(pollInterval);

    try {
      const result = await execFileCapture('xcrun', [
        'notarytool', 'info', submissionId,
        '--apple-id', appleId,
        '--password', appleIdPassword,
        '--team-id', teamId,
      ], { encoding: 'utf-8', timeout: 60000 });

      const combined = result.stdout + '\n' + result.stderr;

      // Parse status from text output (e.g., "status: Accepted")
      const statusMatch = combined.match(/status:\s*(.+)/i);
      if (statusMatch) {
        finalStatus = statusMatch[1].trim();
      }

      if (finalStatus === 'Accepted') {
        console.log('Notarize: Apple accepted the submission.');
        break;
      } else if (finalStatus === 'Invalid' || finalStatus === 'Rejected') {
        try {
          const logResult = await execFileCapture('xcrun', [
            'notarytool', 'log', submissionId,
            '--apple-id', appleId,
            '--password', appleIdPassword,
            '--team-id', teamId,
          ], { encoding: 'utf-8', timeout: 60000 });
          console.error('Notarize: Notarization log:\n', logResult.stdout);
        } catch (_) {}
        throw new Error(`Notarization failed with status: ${finalStatus}`);
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`Notarize: Still processing... (${elapsed}s elapsed, status: ${finalStatus})`);
    } catch (err) {
      if (err.message && err.message.includes('Notarization failed')) throw err;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.warn(`Notarize: Poll error (${elapsed}s elapsed), retrying...`, err.message);
    }
  }

  // Step 4: Staple the ticket to the .app
  console.log('Notarize: Stapling notarization ticket...');
  execFileSync('xcrun', ['stapler', 'staple', appPath], { stdio: 'inherit' });

  console.log('Notarize: Done. The app has been notarized and stapled.');
};
