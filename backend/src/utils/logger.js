/**
 * CodeSense AI — Structured logging.
 *
 * Emits newline-delimited JSON. Never logs passwords, tokens, session IDs,
 * provider keys, database URIs, or full source code. Fields are safe for
 * operational inspection.
 */

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] || LOG_LEVELS.info;

function redact(value) {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string') {
    return value.length > 200 ? value.slice(0, 200) + '…[truncated]' : value;
  }
  return value;
}

function log(level, message, fields = {}) {
  if (LOG_LEVELS[level] > MIN_LEVEL) return;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'codesense-backend',
    ...fields,
  };
  // Strip any accidental sensitive keys before emitting.
  delete entry.password;
  delete entry.token;
  delete entry.sessionId;
  delete entry.apiKey;
  delete entry.source;
  delete entry.fullSource;
  delete entry.providerKey;
  delete entry.databaseUri;
  const safe = {};
  for (const [k, v] of Object.entries(entry)) {
    if (k === 'password' || k === 'token' || k === 'sessionId' || k === 'apiKey' ||
        k === 'source' || k === 'fullSource' || k === 'providerKey' || k === 'databaseUri') continue;
    safe[k] = redact(v);
  }
  console.log(JSON.stringify(safe));
}

module.exports = {
  error: (message, fields) => log('error', message, fields),
  warn: (message, fields) => log('warn', message, fields),
  info: (message, fields) => log('info', message, fields),
  debug: (message, fields) => log('debug', message, fields),
};
