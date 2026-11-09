const express = require('express');
const {
  createReview,
  updateMyReview,
  getProductReviews,
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public: Lấy đánh giá của 1 sản phẩm
router.get('/product/:productId', getProductReviews);

// Private (Customer): Gửi đánh giá mới hoặc chỉnh sửa đánh giá của chính mình
router.post('/', protect, createReview);
router.put('/:id', protect, updateMyReview);

// Private (Staff/Admin): Quản lý & duyệt đánh giá
router.get('/admin', protect, isStaffOrAdmin, getAdminReviews);
router.put('/:id/status', protect, isStaffOrAdmin, updateReviewStatus);
router.delete('/:id', protect, isStaffOrAdmin, deleteReview);

module.exports = router;

