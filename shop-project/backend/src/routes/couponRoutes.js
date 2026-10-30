const express = require('express');
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  consumeCoupon,
} = require('../controllers/couponController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/coupons
 * @desc    Get all coupons with filtering, sorting, and pagination
 * @access  Public
 */
router.get('/', getAllCoupons);

/**
 * @route   POST /api/coupons/apply
 * @desc    Khách hàng kiểm tra và áp dụng mã giảm giá (kiểm tra single-use per customer)
 * @access  Private (Logged in customer/user)
 */
router.post('/apply', protect, applyCoupon);

/**
 * @route   POST /api/coupons/consume
 * @desc    Ghi nhận mã giảm giá đã dùng vào usedCoupons của user
 * @access  Private (Logged in customer/user)
 */
router.post('/consume', protect, consumeCoupon);

// Cụm quản lý Coupon: Cho phép cả Admin và Staff thao tác CRUD
router.use(protect, isStaffOrAdmin);

/**
 * @route   POST /api/coupons
 * @desc    Create a new coupon
 * @access  Private (Admin & Staff)
 */
router.post('/', createCoupon);

/**
 * @route   PUT /api/coupons/:id
 * @desc    Update an existing coupon
 * @access  Private (Admin & Staff)
 */
router.put('/:id', updateCoupon);

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Delete a coupon (Bảo vệ không xóa WELCOME10)
 * @access  Private (Admin & Staff)
 */
router.delete('/:id', deleteCoupon);

module.exports = router;
