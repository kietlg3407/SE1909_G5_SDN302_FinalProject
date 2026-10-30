const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true,
      maxlength: [150, 'Tên sản phẩm không quá 150 ký tự'],
    },
    description: {
      type: String,
      required: [true, 'Mô tả sản phẩm là bắt buộc'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Giá sản phẩm là bắt buộc'],
      min: [0, 'Giá không được âm'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Giá gốc không được âm'],
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Danh mục sản phẩm là bắt buộc'],
      trim: true,
    },
    brand: {
      type: String,
      default: 'CLOSET',
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Số lượng tồn kho là bắt buộc'],
      min: [0, 'Số lượng không được âm'],
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Tối ưu truy vấn text search cho Phần 5
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, price: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
