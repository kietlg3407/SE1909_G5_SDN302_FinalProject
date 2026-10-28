const mongoose = require('mongoose');
const Favorite = require('../models/favoriteModel');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getFavorites = async (req, res) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

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
    const filter = { userId: req.user._id };
    const [favorites, total] = await Promise.all([
      Favorite.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Favorite.countDocuments(filter),
    ]);

    return res.status(200).json({
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve favorites:', error);
    return res.status(500).json({ message: 'Failed to retrieve favorites' });
  }
};

const addFavorite = async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const favorite = await Favorite.create({
      userId: req.user._id,
      productId,
    });

    return res.status(201).json({
      message: 'Product added to favorites',
      favorite,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        message: 'Product is already in favorites',
        productId,
      });
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Failed to add favorite:', error);
    return res.status(500).json({ message: 'Failed to add favorite' });
  }
};

const removeFavorite = async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const favorite = await Favorite.findOneAndDelete({
      userId: req.user._id,
      productId,
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    return res.status(200).json({
      message: 'Product removed from favorites',
      favorite,
    });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return res.status(500).json({ message: 'Failed to remove favorite' });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};
