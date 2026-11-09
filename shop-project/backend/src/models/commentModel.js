const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
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
      required: [true, 'Người bình luận là bắt buộc'],
    },
    content: {
      type: String,
      required: [true, 'Nội dung bình luận là bắt buộc'],
      trim: true,
      maxlength: [1000, 'Nội dung bình luận không vượt quá 1000 ký tự'],
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    isStaffReply: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;

