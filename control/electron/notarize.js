// notarize.js — electron-builder afterSign hook
// Notarizes the macOS .app bundle using Apple's Notary REST API.
// Bypasses xcrun notarytool entirely (avoids SIGBUS crash).

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const NOTARY_API_BASE = 'https://appstoreconnect.apple.com/notary/v2';

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

function generateJwt(keyId, issuerId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: issuerId, aud: 'appstoreconnect-v1', iat: now, exp: now + 900 };
  return jwt.sign(payload, privateKey, { algorithm: 'ES256', header: { alg: 'ES256', kid: keyId, typ: 'JWT' } });
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiRequest(method, urlPath, token, body) {
  const url = `${NOTARY_API_BASE}${urlPath}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Notary API ${method} ${urlPath} failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
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

  const keyId = process.env.APPLE_API_KEY_ID || envVars.APPLE_API_KEY_ID;
  const issuerId = process.env.APPLE_API_ISSUER_ID || envVars.APPLE_API_ISSUER_ID;
  const keyPathRaw = process.env.APPLE_API_KEY_PATH || envVars.APPLE_API_KEY_PATH;

  if (!keyId || !issuerId || !keyPathRaw) {
    console.warn('Notarize: Missing Apple API key credentials (APPLE_API_KEY_ID, APPLE_API_ISSUER_ID, APPLE_API_KEY_PATH). Skipping notarization.');
    return;
  }

  const keyPath = path.resolve(__dirname, keyPathRaw);
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Notarize: Private key file not found: ${keyPath}`);
  }
  const privateKey = fs.readFileSync(keyPath, 'utf-8');

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarize: Submitting ${appPath} via Apple Notary REST API...`);

  // Step 1: Generate JWT
  const token = generateJwt(keyId, issuerId, privateKey);
  console.log('Notarize: JWT generated.');

  // Step 2: Zip the .app for submission
  const zipPath = path.join(appOutDir, `${appName}.zip`);
  console.log('Notarize: Zipping app bundle...');
  execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent',
    `${appName}.app`, zipPath], { cwd: appOutDir, stdio: 'inherit' });

  try {
    // Step 3: Compute SHA-256 and submit to Apple
    console.log('Notarize: Computing SHA-256...');
    const sha256 = sha256File(zipPath);
    console.log(`Notarize: SHA-256 = ${sha256}`);

    console.log('Notarize: Creating submission...');
    const submitRes = await apiRequest('POST', '/submissions', token, {
      submissionName: `${appName}.zip`,
      sha256,
    });

    const submissionId = submitRes.data.id;
    const attrs = submitRes.data.attributes;
    console.log(`Notarize: Submission ID = ${submissionId}`);

    // Step 4: Upload zip to S3
    console.log('Notarize: Uploading to Apple S3...');
    const s3 = new S3Client({
      region: 'us-west-2',
      credentials: {
        accessKeyId: attrs.awsAccessKeyId,
        secretAccessKey: attrs.awsSecretAccessKey,
        sessionToken: attrs.awsSessionToken,
      },
    });

    const zipData = fs.readFileSync(zipPath);
    await s3.send(new PutObjectCommand({
      Bucket: attrs.bucket,
      Key: attrs.object,
      Body: zipData,
    }));
    console.log('Notarize: Upload complete.');

    // Step 5: Poll for status
    console.log('Notarize: Waiting for Apple to process...');
    const pollInterval = 15000;
    const timeout = 30 * 60 * 1000;
    const startTime = Date.now();

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Notarize: Timed out waiting for Apple to process (30 minutes).');
      }

      await sleep(pollInterval);

      // Regenerate JWT if we've been polling a while (tokens expire after 15 min)
      const currentToken = (Date.now() - startTime > 10 * 60 * 1000)
        ? generateJwt(keyId, issuerId, privateKey)
        : token;

      const statusRes = await apiRequest('GET', `/submissions/${submissionId}`, currentToken);
      const status = statusRes.data.attributes.status;
      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (status === 'Accepted') {
        console.log(`Notarize: Apple accepted the submission. (${elapsed}s)`);
        break;
      } else if (status === 'Invalid' || status === 'Rejected') {
        // Try to fetch the log
        try {
          const logRes = await apiRequest('GET', `/submissions/${submissionId}/logs`, currentToken);
          const logUrl = logRes.data.attributes.developerLogUrl;
          if (logUrl) {
            const logFetch = await fetch(logUrl);
            const logText = await logFetch.text();
            console.error('Notarize: Apple rejection log:\n', logText);
          }
        } catch (_) {}
        throw new Error(`Notarize: Notarization failed with status: ${status}`);
      }

      console.log(`Notarize: Still processing... (${elapsed}s elapsed, status: ${status})`);
    }
  } finally {
    try { fs.unlinkSync(zipPath); } catch (_) {}
  }

  // Step 6: Staple the ticket to the .app
  console.log('Notarize: Stapling notarization ticket...');
  execFileSync('xcrun', ['stapler', 'staple', appPath], { stdio: 'inherit' });

  console.log('Notarize: Done. The app has been notarized and stapled.');
};
