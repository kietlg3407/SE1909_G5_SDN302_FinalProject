const mongoose = require('mongoose');
const Favorite = require('../models/favoriteModel');
const Product = require('../models/productModel');

/**
 * @desc Thêm hoặc Xóa sản phẩm khỏi danh sách yêu thích (Toggle)
 * @route POST /api/favorites/toggle
 * @access Private
 */
const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingFavorite) {
      await existingFavorite.deleteOne();
      return res.json({
        success: true,
        isFavorite: false,
        message: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
        productId,
      });
    }

    await Favorite.create({
      user: req.user._id,
      product: productId,
    });

    return res.status(201).json({
      success: true,
      isFavorite: true,
      message: 'Đã thêm sản phẩm vào danh sách yêu thích',
      productId,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({
        success: true,
        isFavorite: true,
        message: 'Sản phẩm đã có trong danh sách yêu thích',
      });
    }
    res.status(500).json({ success: false, message: 'Lỗi cập nhật yêu thích', error: error.message });
  }
};

/**
 * @desc Lấy danh sách sản phẩm yêu thích của người dùng hiện tại
 * @route GET /api/favorites
 * @access Private
 */
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 })
      .lean();

    // Lọc bỏ các sản phẩm đã bị xóa khỏi hệ thống
    const validFavorites = favorites
      .filter((item) => item.product !== null)
      .map((item) => ({
        _id: item._id,
        createdAt: item.createdAt,
        ...item.product,
        product: item.product,
      }));

    res.json({
      success: true,
      count: validFavorites.length,
      favorites: validFavorites,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách yêu thích', error: error.message });
  }
};

/**
 * @desc Lấy danh sách ID các sản phẩm đã yêu thích
 * @route GET /api/favorites/ids
 * @access Private
 */
const getFavoriteIds = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).select('product').lean();
    const favoriteIds = favorites.map((f) => f.product.toString());

    res.json({
      success: true,
      favoriteIds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách ID yêu thích', error: error.message });
  }
};

/**
 * @desc Xóa sản phẩm khỏi danh sách yêu thích
 * @route DELETE /api/favorites/:productId
 * @access Private
 */
const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const result = await Favorite.findOneAndDelete({
      user: req.user._id,
      product: productId,
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không có trong danh sách yêu thích' });
    }

    res.json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
      productId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa sản phẩm yêu thích', error: error.message });
  }
};

module.exports = {
  toggleFavorite,
  getFavorites,
  getFavoriteIds,
  removeFavorite,
};

