/**
 * Preflight check for the public Supabase configuration.
 *
 * Usage:
 *   npm run check:env
 *
 * Reads .env.local when present, then process.env (so it also works in CI or
 * when exported in the shell). Fails if the public configuration is missing or
 * if a service_role key was accidentally placed in a VITE_ variable.
 */
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const values = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

const env = {
  ...loadEnvFile(path.resolve('.env.local')),
  ...loadEnvFile(path.resolve('.env')),
  ...process.env,
};

const url = env.VITE_SUPABASE_URL || '';
const anonKey = env.VITE_SUPABASE_ANON_KEY || '';
const errors = [];

const isLocalDev = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(url);
if (!isLocalDev && !/^https:\/\/[^\s]+\.supabase\.co\/?$/.test(url)) {
  errors.push('VITE_SUPABASE_URL must look like https://<project-id>.supabase.co');
}

if (!anonKey || anonKey.length < 20) {
  errors.push('VITE_SUPABASE_ANON_KEY is missing or too short.');
}

// مفاتيح sb_publishable_/sb_secret_ الجديدة ليست JWT، فنرفض أي صيغة secret_unknown.
if (anonKey.startsWith('sb_secret') || anonKey.toLowerCase().includes('service_role')) {
  errors.push('VITE_SUPABASE_ANON_KEY appears to contain a service_role/secret key. Never expose it in the browser bundle.');
}

const payload = anonKey ? decodeJwtPayload(anonKey) : null;
if (payload?.role === 'service_role') {
  errors.push('VITE_SUPABASE_ANON_KEY contains a service_role key. Never expose it in the browser bundle.');
}

if (errors.length > 0) {
  console.error('Environment check failed:');
  for (const error of errors) console.error(`  - ${error}`);
  console.error('\nCopy .env.example to .env.local and fill in the public Supabase values.');
  process.exit(1);
}

console.log('Environment check passed: public Supabase URL and anon key are configured.');
