const express = require('express');
const {
  createComment,
  getProductComments,
  updateComment,
  deleteComment,
  getAdminComments,
} = require('../controllers/commentController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public: Lấy danh sách bình luận của 1 sản phẩm
router.get('/product/:productId', getProductComments);

// Private (Đăng nhập): Tạo bình luận / trả lời bình luận
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

// Private (Staff/Admin): Quản lý bình luận CSKH
router.get('/admin', protect, isStaffOrAdmin, getAdminComments);

module.exports = router;

