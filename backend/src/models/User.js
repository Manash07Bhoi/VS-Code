/**
 * CodeSense AI — User model.
 *
 * Account identity and authentication metadata. Passwords are hashed with
 * bcrypt (server-side only). Email is normalized and unique. Never stores
 * plaintext passwords, provider keys, or recoverable password content.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 1,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    lastAuthenticatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: false },
    toObject: { virtuals: false },
  }
);

// Indexes from real query patterns: unique normalized email (owner lookup).

// Note: password hashing happens in the service layer (utils/crypto.js) before
// persistence; no model-level save middleware is required.

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email }).lean();
};

module.exports = mongoose.model('User', userSchema);
