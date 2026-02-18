// notarize.js — electron-builder afterSign hook
// Notarizes the macOS .app bundle using Apple's Notary REST API.
// Uses curl for S3 upload (avoids AWS SDK Node 18 incompatibility).
// Uses REST API instead of xcrun notarytool (avoids SIGBUS crash).

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const NOTARY_API = 'https://appstoreconnect.apple.com/notary/v2';

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

// ES256 JWT using Node's built-in crypto (no jsonwebtoken dependency)
function generateJwt(keyId, issuerId, privateKeyPem) {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: issuerId, aud: 'appstoreconnect-v1', iat: now, exp: now + 900,
  })).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const sig = crypto.sign('SHA256', Buffer.from(signingInput), {
    key: privateKeyPem, dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${sig.toString('base64url')}`;
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiRequest(method, urlPath, token, body) {
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${NOTARY_API}${urlPath}`, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`Notary API ${method} ${urlPath} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}

// Upload to S3 using Node's built-in https module with AWS SigV4 signing.
// Bypasses @aws-sdk/client-s3 (broken on Node 18) and curl.
async function s3Upload(zipPath, bucket, objectKey, creds, region = 'us-west-2') {
  const https = require('https');
  const fileData = fs.readFileSync(zipPath);
  const contentHash = crypto.createHash('sha256').update(fileData).digest('hex');

  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const uri = '/' + objectKey.split('/').map(encodeURIComponent).join('/');

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Recompute timestamp for each attempt
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const dateStamp = amzDate.slice(0, 8);

    // Build canonical request (headers sorted by lowercase name)
    const hdrs = {
      'content-type': 'application/zip',
      'host': host,
      'x-amz-content-sha256': contentHash,
      'x-amz-date': amzDate,
      'x-amz-security-token': creds.sessionToken,
    };
    const signedKeys = Object.keys(hdrs).sort();
    const signedHeaders = signedKeys.join(';');
    const canonicalHeaders = signedKeys.map(k => `${k}:${hdrs[k]}`).join('\n') + '\n';
    const canonicalRequest = ['PUT', uri, '', canonicalHeaders, signedHeaders, contentHash].join('\n');

    // String to sign
    const scope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');

    // Signing key chain
    const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
    let sigKey = hmac(`AWS4${creds.secretAccessKey}`, dateStamp);
    sigKey = hmac(sigKey, region);
    sigKey = hmac(sigKey, 's3');
    sigKey = hmac(sigKey, 'aws4_request');
    const signature = crypto.createHmac('sha256', sigKey).update(stringToSign).digest('hex');
    const auth = `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    try {
      await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: host,
          path: uri,
          method: 'PUT',
          headers: {
            'Authorization': auth,
            'Content-Type': 'application/zip',
            'Content-Length': fileData.length,
            'x-amz-content-sha256': contentHash,
            'x-amz-date': amzDate,
            'x-amz-security-token': creds.sessionToken,
          },
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`S3 HTTP ${res.statusCode}: ${body}`));
            }
          });
        });

        req.on('error', (err) => reject(new Error(`S3 connection error: ${err.code || err.message}`)));

        // Write in 1MB chunks with backpressure handling
        const CHUNK = 1024 * 1024;
        let offset = 0;
        function write() {
          let ok = true;
          while (ok && offset < fileData.length) {
            const end = Math.min(offset + CHUNK, fileData.length);
            const chunk = fileData.subarray(offset, end);
            offset = end;
            if (offset >= fileData.length) {
              req.end(chunk);
            } else {
              ok = req.write(chunk);
            }
          }
          if (offset < fileData.length) {
            req.once('drain', write);
          }
        }
        write();
      });
      return; // Success
    } catch (err) {
      console.error(`Notarize: Upload attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt === maxAttempts) throw err;
      console.log('Notarize: Retrying in 5 seconds...');
      await sleep(5000);
    }
  }
}

// electron-builder afterSign hook
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    console.log('Notarize: Skipping — not macOS.');
    return;
  }

  const envVars = loadEnv(path.join(__dirname, '.env'));
  const keyId = process.env.APPLE_API_KEY_ID || envVars.APPLE_API_KEY_ID;
  const issuerId = process.env.APPLE_API_ISSUER_ID || envVars.APPLE_API_ISSUER_ID;
  const keyPathRaw = process.env.APPLE_API_KEY_PATH || envVars.APPLE_API_KEY_PATH;

  if (!keyId || !issuerId || !keyPathRaw) {
    console.warn('Notarize: Missing Apple API key credentials. Skipping notarization.');
    return;
  }

  const keyPath = path.resolve(__dirname, keyPathRaw);
  if (!fs.existsSync(keyPath)) throw new Error(`Notarize: Private key not found: ${keyPath}`);
  const privateKey = fs.readFileSync(keyPath, 'utf-8');

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);
  const zipPath = path.join(appOutDir, `${appName}.zip`);

  console.log(`Notarize: Submitting ${appPath} via Apple Notary REST API...`);

  // Step 1: Zip the .app
  console.log('Notarize: Zipping app bundle...');
  execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent',
    `${appName}.app`, zipPath], { cwd: appOutDir, stdio: 'inherit' });

  try {
    // Step 2: Hash and create submission
    console.log('Notarize: Computing SHA-256...');
    const fileSha256 = sha256File(zipPath);
    console.log(`Notarize: SHA-256 = ${fileSha256}`);

    const token = generateJwt(keyId, issuerId, privateKey);
    console.log('Notarize: Creating submission...');
    const submitRes = await apiRequest('POST', '/submissions', token, {
      submissionName: `${appName}.zip`, sha256: fileSha256,
    });
    const submissionId = submitRes.data.id;
    const attrs = submitRes.data.attributes;
    console.log(`Notarize: Submission ID = ${submissionId}`);

    // Step 3: Upload to S3 via Node https
    console.log('Notarize: Uploading to Apple S3...');
    await s3Upload(zipPath, attrs.bucket, attrs.object, {
      accessKeyId: attrs.awsAccessKeyId,
      secretAccessKey: attrs.awsSecretAccessKey,
      sessionToken: attrs.awsSessionToken,
    });
    console.log('Notarize: Upload complete.');

    // Step 4: Poll for status
    console.log('Notarize: Waiting for Apple to process...');
    const startTime = Date.now();
    const timeout = 30 * 60 * 1000;

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Notarize: Timed out waiting for Apple (30 minutes).');
      }
      await sleep(15000);

      const currentToken = (Date.now() - startTime > 10 * 60 * 1000)
        ? generateJwt(keyId, issuerId, privateKey) : token;

      const statusRes = await apiRequest('GET', `/submissions/${submissionId}`, currentToken);
      const status = statusRes.data.attributes.status;
      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (status === 'Accepted') {
        console.log(`Notarize: Apple accepted the submission. (${elapsed}s)`);
        break;
      } else if (status === 'Invalid' || status === 'Rejected') {
        try {
          const logRes = await apiRequest('GET', `/submissions/${submissionId}/logs`, currentToken);
          const logUrl = logRes.data.attributes.developerLogUrl;
          if (logUrl) console.error('Notarize: Apple log:\n', await (await fetch(logUrl)).text());
        } catch (_) {}
        throw new Error(`Notarize: Notarization failed with status: ${status}`);
      }

      console.log(`Notarize: Still processing... (${elapsed}s elapsed, status: ${status})`);
    }
  } finally {
    try { fs.unlinkSync(zipPath); } catch (_) {}
  }

  // Step 5: Staple
  console.log('Notarize: Stapling notarization ticket...');
  execFileSync('xcrun', ['stapler', 'staple', appPath], { stdio: 'inherit' });

  console.log('Notarize: Done. The app has been notarized and stapled.');
};
