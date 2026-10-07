const express = require('express');
const { getStats } = require('../controllers/statsController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, isAdmin, getStats);

module.exports = router;