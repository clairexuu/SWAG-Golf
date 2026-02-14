// Build-time script: reads .env, encrypts sensitive API keys with AES-256-GCM,
// and writes .env.encrypted. Non-sensitive config is passed through in plaintext.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PASSPHRASE = 'swag-concept-sketch-agent-2025';
const KEY = crypto.createHash('sha256').update(PASSPHRASE).digest();

const SENSITIVE_KEYS = ['OPENAI_API_KEY', 'GOOGLE_API_KEY', 'NANO_BANANA_API_KEY'];

const envPath = path.resolve(__dirname, '../../.env');
const outPath = path.resolve(__dirname, '../../.env.encrypted');

if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file not found at', envPath);
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf-8');
const config = {};
const sensitive = {};

for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let value = trimmed.slice(eqIdx + 1).trim();
  const hashIdx = value.indexOf(' #');
  if (hashIdx !== -1) value = value.slice(0, hashIdx).trim();

  if (SENSITIVE_KEYS.includes(key)) {
    sensitive[key] = value;
  } else {
    config[key] = value;
  }
}

if (Object.keys(sensitive).length === 0) {
  console.error('WARNING: No sensitive keys found in .env');
}

const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
const sensitiveJson = JSON.stringify(sensitive);
const encrypted = Buffer.concat([cipher.update(sensitiveJson, 'utf-8'), cipher.final()]);
const authTag = cipher.getAuthTag();

const output = {
  config,
  iv: iv.toString('hex'),
  authTag: authTag.toString('hex'),
  data: encrypted.toString('hex'),
};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Encrypted ${Object.keys(sensitive).length} sensitive key(s) → ${outPath}`);
console.log(`Non-sensitive config: ${Object.keys(config).join(', ')}`);
