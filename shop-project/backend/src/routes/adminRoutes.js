const express = require('express');
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  createStaffUser,
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();
const adminOnly = [protect, isAdmin];

router.get('/users', adminOnly, getAllUsers);
router.post('/users/staff', adminOnly, createStaffUser);
router.post('/staff', adminOnly, createStaffUser);
router.put('/users/:id/role', adminOnly, updateUserRole);
router.patch('/users/:id/status', adminOnly, toggleUserStatus);
router.put('/users/:id/status', adminOnly, toggleUserStatus);
router.delete('/users/:id', adminOnly, deleteUser);

module.exports = router;
