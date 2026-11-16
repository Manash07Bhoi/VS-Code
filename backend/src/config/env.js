/**
 * CodeSense AI — Environment configuration and startup validation.
 *
 * Required variables must be present for the backend to start (fail-fast).
 * Optional variables have documented safe defaults. Real secrets are never
 * hardcoded here; .env.example lists names and explanations only.
 */

const fs = require('node:fs');
const path = require('node:path');

const DOTENV_PATH = path.resolve(__dirname, '../../.env');

// Load .env if present (local development). Never in production without explicit intent.
function loadDotenv() {
  if (fs.existsSync(DOTENV_PATH)) {
    const content = fs.readFileSync(DOTENV_PATH, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {continue;}
      const eq = trimmed.indexOf('=');
      if (eq === -1) {continue;}
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, '$1');
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
loadDotenv();

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      'See .env.example for the full variable list.'
    );
  }
  return value.trim();
}

function optional(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined || value === '') {return defaultValue;}
  return value;
}

function optionalInt(name, defaultValue) {
  const raw = optional(name, String(defaultValue));
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, got: ${raw}`);
  }
  return parsed;
}

function optionalBool(name, defaultValue) {
  const raw = optional(name, String(defaultValue));
  return raw === 'true' || raw === '1';
}

// --- Required (fail fast if absent) ---
const MONGODB_URI = required('MONGODB_URI');
const SESSION_SECRET = required('SESSION_SECRET');
const FRONTEND_ORIGIN = required('FRONTEND_ORIGIN');

// --- Optional with safe defaults ---
const PORT = optionalInt('PORT', 3000);
const HOST = optional('HOST', '0.0.0.0');
const NODE_ENV = optional('NODE_ENV', 'development');
const LOG_LEVEL = optional('LOG_LEVEL', 'info');
const SESSION_MAX_AGE_MS = optionalInt('SESSION_MAX_AGE_MS', 1000 * 60 * 60 * 24 * 7); // 7 days
const CSRF_SECRET = optional('CSRF_SECRET', SESSION_SECRET);
const GEMINI_API_KEY = optional('GEMINI_API_KEY', '');
const GEMINI_MODEL = optional('GEMINI_MODEL', '');
const REVIEW_SOURCE_SIZE_LIMIT_BYTES = optionalInt('REVIEW_SOURCE_SIZE_LIMIT_BYTES', 64 * 1024); // 64 KiB
const GEMINI_TIMEOUT_MS = optionalInt('GEMINI_TIMEOUT_MS', 60000); // 60s
const GEMINI_MAX_RETRIES = optionalInt('GEMINI_MAX_RETRIES', 2);
const GEMINI_MAX_OUTPUT_CHARS = optionalInt('GEMINI_MAX_OUTPUT_CHARS', 32768);
const RATE_LIMIT_WINDOW_MS = optionalInt('RATE_LIMIT_WINDOW_MS', 60 * 1000);
const RATE_LIMIT_MAX_AUTH = optionalInt('RATE_LIMIT_MAX_AUTH', 10);
const RATE_LIMIT_MAX_REVIEW = optionalInt('RATE_LIMIT_MAX_REVIEW', 30);
const RATE_LIMIT_MAX_GENERAL = optionalInt('RATE_LIMIT_MAX_GENERAL', 100);
const TRUST_PROXY = optionalBool('TRUST_PROXY', false);
const SECURE_COOKIES = optionalBool('SECURE_COOKIES', NODE_ENV === 'production');
// Cookie SameSite policy: 'lax' for same-site deployment, 'none' for
// cross-site (separate frontend/backend domains). 'none' requires Secure cookies.
const COOKIE_SAMESITE = optional('COOKIE_SAMESITE', SECURE_COOKIES ? 'none' : 'lax');
const COOKIE_DOMAIN = optional('COOKIE_DOMAIN', '');

module.exports = {
  MONGODB_URI,
  SESSION_SECRET,
  CSRF_SECRET,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  FRONTEND_ORIGIN,
  PORT,
  HOST,
  NODE_ENV,
  LOG_LEVEL,
  SESSION_MAX_AGE_MS,
  REVIEW_SOURCE_SIZE_LIMIT_BYTES,
  GEMINI_TIMEOUT_MS,
  GEMINI_MAX_RETRIES,
  GEMINI_MAX_OUTPUT_CHARS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_AUTH,
  RATE_LIMIT_MAX_REVIEW,
  RATE_LIMIT_MAX_GENERAL,
  TRUST_PROXY,
  SECURE_COOKIES,
  COOKIE_SAMESITE,
  COOKIE_DOMAIN,
  isProduction: () => NODE_ENV === 'production',
  isDevelopment: () => NODE_ENV === 'development',
};
