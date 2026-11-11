const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} = require('../controllers/productController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

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

// Endpoint tải lên file ảnh từ máy tính (Admin & Staff)
router.post('/upload', protect, isStaffOrAdmin, upload.array('images', 10), uploadProductImages);

router.get('/', optionalAuth, getProducts);
router.get('/:id', getProductById);

// Các endpoint yêu cầu quyền Admin hoặc Staff
router.post('/:id/variants', protect, isStaffOrAdmin, createProductVariant);
router.put('/:id/variants/:variantId', protect, isStaffOrAdmin, updateProductVariant);
router.delete('/:id/variants/:variantId', protect, isStaffOrAdmin, deleteProductVariant);
router.post('/', protect, isStaffOrAdmin, createProduct);
router.put('/:id', protect, isStaffOrAdmin, updateProduct);
router.delete('/:id', protect, isStaffOrAdmin, deleteProduct);

module.exports = router;
