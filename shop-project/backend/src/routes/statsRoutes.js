const express = require('express');
const { getStats } = require('../controllers/statsController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, isStaffOrAdmin, getStats);

module.exports = router;
