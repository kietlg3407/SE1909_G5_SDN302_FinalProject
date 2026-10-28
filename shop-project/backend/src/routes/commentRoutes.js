const express = require('express');
const {
  getProductComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router
  .route('/products/:productId/comments')
  .get(getProductComments)
  .post(protect, createComment);

router
  .route('/comments/:commentId')
  .patch(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;
