const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// Helper to populate and format cart
const populateCart = async (cart) => {
  return await cart.populate({
    path: 'items.product',
    select: 'name price originalPrice images stock category isActive variants',
  });
};

const buildVariantLabel = (variant) => {
  if (!variant) return '';
  const parts = [variant.size, variant.color].filter(Boolean);
  if (parts.length > 0) return parts.join(' / ');
  return variant.sku || 'Phân loại';
};

// Resolve variant cho item: trả về { variant, error } — error là message nếu invalid
const resolveVariant = (product, variantId) => {
  const activeVariants = (product.variants || []).filter((v) => v.isActive !== false);

  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant || variant.isActive === false) {
      return { error: 'Phân loại sản phẩm không tồn tại hoặc đã ngừng kinh doanh' };
    }
    return { variant };
  }

  if (activeVariants.length > 0) {
    return { error: 'Sản phẩm có phân loại, vui lòng chọn phân loại (size/màu) trước khi thêm vào giỏ' };
  }

  return { variant: null };
};

const variantStock = (product, variant) =>
  variant ? variant.stock : product.stock;

const unitPrice = (product, variant) =>
  variant && variant.price !== null && variant.price !== undefined ? variant.price : product.price;

const sameItem = (item, productId, variantKey) =>
  item.product &&
  item.product.toString() === productId.toString() &&
  (item.variant ? item.variant.toString() : null) === variantKey;

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    } else {
      cart = await populateCart(cart);
      // Clean up deleted products & invalid variants
      const validItems = cart.items.filter((item) => {
        if (!item.product || !item.product.isActive) return false;
        const activeVariants = (item.product.variants || []).filter((v) => v.isActive !== false);
        if (item.variant) {
          const v = item.product.variants && item.product.variants.id
            ? item.product.variants.id(item.variant)
            : null;
          return v && v.isActive !== false;
        }
        // SP có phân loại nhưng item cũ không gắn variant -> loại bỏ
        return activeVariants.length === 0;
      });
      if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        await cart.save();
      }
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
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
    const { productId, quantity = 1, variantId } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Thông tin sản phẩm hoặc số lượng không hợp lệ' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh' });
    }

    const { variant, error } = resolveVariant(product, variantId);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const availableStock = variantStock(product, variant);
    if (availableStock < qty) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm chỉ còn ${availableStock} sản phẩm trong kho`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const variantKey = variant ? variant._id.toString() : null;
    const itemIndex = cart.items.findIndex((item) => sameItem(item, productId, variantKey));

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + qty;
      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Không thể thêm quá số lượng tồn kho (${availableStock})`,
        });
      }
      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].price = unitPrice(product, variant);
    } else {
      cart.items.push({
        product: product._id,
        variant: variant ? variant._id : null,
        variantLabel: buildVariantLabel(variant),
        quantity: qty,
        price: unitPrice(product, variant),
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

// PUT /api/cart/:productId  (variantId qua body hoặc query)
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const variantId = req.body.variantId || req.query.variantId;
    const qty = parseInt(quantity, 10);

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const variantKey = variantId ? variantId.toString() : null;
    const itemIndex = cart.items.findIndex((item) => sameItem(item, productId, variantKey));

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng' });
    }

    if (isNaN(qty) || qty <= 0) {
      // Xóa sản phẩm nếu số lượng <= 0
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      const cartItem = cart.items[itemIndex];
      let availableStock = 0;
      if (product) {
        if (cartItem.variant) {
          const v = product.variants && product.variants.id
            ? product.variants.id(cartItem.variant)
            : null;
          availableStock = v && v.isActive !== false ? v.stock : 0;
        } else {
          availableStock = product.stock;
        }
      }
      if (!product || !product.isActive || (cartItem.variant && availableStock === 0)) {
        cart.items.splice(itemIndex, 1);
      } else if (qty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Số lượng tồn kho chỉ còn ${availableStock}`,
        });
      } else {
        cartItem.quantity = qty;
        if (product) {
          const v = cartItem.variant && product.variants && product.variants.id
            ? product.variants.id(cartItem.variant)
            : null;
          cartItem.price = v && v.price != null ? v.price : product.price;
        }
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

// DELETE /api/cart/:productId?variantId=
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const variantKey = req.query.variantId ? req.query.variantId.toString() : null;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng trống' });
    }

    cart.items = cart.items.filter(
      (item) => !sameItem(item, productId, variantKey)
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
