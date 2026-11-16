/**
 * CodeSense AI — Test setup helper.
 *
 * Connects the app to the running MongoDB (127.0.0.1:27017) using a
 * PER-TEST-FILE database, configures environment variables, and starts the
 * Express app. Returns { app, stop }.
 *
 * Isolation rationale: `node --test` executes each test file as a separate
 * process, CONCURRENTLY. Previously every file shared one database name and
 * dropped it during setup, so a concurrently starting sibling file wiped the
 * users/sessions of a file already mid-flight (observed in CI as an
 * intermittent 401 on /api/v1/auth/me immediately after a successful login,
 * while passing on slower local machines). Each file now derives a unique
 * database name from its own file path, making concurrent runs safe.
 */

const path = require('node:path');
const mongoose = require('mongoose');

let app = null;

// Derive a unique, file-scoped database name from the test file that is
// running this process (node --test invokes each file as its own process,
// so process.argv[1] is always the current test file).
function deriveTestDbName() {
  const testFile = process.argv[1] || 'standalone';
  const base = path.basename(testFile, path.extname(testFile));
  const safe = base.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  return `codesense_ai_test_${safe}`;
}

const testDbName = deriveTestDbName();

async function start() {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/' + testDbName;
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'test-secret-do-not-use-in-production';
  process.env.CSRF_SECRET = 'test-csrf-secret';
  // Intentionaly unset: no provider key in automated tests. This forces
  // providerAdapter() to return null so reviews take the honest
  // provider-unavailable path without any network call to Gemini.
  process.env.GEMINI_API_KEY = '';
  process.env.GEMINI_MODEL = 'gemini-1.5-flash-latest';
  process.env.FRONTEND_ORIGIN = 'http://localhost:3000';
  process.env.SECURE_COOKIES = 'false';
  process.env.REVIEW_SOURCE_SIZE_LIMIT_BYTES = '65536';
  process.env.GEMINI_TIMEOUT_MS = '10000';
  process.env.GEMINI_MAX_RETRIES = '0';
  process.env.GEMINI_MAX_OUTPUT_CHARS = '32768';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.RATE_LIMIT_MAX_AUTH = '10';
  process.env.RATE_LIMIT_MAX_REVIEW = '30';
  process.env.RATE_LIMIT_MAX_GENERAL = '100';
  process.env.LOG_LEVEL = 'error';

  const appModule = await import('../src/app.js');
  app = appModule.default || appModule;

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  await mongoose.connection.dropDatabase().catch(() => {});
  return { app };
}

async function stop() {
  try {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.connection.close();
  } catch (e) {
    // ignore
  }
}

module.exports = { start, stop };
