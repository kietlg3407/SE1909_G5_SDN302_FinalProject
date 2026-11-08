const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const User = require('../models/userModel');

const buildVariantLabel = (variant) => {
  if (!variant) return '';
  const parts = [variant.size, variant.color].filter(Boolean);
  if (parts.length > 0) return parts.join(' / ');
  return variant.sku || 'Phân loại';
};

// Trừ kho nguyên tử: variant -> arrayFilters, thường -> product.stock
const decrementStock = async (productId, variant, qty) => {
  if (variant) {
    // $elemMatch ở query level: stock không đủ -> không match -> trả null
    // (modifiedCount của updateOne không đáng tin khi arrayFilters trượt)
    const updated = await Product.findOneAndUpdate(
      {
        _id: productId,
        variants: {
          $elemMatch: { _id: variant._id, stock: { $gte: qty }, isActive: true },
        },
      },
      { $inc: { 'variants.$[v].stock': -qty } },
      { arrayFilters: [{ 'v._id': variant._id }] }
    );
    return !!updated;
  }
  const updated = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } }
  );
  return !!updated;
};

// Hoàn kho khi hủy đơn
const restockItem = async (productId, variantId, qty) => {
  if (variantId) {
    await Product.updateOne(
      { _id: productId },
      { $inc: { 'variants.$[v].stock': qty } },
      { arrayFilters: [{ 'v._id': variantId }] }
    );
  } else {
    await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
  }
};

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod = 'COD',
      couponCode,
      items,
      shippingPrice = 30000,
    } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin địa chỉ giao hàng và số điện thoại',
      });
    }

    let orderItemsToProcess = [];

    if (items && Array.isArray(items) && items.length > 0) {
      orderItemsToProcess = items;
    } else {
      // Lấy từ giỏ hàng nếu không truyền danh sách items
      const userCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống' });
      }
      orderItemsToProcess = userCart.items.map((i) => ({
        product: i.product._id,
        quantity: i.quantity,
        variant: i.variant || null,
      }));
    }

    if (orderItemsToProcess.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng không có sản phẩm nào' });
    }

    // Pass 1: kiểm tra sản phẩm & phân loại (variant) tồn tại, đang kinh doanh
    const resolvedItems = [];
    for (const item of orderItemsToProcess) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm không tồn tại hoặc đã ngừng kinh doanh`,
        });
      }

      const qty = parseInt(item.quantity, 10);
      const variantId = item.variant || item.variantId || null;
      let variant = null;
      const activeVariants = (product.variants || []).filter((v) => v.isActive !== false);

      if (variantId) {
        variant = product.variants.id(variantId);
        if (!variant || variant.isActive === false) {
          return res.status(400).json({
            success: false,
            message: `Phân loại của sản phẩm "${product.name}" không tồn tại hoặc đã ngừng kinh doanh`,
          });
        }
      } else if (activeVariants.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" có phân loại, vui lòng chọn phân loại trước khi đặt hàng`,
        });
      }

      resolvedItems.push({ product, variant, quantity: qty });
    }

    // Pass 2: trừ kho nguyên tử — tránh oversell khi nhiều đơn đặt đồng thời.
    // Nếu một item không đủ tồn kho thì hoàn lại phần đã trừ trước đó.
    const finalOrderItems = [];
    const decremented = [];
    let itemsPrice = 0;

    for (const { product, variant, quantity } of resolvedItems) {
      const ok = await decrementStock(product._id, variant, quantity);

      if (!ok) {
        for (const d of decremented) {
          await restockItem(d.product, d.variant, d.quantity);
        }
        const latest = await Product.findById(product._id).select('stock variants');
        const label = buildVariantLabel(variant);
        const remain = variant && latest
          ? (latest.variants.id(variant._id)?.stock ?? 0)
          : (latest ? latest.stock : 0);
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}"${label ? ` (${label})` : ''} chỉ còn ${remain} trong kho, không đủ số lượng đặt`,
        });
      }

      decremented.push({ product: product._id, variant: variant ? variant._id : null, quantity });

      const unitPrice = variant && variant.price !== null && variant.price !== undefined
        ? variant.price
        : product.price;
      const itemTotal = unitPrice * quantity;
      itemsPrice += itemTotal;

      finalOrderItems.push({
        product: product._id,
        name: product.name,
        price: unitPrice,
        quantity,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        variant: variant ? variant._id : null,
        variantLabel: buildVariantLabel(variant),
      });
    }

    // Miễn phí vận chuyển cho đơn từ 500.000đ
    const effectiveShippingPrice = itemsPrice >= 500000 ? 0 : Number(shippingPrice) || 0;

    // Xử lý mã giảm giá (coupon)
    let discountAmount = 0;
    let appliedCoupon = { code: '', discountAmount: 0 };

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({
        code: cleanCode,
        isActive: true,
      });

      if (coupon) {
        const now = new Date();
        const isValidDate = (!coupon.startDate || new Date(coupon.startDate) <= now) &&
                            (!coupon.endDate || new Date(coupon.endDate) >= now);
        const meetsMinOrder = !coupon.minOrderValue || itemsPrice >= coupon.minOrderValue;

        if (isValidDate && meetsMinOrder) {
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round((itemsPrice * coupon.discountValue) / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
          appliedCoupon = { code: cleanCode, discountAmount };
          // Cập nhật lượt dùng
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          await coupon.save();

          // Lưu vào usedCoupons của user
          await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { usedCoupons: coupon._id },
          });
        }
      }
    }

    const totalPrice = Math.max(0, itemsPrice + effectiveShippingPrice - discountAmount);

    const order = await Order.create({
      user: req.user._id,
      orderItems: finalOrderItems,
      shippingAddress: {
        recipientName: shippingAddress.recipientName || req.user.name,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state || shippingAddress.city,
        phone: shippingAddress.phone,
      },
      paymentMethod,
      coupon: appliedCoupon,
      itemsPrice,
      shippingPrice: effectiveShippingPrice,
      totalPrice,
      status: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          changedAt: new Date(),
          changedBy: req.user._id,
          note: 'Đơn hàng được khởi tạo thành công',
        },
      ],
    });

    // Làm sạch giỏ hàng của user sau khi đặt hàng thành công
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/my-orders
exports.getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('statusHistory.changedBy', 'name role');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra quyền: Chỉ chủ đơn hàng hoặc Staff/Admin mới được xem
    const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
    const isStaffOrAdmin = req.user.role === 'admin' || req.user.role === 'staff';

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin đơn hàng này',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/cancel
exports.cancelMyOrder = async (req, res) => {
  try {
    const { reason = 'Khách hàng yêu cầu hủy đơn' } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không thể hủy đơn của người khác' });
    }

    if (!['Pending', 'Confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được xử lý hoặc đang vận chuyển, không thể hủy trực tiếp',
      });
    }

    // Hoàn lại số lượng tồn kho
    for (const item of order.orderItems) {
      await restockItem(item.product, item.variant, item.quantity);
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.statusHistory.push({
      status: 'Cancelled',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: reason,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== STAFF ORDER PROCESSING ====================

// GET /api/orders (Staff & Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      const orConditions = [
        { 'shippingAddress.phone': { $regex: term, $options: 'i' } },
        { 'shippingAddress.recipientName': { $regex: term, $options: 'i' } },
        { trackingNumber: { $regex: term, $options: 'i' } },
      ];

      // Nếu search term là ObjectId hợp lệ, tìm thêm theo _id
      if (/^[0-9a-fA-F]{24}$/.test(term)) {
        orConditions.push({ _id: term });
      }

      query.$or = orConditions;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      currentPage: parseInt(page, 10),
      orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/status (Staff & Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note = '' } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipping', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Chọn một trong: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const prevStatus = order.status;

    // Nếu đơn chuyển sang Cancelled từ trạng thái chưa giao -> hoàn lại tồn kho
    if (status === 'Cancelled' && prevStatus !== 'Cancelled' && prevStatus !== 'Delivered') {
      for (const item of order.orderItems) {
        await restockItem(item.product, item.variant, item.quantity);
      }
      order.cancelledAt = new Date();
      order.cancelReason = note || 'Nhân viên hủy đơn hàng';
    }

    // Nếu chuyển sang Delivered -> cập nhật thanh toán và ngày giao
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
      order.isPaid = true;
      if (!order.paidAt) {
        order.paidAt = new Date();
      }
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: note || `Nhân viên cập nhật trạng thái sang ${status}`,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng sang "${status}" thành công`,
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/shipping (Staff & Admin - Cập nhật trạng thái vận chuyển / mã vận đơn)
exports.updateOrderShipping = async (req, res) => {
  try {
    const { trackingNumber, shippingNotes, status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber.trim();
    }
    if (shippingNotes !== undefined) {
      order.shippingNotes = shippingNotes.trim();
    }

    // Tùy chọn cập nhật status nếu được gửi kèm (ví dụ chuyển sang 'Shipping')
    if (status && ['Confirmed', 'Processing', 'Shipping', 'Delivered'].includes(status)) {
      order.status = status;
    }

    order.statusHistory.push({
      status: order.status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: `Cập nhật vận chuyển: Mã vận đơn "${order.trackingNumber || 'N/A'}" - Ghi chú: "${order.shippingNotes || 'Không có'}"`,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin vận chuyển thành công',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

