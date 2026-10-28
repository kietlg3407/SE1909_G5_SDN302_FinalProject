const express = require('express');
const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require('../controllers/favoriteController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, getFavorites);

router
  .route('/:productId')
  .post(protect, addFavorite)
  .delete(protect, removeFavorite);

module.exports = router;
