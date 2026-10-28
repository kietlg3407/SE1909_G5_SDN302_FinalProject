const mongoose = require('mongoose');
const Comment = require('../models/commentModel');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getProductComments = async (req, res) => {
  const { productId } = req.params;
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      message: 'Page must be positive and limit must be between 1 and 100',
    });
  }

  try {
    const filter = { productId };
    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate('userId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Comment.countDocuments(filter),
    ]);

    return res.status(200).json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve product comments:', error);
    return res.status(500).json({ message: 'Failed to retrieve comments' });
  }
};

const createComment = async (req, res) => {
  const { productId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const comment = await Comment.create({
      productId,
      userId: req.user._id,
      content,
    });

    return res.status(201).json({
      message: 'Comment created successfully',
      comment,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Failed to create comment:', error);
    return res.status(500).json({ message: 'Failed to create comment' });
  }
};

const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  if (!Object.prototype.hasOwnProperty.call(req.body, 'content')) {
    return res.status(400).json({ message: 'Provide comment content to update' });
  }

  try {
    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, userId: req.user._id },
      { content },
      { new: true, runValidators: true }
    );

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    return res.status(200).json({
      message: 'Comment updated successfully',
      comment,
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Failed to update comment:', error);
    return res.status(500).json({ message: 'Failed to update comment' });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  try {
    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      userId: req.user._id,
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    return res.status(200).json({
      message: 'Comment deleted successfully',
      comment,
    });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
};

module.exports = {
  getProductComments,
  createComment,
  updateComment,
  deleteComment,
};
