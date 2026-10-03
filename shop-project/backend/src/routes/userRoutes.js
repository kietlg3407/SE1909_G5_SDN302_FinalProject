const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
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

// --- 1. Authentication Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- 2. User Profile Routes ---
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.put('/change-password', protect, changePassword);
router.post('/upload-avatar', protect, uploadCloud.single('avatar'), uploadAvatar);

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
