#!/usr/bin/env node
/**
 * CodeSense AI — Ensure MongoDB indexes.
 *
 * Idempotently creates the indexes defined on the Mongoose models (User,
 * Review, sessions) so they exist before the application relies on them.
 * Safe to run against dev, test or production databases; creating an index
 * that already exists is a no-op.
 *
 * Usage:
 *   MONGODB_URI=mongodb://127.0.0.1:27017/codesense_ai_dev node scripts/ensure-indexes.js
 */

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../src/config/env');
const User = require('../src/models/User');
const Review = require('../src/models/Review');

async function ensureIndexes() {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    family: 4,
  });

  // User indexes (unique normalized email; owner lookup is by _id).
  await User.collection.createIndex({ email: 1 }, { unique: true });

  // Review indexes (owner-scoped history lookups).
  await Review.collection.createIndex({ owner: 1, createdAt: -1 });
  await Review.collection.createIndex({ owner: 1, status: 1, createdAt: -1 });
  await Review.collection.createIndex({ owner: 1, _id: 1 });

  console.log('codesense-indexes.ensured', {
    uri: MONGODB_URI.replace(/:[^:@]+@/, ':****@'),
    indexes: [
      'users.email(unique)',
      'reviews.owner+createdAt',
      'reviews.owner+status+createdAt',
      'reviews.owner+_id',
    ],
  });

  await mongoose.connection.close();
}

ensureIndexes().catch((err) => {
  console.error('codesense-indexes.failed', { message: err.message });
  process.exit(1);
});
