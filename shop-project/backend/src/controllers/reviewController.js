const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Product = require('../models/productModel');

/**
 * Tự động tính toán lại điểm rating trung bình và số lượng review của sản phẩm
 */
const updateProductRating = async (productId) => {
  try {
    const approvedReviews = await Review.find({
      product: productId,
      status: 'approved',
    });

    const numReviews = approvedReviews.length;
    let avgRating = 5;

    if (numReviews > 0) {
      const sum = approvedReviews.reduce((acc, curr) => acc + curr.rating, 0);
      avgRating = Math.round((sum / numReviews) * 10) / 10;
    }

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews,
    });
  } catch (error) {
    console.error('Lỗi tính toán rating sản phẩm:', error.message);
  }
};

/**
 * @desc Khách hàng gửi đánh giá cho sản phẩm
 * @route POST /api/reviews
 * @access Private (Khách hàng đã đăng nhập)
 */
const createReview = async (req, res) => {
  try {
    // Chỉ tài khoản khách hàng mới được phép gửi đánh giá
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ tài khoản khách hàng mới có thể đánh giá sản phẩm. Tài khoản Quản trị / Nhân viên không được phép đánh giá.',
      });
    }

    const { productId, rating, comment } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Số sao đánh giá phải từ 1 đến 5 sao' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung đánh giá' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // Kiểm tra xem người dùng đã từng gửi đánh giá sản phẩm này chưa
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi đánh giá cho sản phẩm này rồi',
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating: numericRating,
      comment: comment.trim(),
      status: 'approved', // Đăng trực tiếp không cần duyệt
    });

    // Cập nhật ngay rating trung bình và số lượng review
    await updateProductRating(productId);

    res.status(201).json({
      success: true,
      message: 'Đánh giá của bạn đã được đăng thành công',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi đánh giá cho sản phẩm này rồi',
      });
    }
    res.status(500).json({ success: false, message: 'Lỗi gửi đánh giá', error: error.message });
  }
};

/**
 * @desc Khách hàng chỉnh sửa đánh giá của chính mình
 * @route PUT /api/reviews/:id
 * @access Private (Chỉ khách hàng sở hữu review)
 */
const updateMyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Chỉ tài khoản khách hàng mới được sửa đánh giá
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ tài khoản khách hàng mới có quyền chỉnh sửa đánh giá',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    // Chỉ chủ sở hữu mới được sửa
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa đánh giá của người khác',
      });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        return res.status(400).json({ success: false, message: 'Số sao đánh giá phải từ 1 đến 5 sao' });
      }
      review.rating = numRating;
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({ success: false, message: 'Nội dung nhận xét không được để trống' });
      }
      review.comment = comment.trim();
    }

    await review.save();

    // Tự động tính toán lại điểm rating của sản phẩm
    await updateProductRating(review.product);

    res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật đánh giá', error: error.message });
  }
};

/**
 * @desc Lấy danh sách đánh giá đã duyệt của một sản phẩm
 * @route GET /api/reviews/product/:productId
 * @access Public
 */
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const reviews = await Review.find({
      product: productId,
      status: 'approved',
    })
      .populate('user', 'name avatar')
      .populate('respondedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    // Thống kê phân bổ sao
    const stats = {
      total: reviews.length,
      average: 5,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => {
        stats.breakdown[r.rating] = (stats.breakdown[r.rating] || 0) + 1;
        return acc + r.rating;
      }, 0);
      stats.average = Math.round((sum / reviews.length) * 10) / 10;
    }

    res.json({
      success: true,
      count: reviews.length,
      stats,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đánh giá', error: error.message });
  }
};

/**
 * @desc Staff/Admin lấy danh sách đánh giá hệ thống (phân trang & lọc trạng thái)
 * @route GET /api/reviews/admin
 * @access Private (Staff / Admin)
 */
const getAdminReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    const filter = req.query.filter || req.query.status;
    if (filter === 'replied') {
      query.response = { $gt: '' };
    } else if (filter === 'unreplied') {
      query.$or = [{ response: '' }, { response: { $exists: false } }];
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name email avatar')
        .populate('product', 'name images price category')
        .populate('respondedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      reviews,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      limit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách đánh giá', error: error.message });
  }
};

/**
 * @desc Staff/Admin duyệt hoặc từ chối đánh giá & phản hồi CSKH
 * @route PUT /api/reviews/:id/status
 * @access Private (Staff / Admin)
 */
const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    if (status) review.status = status;
    if (response !== undefined) {
      review.response = response.trim();
      review.respondedAt = response.trim() ? new Date() : null;
      review.respondedBy = response.trim() ? req.user._id : null;
    }

    await review.save();

    // Đồng bộ lại điểm rating và numReviews của sản phẩm
    await updateProductRating(review.product);

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đánh giá thành công',
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật đánh giá', error: error.message });
  }
};

/**
 * @desc Xóa đánh giá (Staff / Admin)
 * @route DELETE /api/reviews/:id
 * @access Private (Staff / Admin)
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    const productId = review.product;
    await review.deleteOne();

    // Đồng bộ lại điểm rating của sản phẩm
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Xóa đánh giá thành công',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa đánh giá', error: error.message });
  }
};

module.exports = {
  createReview,
  updateMyReview,
  getProductReviews,
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
};

