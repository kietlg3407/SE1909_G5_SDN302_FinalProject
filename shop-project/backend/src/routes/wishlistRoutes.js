const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
} = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.delete('/:productId', removeFromWishlist);
router.post('/move-to-cart', moveToCart);

module.exports = router;

