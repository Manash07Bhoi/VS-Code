/**
 * CodeSense AI — MongoDB connection management.
 *
 * Single connection owner. Fails fast on connection error. Tracks readiness
 * so health endpoints can report real dependency status.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { MONGODB_URI, NODE_ENV } = require('./env');

let connectionPromise = null;
let connected = false;

function connectDatabase() {
  if (connectionPromise) {return connectionPromise;}

  connectionPromise = (async () => {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      family: 4,
      ...(NODE_ENV === 'development' ? {} : {}),
    });
    connected = true;
    logger.info('codesense-db.connected', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });

    mongoose.connection.on('disconnected', () => {
      connected = false;
      logger.warn('codesense-db.disconnected');
    });
    mongoose.connection.on('error', (err) => {
      connected = false;
      logger.error('codesense-db.error', { message: err.message });
    });
  })();

  return connectionPromise.catch((err) => {
    connected = false;
    logger.error('codesense-db.connect-failed', { message: err.message });
    throw err;
  });
}

async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  connected = false;
}

function isDatabaseConnected() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDatabase,
  closeDatabase,
  isDatabaseConnected,
  mongoose,
};
