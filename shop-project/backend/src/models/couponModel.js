const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          // Allow alphanumeric characters, hyphens, and underscores
          // Minimum 3 characters, maximum 50 characters
          // Schema runs after uppercase transform, so we check uppercase
          return /^[A-Z0-9_-]{3,50}$/.test(v);
        },
        message: 'Coupon code must be 3-50 characters long and contain only letters, numbers, hyphens, and underscores',
      },
    },
    discountType: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: {
        values: ['percentage', 'fixed'],
        message: 'Discount type must be either "percentage" or "fixed"',
      },
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value must be non-negative'],
      validate: {
        validator: function(v) {
          // If discount type is percentage, value cannot exceed 100
          if (this.discountType === 'percentage') {
            return v <= 100;
          }
          // If discount type is fixed, value must be greater than 0
          if (this.discountType === 'fixed') {
            return v > 0;
          }
          return true;
        },
        message: function() {
          if (this.discountType === 'percentage') {
            return 'Percentage discount cannot exceed 100%';
          }
          if (this.discountType === 'fixed') {
            return 'Fixed discount value must be greater than 0';
          }
          return 'Invalid discount value';
        },
      },
    },
    minOrderValue: {
      type: Number,
      min: [0, 'Minimum order value must be non-negative'],
      default: 0,
    },
    expiryDate: {
      type: Date,
      validate: {
        validator: function(v) {
          // If expiry date is provided, it must be in the future
          // Allow null/undefined (no expiry)
          if (v === null || v === undefined) return true;
          return v > new Date();
        },
        message: 'Expiry date must be in the future',
      },
      default: null,
    },
    usageLimit: {
      type: Number,
      min: [0, 'Usage limit must be non-negative'],
      validate: {
        validator: function(v) {
          // If provided, must be an integer
          if (v === undefined || v === null) return true;
          return Number.isInteger(v);
        },
        message: 'Usage limit must be an integer',
      },
      default: null,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;