/**
 * CodeSense AI — CSRF protection (double-submit token).
 *
 * For cookie-based sessions, state-changing requests must carry a CSRF token
 * header matching the token bound to the session. Safe methods (GET/HEAD/OPTIONS)
 * are exempt. The frontend reads the token from /api/v1/csrf-token and sends
 * it as X-CSRF-Token on mutating requests.
 */

const crypto = require('node:crypto');

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function csrfMiddleware(req, res, next) {
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    return next();
  }

  const session = req.session;
  if (!session) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Session unavailable for CSRF validation.',
        requestId: req.requestId,
      },
    });
  }

  // Bind a CSRF token to the session on first use.
  if (!session.csrfToken) {
    session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  const clientToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  if (!clientToken || clientToken !== session.csrfToken) {
    return res.status(403).json({
      error: {
        code: 'CSRF_ERROR',
        message: 'CSRF token missing or invalid.',
        requestId: req.requestId,
      },
    });
  }

  return next();
}

function issueCsrfToken(req, res) {
  if (!req.session) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Session unavailable.',
        requestId: req.requestId,
      },
    });
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return res.json({ csrfToken: req.session.csrfToken });
}

module.exports = {
  csrfMiddleware,
  issueCsrfToken,
};
