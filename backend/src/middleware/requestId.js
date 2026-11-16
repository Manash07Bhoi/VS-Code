/**
 * CodeSense AI — Request ID middleware.
 *
 * Every request gets a correlation ID echoed in responses for traceability
 * without exposing internal infrastructure.
 */

const crypto = require('node:crypto');

function requestId(req, res, next) {
  req.requestId =
    req.headers['x-request-id'] || crypto.randomBytes(16).toString('hex');
  res.set('X-Request-Id', req.requestId);
  next();
}

module.exports = { requestId };
