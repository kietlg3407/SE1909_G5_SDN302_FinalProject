const express = require('express');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router
  .route('/products/:productId/reviews')
  .get(getProductReviews)
  .post(protect, createReview);

router
  .route('/reviews/:reviewId')
  .patch(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
