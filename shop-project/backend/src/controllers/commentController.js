const mongoose = require('mongoose');
const Comment = require('../models/commentModel');
const Product = require('../models/productModel');

/**
 * @desc Tạo bình luận mới hoặc phản hồi bình luận
 * @route POST /api/comments
 * @access Private (Người dùng đã đăng nhập)
 */
const createComment = async (req, res) => {
  try {
    const { productId, content, parentComment } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung bình luận' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    let parentId = null;
    if (parentComment) {
      // Chỉ nhân viên CSKH hoặc Admin mới có quyền trả lời giải đáp thắc mắc
      if (req.user.role === 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản khách hàng không thể trả lời. Chỉ nhân viên CSKH hoặc Quản trị viên mới có quyền trả lời.',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(parentComment)) {
        return res.status(400).json({ success: false, message: 'ID bình luận cha không hợp lệ' });
      }
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận gốc' });
      }
      // Đảm bảo chỉ lồng tối đa 1 cấp (nếu reply 1 reply thì gắn vào parent gốc)
      parentId = parent.parentComment ? parent.parentComment : parent._id;
    }

    const isStaff = ['admin', 'staff'].includes(req.user.role);

    const newComment = await Comment.create({
      product: productId,
      user: req.user._id,
      content: content.trim(),
      parentComment: parentId,
      isStaffReply: isStaff,
    });

    const populated = await Comment.findById(newComment._id).populate('user', 'name avatar role');

    res.status(201).json({
      success: true,
      message: isStaff ? 'Đã gửi phản hồi CSKH thành công' : 'Đã đăng bình luận thành công',
      comment: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi gửi bình luận', error: error.message });
  }
};

/**
 * @desc Lấy danh sách bình luận theo sản phẩm (phân cấp cha - con)
 * @route GET /api/comments/product/:productId
 * @access Public
 */
const getProductComments = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    // 1. Lấy tất cả bình luận cha
    const topComments = await Comment.find({
      product: productId,
      parentComment: null,
    })
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Lấy các câu trả lời con cho các bình luận cha
    const commentIds = topComments.map((c) => c._id);
    const replies = await Comment.find({
      parentComment: { $in: commentIds },
    })
      .populate('user', 'name avatar role')
      .sort({ createdAt: 1 })
      .lean();

    // 3. Gom câu trả lời vào từng bình luận cha tương ứng
    const repliesByParent = {};
    replies.forEach((r) => {
      const pId = r.parentComment.toString();
      if (!repliesByParent[pId]) repliesByParent[pId] = [];
      repliesByParent[pId].push(r);
    });

    const commentsWithReplies = topComments.map((c) => ({
      ...c,
      replies: repliesByParent[c._id.toString()] || [],
    }));

    const totalCount = topComments.length + replies.length;

    res.json({
      success: true,
      totalCount,
      comments: commentsWithReplies,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách bình luận', error: error.message });
  }
};

/**
 * @desc Chỉnh sửa nội dung bình luận (chỉ tác giả)
 * @route PUT /api/comments/:id
 * @access Private (Người tạo bình luận)
 */
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung bình luận không được để trống' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Kiểm tra quyền sở hữu
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa bình luận này' });
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate('user', 'name avatar role');

    res.json({
      success: true,
      message: 'Cập nhật bình luận thành công',
      comment: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật bình luận', error: error.message });
  }
};

/**
 * @desc Xóa bình luận (Tác giả hoặc Staff/Admin)
 * @route DELETE /api/comments/:id
 * @access Private
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    const isStaffOrAdmin = ['admin', 'staff'].includes(req.user.role);
    const isOwner = comment.user.toString() === req.user._id.toString();

    if (!isStaffOrAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }

    // Xóa comment và toàn bộ reply của nó nếu là comment cha
    await Comment.deleteMany({
      $or: [{ _id: id }, { parentComment: id }],
    });

    res.json({
      success: true,
      message: 'Xóa bình luận thành công',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa bình luận', error: error.message });
  }
};

/**
 * @desc Staff/Admin lấy danh sách tất cả bình luận để CSKH
 * @route GET /api/comments/admin
 * @access Private (Staff / Admin)
 */
const getAdminComments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    // Lấy các bình luận gốc (top level)
    const [topComments, total] = await Promise.all([
      Comment.find({ parentComment: null })
        .populate('user', 'name email avatar role')
        .populate('product', 'name images price category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ parentComment: null }),
    ]);

    // Lấy câu trả lời kèm theo
    const commentIds = topComments.map((c) => c._id);
    const replies = await Comment.find({ parentComment: { $in: commentIds } })
      .populate('user', 'name email avatar role')
      .sort({ createdAt: 1 })
      .lean();

    const repliesByParent = {};
    replies.forEach((r) => {
      const pId = r.parentComment.toString();
      if (!repliesByParent[pId]) repliesByParent[pId] = [];
      repliesByParent[pId].push(r);
    });

    let results = topComments.map((c) => ({
      ...c,
      replies: repliesByParent[c._id.toString()] || [],
    }));

    // Lọc theo trạng thái đã trả lời hay chưa
    const filter = req.query.filter;
    if (filter === 'unreplied') {
      results = results.filter((c) => c.replies.length === 0);
    } else if (filter === 'replied') {
      results = results.filter((c) => c.replies.length > 0);
    }

    res.json({
      success: true,
      comments: results,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      limit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách bình luận', error: error.message });
  }
};

module.exports = {
  createComment,
  getProductComments,
  updateComment,
  deleteComment,
  getAdminComments,
};

