const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// Helper to populate and format cart
const populateCart = async (cart) => {
  return await cart.populate({
    path: 'items.product',
    select: 'name price originalPrice images stock category isActive',
  });
};

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    } else {
      cart = await populateCart(cart);
      // Clean up deleted products
      const validItems = cart.items.filter((item) => item.product && item.product.isActive);
      if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        await cart.save();
      }
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + (item.product ? item.product.price * item.quantity : 0),
      0
    );

    res.status(200).json({
      success: true,
      cart,
      totalAmount,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Thông tin sản phẩm hoặc số lượng không hợp lệ' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh' });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm chỉ còn ${product.stock} sản phẩm trong kho`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Không thể thêm quá số lượng tồn kho (${product.stock})`,
        });
      }
      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].price = product.price;
    } else {
      cart.items.push({
        product: product._id,
        quantity: qty,
        price: product.price,
      });
    }

    await cart.save();
    cart = await populateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Đã thêm sản phẩm vào giỏ hàng',
      cart,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/cart/:productId
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng' });
    }

    if (isNaN(qty) || qty <= 0) {
      // Xóa sản phẩm nếu số lượng <= 0
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        cart.items.splice(itemIndex, 1);
      } else if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Số lượng tồn kho chỉ còn ${product.stock}`,
        });
      } else {
        cart.items[itemIndex].quantity = qty;
        cart.items[itemIndex].price = product.price;
      }
    }

    await cart.save();
    cart = await populateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Cập nhật giỏ hàng thành công',
      cart,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/:productId
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng trống' });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    await cart.save();
    cart = await populateCart(cart);

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      cart,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({
      success: true,
      message: 'Đã làm trống giỏ hàng',
      cart: cart || { items: [] },
      totalItems: 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

