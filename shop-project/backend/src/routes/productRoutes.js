const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware nhận diện người dùng tùy chọn (cho phép admin/staff xem cả inactive products khi cần)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_for_development';
      const decoded = jwt.verify(token, secret);
      req.user = await User.findById(decoded.id).select('role isActive');
    } catch (_) {}
  }
  next();
};

router.get('/', optionalAuth, getProducts);
router.get('/:id', getProductById);

// Các endpoint yêu cầu quyền Admin hoặc Staff
router.post('/', protect, isStaffOrAdmin, createProduct);
router.put('/:id', protect, isStaffOrAdmin, updateProduct);
router.delete('/:id', protect, isStaffOrAdmin, deleteProduct);

module.exports = router;
