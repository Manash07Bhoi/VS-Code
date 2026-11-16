/**
 * CodeSense AI — Authentication middleware.
 *
 * Server-managed cookie session. Identity is derived ONLY from the verified
 * session. Browser-supplied user IDs are never trusted.
 */

const logger = require('../utils/logger');

function requireAuth(req, res, next) {
  const user = req.session && req.session.userId ? req.session.userId : null;
  if (!user) {
    logger.debug('codesense-auth.unauthenticated', { path: req.path, method: req.method });
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.',
        requestId: req.requestId,
      },
    });
  }
  req.auth = { userId: user };
  return next();
}

function optionalAuth(req, res, next) {
  req.auth = req.session && req.session.userId ? { userId: req.session.userId } : null;
  return next();
}

function alreadyAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  return next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  alreadyAuthenticated,
};
