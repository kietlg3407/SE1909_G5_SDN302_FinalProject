const express = require('express');
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllCoupons);

router.use(protect, isAdmin);

router.post('/', createCoupon);

router
  .route('/:id')
  .put(updateCoupon)
  .delete(deleteCoupon);

module.exports = router;