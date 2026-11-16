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
  const ready = db && providerConfigured;

  if (!ready) {
    return res.status(503).json({
      status: 'not-ready',
      service: 'codesense-backend',
      checks: {
        database: db ? 'connected' : 'disconnected',
        provider: providerConfigured ? 'configured' : 'not-configured',
      },
    });
  }

  res.json({
    status: 'ready',
    service: 'codesense-backend',
    checks: {
      database: 'connected',
      provider: 'configured',
    },
  });
});

module.exports = router;
