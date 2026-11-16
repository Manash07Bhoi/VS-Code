/**
 * CodeSense AI — Review repository.
 *
 * All private queries are owner-scoped in the database predicate itself.
 */

const Review = require('../models/Review');

async function createReview(data) {
  return Review.create(data);
}

async function findByIdAndOwner(reviewId, ownerId) {
  return Review.findOne({ _id: reviewId, owner: ownerId }).lean();
}

async function listByOwner(ownerId, { page, limit, language, status, sort, order }) {
  const filter = { owner: ownerId };
  if (language) filter.language = language;
  if (status) filter.status = status;

  const sortObj = { [sort]: order === 'asc' ? 1 : -1, _id: 1 }; // stable tie-breaker

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

async function deleteByIdAndOwner(reviewId, ownerId) {
  const result = await Review.deleteOne({ _id: reviewId, owner: ownerId });
  return result.deletedCount > 0;
}

async function updateStatusAndResult(reviewId, updates) {
  return Review.findByIdAndUpdate(reviewId, updates, { new: true }).lean();
}

module.exports = {
  createReview,
  findByIdAndOwner,
  listByOwner,
  deleteByIdAndOwner,
  updateStatusAndResult,
};
