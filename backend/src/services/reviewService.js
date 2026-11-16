/**
 * CodeSense AI — Review orchestration service.
 *
 * Coordinates the full review lifecycle: validate input, create persisted
 * lifecycle record, call the provider adapter from backend only, validate
 * output, normalize, persist, and return. Never executes submitted code.
 */

const crypto = require('node:crypto');
const {
  createReview,
  findByIdAndOwner,
  updateStatusAndResult,
} = require('../repositories/reviewRepository');
const { isReviewEnabled } = require('../config/languages');
const { GeminiAdapter } = require('../providers/gemini');
const logger = require('../utils/logger');

const SOURCE_SIZE_LIMIT_BYTES =
  parseInt(process.env.REVIEW_SOURCE_SIZE_LIMIT_BYTES || '65536', 10);

function providerAdapter() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) {
    return null;
  }
  return new GeminiAdapter({
    apiKey,
    model,
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || '60000', 10),
    maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '2', 10),
    maxOutputChars: parseInt(process.env.GEMINI_MAX_OUTPUT_CHARS || '32768', 10),
  });
}

async function submitReview({ userId, source, language, title, clientRequestId, focus }) {
  // 1. Authenticate (userId present).
  if (!userId) {
    throw { status: 401, code: 'UNAUTHENTICATED', message: 'Authentication required.' };
  }

  // 2. Validate language against registry.
  if (!isReviewEnabled(language)) {
    throw {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'This language is not enabled for review.',
      fieldErrors: { language: 'This language is not enabled for review.' },
    };
  }

  // 3. Validate source non-empty and within size cap (never silently truncate).
  if (!source || typeof source !== 'string' || source.trim() === '') {
    throw {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Source code must not be empty.',
      fieldErrors: { source: 'Source code must not be empty.' },
    };
  }
  const sourceBytes = Buffer.byteLength(source, 'utf8');
  if (sourceBytes > SOURCE_SIZE_LIMIT_BYTES) {
    throw {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: `Source code exceeds ${Math.floor(SOURCE_SIZE_LIMIT_BYTES / 1024)} KiB limit.`,
      fieldErrors: { source: `Source code exceeds ${Math.floor(SOURCE_SIZE_LIMIT_BYTES / 1024)} KiB limit.` },
    };
  }

  // 4. Create traceable lifecycle record.
  const correlationId = clientRequestId || crypto.randomBytes(16).toString('hex');
  const digest = crypto.createHash('sha256').update(source, 'utf8').digest('hex');

  const review = await createReview({
    owner: userId,
    language,
    title: title || null,
    source,
    sourceDigest: digest,
    sourceSize: sourceBytes,
    status: 'accepted',
    correlationId,
    focus: focus === 'security' ? 'security' : null,
  });

  // 5. Call provider from backend only.
  const adapter = providerAdapter();
  if (!adapter) {
    // Provider not configured: truthful unavailable state, never canned.
    await updateStatusAndResult(review._id, {
      status: 'failed',
      failureReason: 'AI provider is not configured on the server.',
      completedAt: new Date(),
    });
    return {
      reviewId: review._id.toString(),
      status: 'failed',
      failureReason: 'AI provider is not configured on the server.',
      providerUnavailable: true,
    };
  }

  await updateStatusAndResult(review._id, { status: 'processing' });

  let result;
  try {
    result = await adapter.analyze({ source, language, focus });
  } catch (err) {
    // Provider failure: persist honest failure, never fabricate.
    const mapped = err.code ? err : { code: 'PROVIDER_UNAVAILABLE', message: err.message, status: 502 };
    await updateStatusAndResult(review._id, {
      status: 'failed',
      failureReason: mapped.message,
      completedAt: new Date(),
    });
    return {
      reviewId: review._id.toString(),
      status: 'failed',
      failureReason: mapped.message,
      code: mapped.code,
      statusCode: mapped.status,
    };
  }

  // 6. Validate/normalize output (adapter already normalizes; cross-check here).
  const findings = Array.isArray(result.findings) ? result.findings : [];

  // 7. Persist completed result.
  const saved = await updateStatusAndResult(review._id, {
    status: 'completed',
    findings,
    summary: result.summary || null,
    limitationNotice:
      result.limitationNotice ||
      'This is an AI-assisted review. Findings are advisory and may miss issues or include false positives. Validate before acting.',
    provider: result.provider || 'gemini',
    model: result.model || null,
    promptVersion: result.promptVersion || null,
    schemaVersion: result.schemaVersion || '1.0',
    completedAt: new Date(),
  });

  logger.info('codesense-review.completed', {
    reviewId: review._id.toString(),
    userId,
    language,
    findingCount: findings.length,
  });

  return {
    reviewId: saved._id.toString(),
    status: saved.status,
    findings: saved.findings,
    summary: saved.summary,
    limitationNotice: saved.limitationNotice,
    provider: saved.provider,
    model: saved.model,
    completedAt: saved.completedAt,
  };
}

async function getReview(reviewId, userId) {
  const review = await findByIdAndOwner(reviewId, userId);
  if (!review) {return null;}
  return review;
}

module.exports = {
  submitReview,
  getReview,
  providerAdapter,
};
