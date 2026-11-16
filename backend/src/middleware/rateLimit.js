/**
 * CodeSense AI — Rate limiting.
 *
 * Limiter instances are created once at module load (never inside a request
 * handler) to avoid express-rate-limit's creation-in-request-handler error.
 */

const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

// Per-(IP, email) bucket: bounds brute-force attempts against a single
// account from a single source.
const authLimiter = rateLimit({
  windowMs: windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_AUTH || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: function (req) {
    return req.ip + ':' + (req.body && req.body.email ? req.body.email : 'unknown');
  },
  handler: function (req, res) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many attempts. Please wait and try again.',
        requestId: req.requestId,
      },
    });
  },
});

// Per-IP bucket across ALL auth attempts: bounds credential stuffing from
// one source spraying many different email addresses (each of which would
// otherwise get a fresh per-(ip,email) bucket above).
const authIpLimiter = rateLimit({
  windowMs: windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_AUTH_IP || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: function (req) {
    return req.ip;
  },
  handler: function (req, res) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many attempts from this address. Please wait and try again.',
        requestId: req.requestId,
      },
    });
  },
});

const reviewLimiter = rateLimit({
  windowMs: windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_REVIEW || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: function (req) {
    return (req.session && req.session.userId ? 'user:' + req.session.userId : 'ip:' + req.ip);
  },
  handler: function (req, res) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many review requests. Please wait and try again.',
        requestId: req.requestId,
      },
    });
  },
});

const generalLimiter = rateLimit({
  windowMs: windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_GENERAL || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: function (req) {
    return req.ip;
  },
  handler: function (req, res) {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait and try again.',
        requestId: req.requestId,
      },
    });
  },
});

module.exports = { authLimiter, authIpLimiter, reviewLimiter, generalLimiter };
