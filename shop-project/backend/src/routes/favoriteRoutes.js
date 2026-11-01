const express = require('express');
const {
  toggleFavorite,
  getFavorites,
  getFavoriteIds,
  removeFavorite,
} = require('../controllers/favoriteController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả các routes yêu cầu đăng nhập
router.use(protect);

router.post('/toggle', toggleFavorite);
router.get('/', getFavorites);
router.get('/ids', getFavoriteIds);
router.delete('/:productId', removeFavorite);

module.exports = router;

