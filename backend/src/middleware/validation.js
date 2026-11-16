/**
 * CodeSense AI — Request validation middleware.
 *
 * Server-side schema validation at every trust boundary. Validation failures
 * return actionable field feedback without echoing full source code.
 */

const { ZodError } = require('zod');

function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    let data;
    if (source === 'body') {data = req.body;}
    else if (source === 'query') {data = req.query;}
    else if (source === 'params') {data = req.params;}
    else {data = req.body;}

    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || 'root';
        fieldErrors[path] = issue.message;
      }
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The submitted request is invalid.',
          requestId: req.requestId,
          fieldErrors,
        },
      });
    }
    req.validated = result.data;
    return next();
  };
}

module.exports = { validate };
