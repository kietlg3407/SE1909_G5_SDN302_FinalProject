const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      select: 'name price originalPrice images stock category isActive',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    } else {
      // Filter out deleted/inactive items
      const valid = wishlist.products.filter((p) => p && p.isActive);
      if (valid.length !== wishlist.products.length) {
        wishlist.products = valid.map((p) => p._id);
        await wishlist.save();
        wishlist.products = valid;
      }
    }

    res.status(200).json({
      success: true,
      wishlist,
      count: wishlist.products.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Thiếu productId' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.some(
      (p) => p.toString() === productId.toString()
    );

    if (!exists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    wishlist = await wishlist.populate({
      path: 'products',
      select: 'name price originalPrice images stock category isActive',
    });

    res.status(200).json({
      success: true,
      message: exists
        ? 'Sản phẩm đã có trong danh sách yêu thích'
        : 'Đã thêm vào danh sách yêu thích',
      wishlist,
      count: wishlist.products.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== productId.toString()
      );
      await wishlist.save();
      wishlist = await wishlist.populate({
        path: 'products',
        select: 'name price originalPrice images stock category isActive',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa khỏi danh sách yêu thích',
      wishlist: wishlist || { products: [] },
      count: wishlist ? wishlist.products.length : 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/wishlist/move-to-cart
exports.moveToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm chỉ còn ${product.stock} trong kho`,
      });
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = Math.min(
        cart.items[itemIndex].quantity + qty,
        product.stock
      );
    } else {
      cart.items.push({
        product: product._id,
        quantity: qty,
        price: product.price,
      });
    }
    await cart.save();

    // Remove from wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== productId.toString()
      );
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Đã chuyển sản phẩm vào giỏ hàng',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

