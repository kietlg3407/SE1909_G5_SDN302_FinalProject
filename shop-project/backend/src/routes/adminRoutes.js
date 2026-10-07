const express = require('express');
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();
const adminOnly = [protect, isAdmin];

router.get('/users', adminOnly, getAllUsers);
router.put('/users/:id/role', adminOnly, updateUserRole);
router.delete('/users/:id', adminOnly, deleteUser);

module.exports = router;