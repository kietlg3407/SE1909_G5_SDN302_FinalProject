const express = require('express');
const {
  getBrands,
  getManagedBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/classificationController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getBrands);
router.get('/manage', protect, isStaffOrAdmin, getManagedBrands);
router.post('/', protect, isStaffOrAdmin, createBrand);
router.put('/:id', protect, isStaffOrAdmin, updateBrand);
router.delete('/:id', protect, isStaffOrAdmin, deleteBrand);

module.exports = router;
