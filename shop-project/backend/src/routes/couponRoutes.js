const express = require('express');
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');

const router = express.Router();

router
  .route('/')
  .get(getAllCoupons)
  .post(createCoupon);

router
  .route('/:id')
  .put(updateCoupon)
  .delete(deleteCoupon);

module.exports = router;