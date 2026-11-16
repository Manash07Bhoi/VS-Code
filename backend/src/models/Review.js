/**
 * CodeSense AI — Review model.
 *
 * One submitted review lifecycle and retained result, owned by exactly one
 * user. Source retention is a privacy decision: source is retained so the
 * report detail can show the reviewed code and validated locations, and is
 * disclosed to the user. Deletion removes the record and associated source.
 */

const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    findingId: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['bug/correctness', 'security', 'performance', 'code-quality'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: null,
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: null,
    },
    title: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
    impact: { type: String, trim: true, default: null },
    recommendation: { type: String, trim: true, default: null },
    evidence: { type: String, trim: true, default: null },
    lineStart: { type: Number, default: null },
    lineEnd: { type: Number, default: null },
    snippet: { type: String, trim: true, default: null },
    caveats: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    source: {
      type: String,
      default: null,
    },
    sourceDigest: {
      type: String,
      trim: true,
      default: null,
    },
    sourceSize: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['accepted', 'processing', 'completed', 'failed'],
      required: true,
      default: 'accepted',
      index: true,
    },
    findings: [findingSchema],
    summary: { type: String, trim: true, default: null },
    limitationNotice: { type: String, trim: true, default: null },
    provider: { type: String, trim: true, default: null },
    model: { type: String, trim: true, default: null },
    promptVersion: { type: String, trim: true, default: null },
    schemaVersion: { type: String, trim: true, default: '1.0' },
    correlationId: { type: String, trim: true, default: null },
    failureReason: { type: String, trim: true, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Indexes from real query patterns: owner-scoped history sort & filters.
reviewSchema.index({ owner: 1, createdAt: -1 });
reviewSchema.index({ owner: 1, status: 1, createdAt: -1 });
reviewSchema.index({ owner: 1, _id: 1 });

// Prevent unbounded document growth: enforce source/output sizes at app layer.
reviewSchema.path('source').validate(
  function (value) {
    return value === null || Buffer.byteLength(value, 'utf8') <= 256 * 1024;
  },
  'Source exceeds maximum retained size.'
);

module.exports = mongoose.model('Review', reviewSchema);
