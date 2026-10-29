const express = require('express');
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/coupons
 * @desc    Get all coupons with filtering, sorting, and pagination
 * @access  Public (customers can view available coupons)
 * @note    This endpoint is intentionally public to allow customers to see available discount codes
 * @query   page {number} - Page number (default: 1)
 * @query   limit {number} - Items per page (default: 20, max: 100)
 * @query   sortBy {string} - Sort field and order (format: field:order)
 *          Valid fields: expiryDate, createdAt, discountValue, code
 *          Valid orders: asc, desc, 1, -1
 *          Example: sortBy=createdAt:desc (default: createdAt:desc)
 * @query   status {string} - Filter by coupon status
 *          Valid values: active, expired
 * @query   discountType {string} - Filter by discount type
 *          Valid values: percentage, fixed
 * @returns {object} - Paginated list of coupons with metadata
 *
 * @example GET /api/coupons?page=1&limit=10&sortBy=expiryDate:asc&status=active
 * @example GET /api/coupons?discountType=percentage
 * @example GET /api/coupons?sortBy=discountValue:desc
 */
router.get('/', getAllCoupons);

router.use(protect, isAdmin);

/**
 * @route   POST /api/coupons
 * @desc    Create a new coupon
 * @access  Private (Admin only)
 * @body    code {string} - Unique coupon code (required, 3-50 chars, letters/numbers/hyphens/underscores only, auto-converted to uppercase)
 * @body    discountType {string} - Type of discount (required, values: "percentage" or "fixed")
 * @body    discountValue {number} - Discount amount (required, non-negative, max 100 for percentage, >0 for fixed)
 * @body    minOrderValue {number} - Minimum order value to apply coupon (optional, non-negative, default: 0)
 * @body    expiryDate {date} - Date when coupon expires (optional, must be in the future if provided, null for no expiry)
 * @body    usageLimit {number} - Maximum number of times coupon can be used (optional, non-negative integer, null for unlimited)
 * @returns {object} - Created coupon object
 *
 * @example POST /api/coupons
 * {
 *   "code": "SUMMER2024",
 *   "discountType": "percentage",
 *   "discountValue": 20,
 *   "minOrderValue": 50,
 *   "expiryDate": "2024-12-31T23:59:59Z",
 *   "usageLimit": 100
 * }
 *
 * @example POST /api/coupons
 * {
 *   "code": "FLAT_10_OFF",
 *   "discountType": "fixed",
 *   "discountValue": 10,
 *   "minOrderValue": 25
 * }
 */
router.post('/', createCoupon);

/**
 * @route   PUT /api/coupons/:id
 * @desc    Update an existing coupon
 * @access  Private (Admin only)
 * @param   id {string} - Coupon ID (MongoDB ObjectId)
 * @body    code {string} - Unique coupon code (optional, 3-50 chars, letters/numbers/hyphens/underscores only, auto-converted to uppercase)
 * @body    discountType {string} - Type of discount (optional, values: "percentage" or "fixed")
 * @body    discountValue {number} - Discount amount (optional, non-negative, max 100 for percentage, >0 for fixed)
 * @body    minOrderValue {number} - Minimum order value to apply coupon (optional, non-negative)
 * @body    expiryDate {date} - Date when coupon expires (optional, must be in the future if provided)
 * @body    usageLimit {number} - Maximum number of times coupon can be used (optional, non-negative integer)
 * @returns {object} - Updated coupon object with updatedFields array
 *
 * @error   400 - Invalid request data (validation error, no fields provided, invalid ID)
 * @error   404 - Coupon not found
 * @error   409 - Duplicate coupon code
 * @error   500 - Server error
 *
 * @example PUT /api/coupons/507f1f77bcf86cd799439011
 * {
 *   "discountValue": 25,
 *   "expiryDate": "2024-12-31T23:59:59Z"
 * }
 *
 * @example PUT /api/coupons/507f1f77bcf86cd799439011
 * {
 *   "code": "NEWCODE2024",
 *   "minOrderValue": 100
 * }
 *
 * @example PUT /api/coupons/507f1f77bcf86cd799439011
 * {
 *   "discountType": "percentage",
 *   "discountValue": 30
 * }
 */
router.put('/:id', updateCoupon);

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Delete a coupon
 * @access  Private (Admin only)
 * @param   id {string} - Coupon ID
 * @returns {object} - Deleted coupon object
 *
 * @example DELETE /api/coupons/507f1f77bcf86cd799439011
 */
router.delete('/:id', deleteCoupon);

module.exports = router;
