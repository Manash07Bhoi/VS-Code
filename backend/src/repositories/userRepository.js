/**
 * CodeSense AI — User repository.
 */

const User = require('../models/User');

async function createUser({ email, passwordHash }) {
  return User.create({ email, passwordHash });
}

async function findByEmail(email) {
  return User.findByEmail(email);
}

async function findById(id) {
  return User.findById(id).lean();
}

async function updateLastAuthenticated(id) {
  return User.findByIdAndUpdate(
    id,
    { lastAuthenticatedAt: new Date() },
    { new: true }
  ).lean();
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateLastAuthenticated,
};
