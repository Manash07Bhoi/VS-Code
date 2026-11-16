/**
 * CodeSense AI — Review routes.
 *
 * Create, list, get, delete reviews. Owner-scoped in the database query
 * itself. Server-side validation, rate limiting, CSRF on mutating endpoints.
 */

const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validation');
const { csrfMiddleware } = require('../../middleware/csrf');
const { requireAuth } = require('../../middleware/auth');
const { reviewLimiter } = require('../../middleware/rateLimit');
const {
  createReviewSchema,
  listReviewsSchema,
} = require('../../validators/schemas');
const { submitReview, getReview } = require('../../services/reviewService');
const { deleteByIdAndOwner, listByOwner } = require('../../repositories/reviewRepository');
const logger = require('../../utils/logger');

// Create review.
router.post(
  '/',
  requireAuth,
  reviewLimiter,
  csrfMiddleware,
  validate(createReviewSchema, 'body'),
  async (req, res, next) => {
    const { source, language, title, clientRequestId, focus } = req.validated;
    try {
      const result = await submitReview({
        userId: req.auth.userId,
        source,
        language,
        title,
        clientRequestId,
        focus,
      });
      const statusCode = result.statusCode || (result.status === 'failed' ? 502 : 201);
      return res.status(statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// List reviews (owner-scoped history).
router.get(
  '/',
  requireAuth,
  validate(listReviewsSchema, 'query'),
  async (req, res, next) => {
    try {
      const { page, limit, language, status, sort, order } = req.validated;
      const data = await listByOwner(req.auth.userId, {
        page,
        limit,
        language,
        status,
        sort,
        order,
      });
      res.json({ reviews: data.items, total: data.total, page: data.page, limit: data.limit });
    } catch (err) {
      next(err);
    }
  }
);

// Get review detail (owner-scoped).
router.get('/:reviewId', requireAuth, async (req, res, next) => {
  try {
    const review = await getReview(req.params.reviewId, req.auth.userId);
    if (!review) {
      // Consistent not-found: do not leak whether another user's review exists.
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found.',
          requestId: req.requestId,
        },
      });
    }
    res.json({ review });
  } catch (err) {
    next(err);
  }
});

// Delete review (owner-scoped).
router.delete('/:reviewId', requireAuth, csrfMiddleware, async (req, res, next) => {
  try {
    const deleted = await deleteByIdAndOwner(req.params.reviewId, req.auth.userId);
    if (!deleted) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found.',
          requestId: req.requestId,
        },
      });
    }
    logger.info('codesense-review.deleted', {
      reviewId: req.params.reviewId,
      userId: req.auth.userId,
    });
    return res.json({ message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
