const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadCloud } = require('../config/cloudinary');

const handleAvatarUpload = (req, res, next) => {
  uploadCloud.single('avatar')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: 'Kích thước tệp vượt quá giới hạn cho phép (tối đa 2MB)',
      });
    }

    if (err.code === 'INVALID_FILE_TYPE' || err.statusCode === 400 || err.name === 'MulterError') {
      return res.status(400).json({
        message: err.message || 'Tệp tải lên không hợp lệ (chỉ chấp nhận JPEG, PNG, WEBP)',
      });
    }

    console.error('[handleAvatarUpload Error]:', err);
    return res.status(500).json({
      message: 'Đã xảy ra lỗi hệ thống khi tải lên ảnh đại diện',
    });
  });
};

// --- 1. Authentication Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// --- 2. User Profile Routes ---
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.put('/change-password', protect, changePassword);
router.post('/upload-avatar', protect, handleAvatarUpload, uploadAvatar);

// --- 3. Address Management Routes ---
router
  .route('/addresses')
  .get(protect, getAddresses)
  .post(protect, addAddress);

router
  .route('/addresses/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.put('/addresses/:addressId/default', protect, setDefaultAddress);

module.exports = router;
