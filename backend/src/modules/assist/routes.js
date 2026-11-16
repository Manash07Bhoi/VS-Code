/**
 * CodeSense AI — Assist routes.
 *
 * Ephemeral AI assistance (explain / improve) for the workbench. Unlike
 * reviews, assist results are NOT persisted: they operate on the client's
 * active editor content or selection and return a structured result for
 * immediate display. Requires authentication, CSRF, rate limiting, and the
 * same language registry + source size caps as reviews.
 */

const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validation');
const { csrfMiddleware } = require('../../middleware/csrf');
const { requireAuth } = require('../../middleware/auth');
const { reviewLimiter } = require('../../middleware/rateLimit');
const { assistSchema } = require('../../validators/schemas');
const { isReviewEnabled } = require('../../config/languages');
const { providerAdapter } = require('../../services/reviewService');
const logger = require('../../utils/logger');

const SOURCE_SIZE_LIMIT_BYTES =
  parseInt(process.env.REVIEW_SOURCE_SIZE_LIMIT_BYTES || '65536', 10);

const ASSIST_ACTIONS = new Set(['explain', 'improve']);

router.post(
  '/',
  requireAuth,
  reviewLimiter,
  csrfMiddleware,
  validate(assistSchema, 'body'),
  async (req, res, next) => {
    const { action, source, language, hasSelection } = req.validated;
    try {
      if (!ASSIST_ACTIONS.has(action)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Unknown assist action.',
            requestId: req.requestId,
            fieldErrors: { action: 'Action must be one of: explain, improve.' },
          },
        });
      }

      if (!isReviewEnabled(language)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'This language is not enabled for AI assistance.',
            requestId: req.requestId,
            fieldErrors: { language: 'This language is not enabled for AI assistance.' },
          },
        });
      }

      const sourceBytes = Buffer.byteLength(source, 'utf8');
      if (sourceBytes > SOURCE_SIZE_LIMIT_BYTES) {
        return res.status(413).json({
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: `Source code exceeds ${Math.floor(SOURCE_SIZE_LIMIT_BYTES / 1024)} KiB limit.`,
            requestId: req.requestId,
          },
        });
      }

      const adapter = providerAdapter();
      if (!adapter || typeof adapter.assist !== 'function') {
        // Truthful provider-unavailable state; never canned responses.
        logger.warn('codesense-assist.provider-unavailable', { userId: req.auth.userId, action });
        return res.status(503).json({
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: 'AI provider is not configured on the server.',
            requestId: req.requestId,
          },
        });
      }

      const result = await adapter.assist({
        source,
        language,
        action,
        hasSelection: hasSelection === true,
      });

      logger.info('codesense-assist.completed', {
        userId: req.auth.userId,
        action,
        language,
      });

      return res.status(200).json({
        action,
        language,
        result,
      });
    } catch (err) {
      // Mapped provider errors carry a status/code; surface them directly.
      if (err && err.code && err.status) {
        return res.status(err.status).json({
          error: {
            code: err.code,
            message: err.message,
            requestId: req.requestId,
          },
        });
      }
      return next(err);
    }
  }
);

module.exports = router;
