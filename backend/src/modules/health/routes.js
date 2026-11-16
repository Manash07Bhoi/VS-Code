/**
 * CodeSense AI — Health / readiness endpoints.
 *
 * /live: process liveness only.
 * /ready: discloses only safe dependency state (database connectivity).
 * Provider credentials are never disclosed; only whether a key is configured.
 */

const express = require('express');
const router = express.Router();
const { isDatabaseConnected } = require('../../config/database');
const logger = require('../../utils/logger');

router.get('/live', (_req, res) => {
  res.json({ status: 'ok', service: 'codesense-backend' });
});

router.get('/ready', async (_req, res) => {
  const db = isDatabaseConnected();
  const providerConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL);

  // Backend is ready when the database is connected. Provider configuration
  // is reported separately and does not block readiness: reviews return an
  // honest provider-unavailable state when Gemini is not configured.
  const ready = db;

  res.json({
    status: ready ? 'ready' : 'not-ready',
    service: 'codesense-backend',
    checks: {
      database: db ? 'connected' : 'disconnected',
      provider: providerConfigured ? 'configured' : 'not-configured',
    },
  });
});

module.exports = router;
