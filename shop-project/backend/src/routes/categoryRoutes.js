const express = require('express');
const {
  getCategories,
  getManagedCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/classificationController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getCategories);
router.get('/manage', protect, isStaffOrAdmin, getManagedCategories);
router.post('/', protect, isStaffOrAdmin, createCategory);
router.put('/:id', protect, isStaffOrAdmin, updateCategory);
router.delete('/:id', protect, isStaffOrAdmin, deleteCategory);

module.exports = router;
