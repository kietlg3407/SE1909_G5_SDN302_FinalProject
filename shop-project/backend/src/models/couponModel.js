const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed'],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    usageLimit: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;