#!/usr/bin/env node
/**
 * CodeSense AI — Backend entry point.
 *
 * Loads configuration, validates required environment at startup (fail-fast),
 * connects MongoDB, mounts the Express app, starts listening, and handles
 * graceful shutdown.
 */

const { PORT, HOST, NODE_ENV } = require('./src/config/env');
const app = require('./src/app');
const { connectDatabase, closeDatabase, isDatabaseConnected } = require('./src/config/database');
const logger = require('./src/utils/logger');

let server = null;

async function start() {
  try {
    // Connect to MongoDB before accepting traffic.
    await connectDatabase();

    server = app.listen(PORT, HOST, () => {
      logger.info('codesense-backend.started', {
        port: PORT,
        host: HOST,
        nodeEnv: NODE_ENV,
        database: isDatabaseConnected() ? 'connected' : 'disconnected',
      });
    });

    server.on('error', (err) => {
      logger.error('codesense-backend.server-error', { message: err.message, code: err.code });
      process.exit(1);
    });
  } catch (err) {
    logger.error('codesense-backend.start-failed', { message: err.message });
    process.exit(1);
  }
}

function handleSignal(signal) {
  logger.info('codesense-backend.signal-received', { signal });
  async function shutdown() {
    try {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
        logger.info('codesense-backend.http-stopped');
      }
      await closeDatabase();
      logger.info('codesense-backend.database-closed');
      process.exit(0);
    } catch (err) {
      logger.error('codesense-backend.shutdown-error', { message: err.message });
      process.exit(1);
    }
  }
  shutdown();
}

process.on('SIGTERM', () => handleSignal('SIGTERM'));
process.on('SIGINT', () => handleSignal('SIGINT'));

// Capture unhandled rejections and exceptions without swallowing them.
process.on('unhandledRejection', (reason, promise) => {
  logger.error('codesense-backend.unhandled-rejection', {
    message: reason && reason.message ? reason.message : String(reason),
  });
});
process.on('uncaughtException', (err) => {
  logger.error('codesense-backend.uncaught-exception', { message: err.message });
  process.exit(1);
});

start();
