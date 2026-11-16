/**
 * CodeSense AI — Password hashing (bcrypt fallback per ADR; argon2id where
 * deployment permits). Server-side only.
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
