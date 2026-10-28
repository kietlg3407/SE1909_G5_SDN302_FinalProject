const mongoose = require('mongoose');
const Review = require('../models/reviewModel');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      message: 'Page must be positive and limit must be between 1 and 100',
    });
  }

  try {
    const filter = { productId };
    const [reviews, total, summary] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      reviews,
      summary: summary[0]
        ? {
            averageRating: Number(summary[0].averageRating.toFixed(1)),
            reviewCount: summary[0].reviewCount,
          }
        : { averageRating: 0, reviewCount: 0 },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve product reviews:', error);
    return res.status(500).json({ message: 'Failed to retrieve reviews' });
  }
};

const createReview = async (req, res) => {
  const { productId } = req.params;
  const { rating, content } = req.body;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const review = await Review.create({
      productId,
      userId: req.user._id,
      rating,
      content,
    });

    return res.status(201).json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You have already reviewed this product',
      });
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Failed to create review:', error);
    return res.status(500).json({ message: 'Failed to create review' });
  }
};

const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, 'rating')) {
    updates.rating = req.body.rating;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'content')) {
    updates.content = req.body.content;
  }

  if (!isValidObjectId(reviewId)) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Provide a rating or content to update' });
  }

  try {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Failed to update review:', error);
    return res.status(500).json({ message: 'Failed to update review' });
  }
};

const deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  if (!isValidObjectId(reviewId)) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  try {
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      userId: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({
      message: 'Review deleted successfully',
      review,
    });
  } catch (error) {
    console.error('Failed to delete review:', error);
    return res.status(500).json({ message: 'Failed to delete review' });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};
