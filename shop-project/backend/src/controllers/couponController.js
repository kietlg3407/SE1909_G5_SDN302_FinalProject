const Coupon = require('../models/couponModel');

const couponFields = [
  'code',
  'discountType',
  'discountValue',
  'minOrderValue',
  'expiryDate',
  'usageLimit',
];

const getErrorMessage = (error) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected error occurred while processing the coupon request';
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    return res.status(200).json({
      message: 'Coupons retrieved successfully',
      coupons,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve coupons',
      error: getErrorMessage(error),
    });
  }
};

const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    return res.status(201).json({
      message: 'Coupon created successfully',
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create coupon',
      error: getErrorMessage(error),
    });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const updates = couponFields.reduce((fields, field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        fields[field] = req.body[field];
      }
      return fields;
    }, {});

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    return res.status(200).json({
      message: 'Coupon updated successfully',
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update coupon',
      error: getErrorMessage(error),
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    return res.status(200).json({
      message: 'Coupon deleted successfully',
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete coupon',
      error: getErrorMessage(error),
    });
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};