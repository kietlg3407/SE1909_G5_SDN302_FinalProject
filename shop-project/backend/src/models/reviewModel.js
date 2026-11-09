const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Sản phẩm là bắt buộc'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người đánh giá là bắt buộc'],
    },
    rating: {
      type: Number,
      required: [true, 'Số sao đánh giá là bắt buộc'],
      min: [1, 'Đánh giá tối thiểu 1 sao'],
      max: [5, 'Đánh giá tối đa 5 sao'],
    },
    comment: {
      type: String,
      required: [true, 'Nội dung nhận xét là bắt buộc'],
      trim: true,
      maxlength: [1000, 'Nội dung nhận xét không được vượt quá 1000 ký tự'],
    },
    status: {
      type: String,
      enum: ['approved', 'hidden'],
      default: 'approved',
      index: true,
    },
    response: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Nội dung phản hồi không quá 1000 ký tự'],
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Một người dùng chỉ đánh giá 1 lần cho 1 sản phẩm
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

