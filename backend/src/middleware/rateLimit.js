/**
 * CodeSense AI — Rate limiting.
 *
 * Limiter instances are created once at module load (never inside a request
 * handler) to avoid express-rate-limit's creation-in-request-handler error.
 */

const rateLimit = require('express-rate-limit');

// express-rate-limit v8 requires IP-based keys to be normalised with the
// bundled `ipKeyGenerator` helper. Returning a bare `req.ip` is flagged with
// ERR_ERL_KEY_GEN_IPV6 because an attacker holding a /64 IPv6 range gets a
// fresh bucket per address, which defeats the limit entirely. The helper
// collapses IPv6 addresses to their subnet and passes IPv4 through unchanged.
const { ipKeyGenerator } = rateLimit;

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

// Key generators, exported for regression tests (tests/rateLimit.test.js).
// Every branch that depends on the client address MUST go through
// ipKeyGenerator so IPv6 clients cannot rotate within their own prefix.
function authKey(req) {
  return ipKeyGenerator(req.ip) + ':' + (req.body && req.body.email ? req.body.email : 'unknown');
}

function ipKey(req) {
  return ipKeyGenerator(req.ip);
}

function reviewKey(req) {
  return req.session && req.session.userId ? 'user:' + req.session.userId : 'ip:' + ipKeyGenerator(req.ip);
}

// Per-(IP, email) bucket: bounds brute-force attempts against a single
// account from a single source.
const authLimiter = rateLimit({
  windowMs: windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX_AUTH || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: authKey,
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
  keyGenerator: ipKey,
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
  keyGenerator: reviewKey,
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
  keyGenerator: ipKey,
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

module.exports = {
  authLimiter,
  authIpLimiter,
  reviewLimiter,
  generalLimiter,
  // Exposed for tests only; not part of the HTTP surface.
  keyGenerators: { authKey, ipKey, reviewKey },
};
