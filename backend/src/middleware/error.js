/**
 * CodeSense AI — Central error handler.
 *
 * Consistent error envelopes, safe messages (no stack traces or internals to
 * clients), request IDs, and safe logging.
 */

function errorHandler(err, req, res, next) {
  const code = err.code || 'INTERNAL_ERROR';
  const status = err.status || 500;

  // Safe logging: full error server-side only.
  if (status >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'codesense-backend.request-error',
      timestamp: new Date().toISOString(),
      service: 'codesense-backend',
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      error: err.message,
      stack: err.stack,
    }));
  }

  // Never echo source code, passwords, tokens, keys, or stack traces to client.
  let message = 'An unexpected error occurred.';
  if (status < 500 && err.message) {
    message = err.message;
  }

  return res.status(status).json({
    error: {
      code,
      message,
      requestId: req.requestId,
    },
  });
}

function notFound(req, res) {
  return res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource does not exist.',
      requestId: req.requestId,
    },
  });
}

module.exports = { errorHandler, notFound };
