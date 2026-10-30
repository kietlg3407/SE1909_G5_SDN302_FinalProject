const User = require('../models/userModel');
const Coupon = require('../models/couponModel');
const jwt = require('jsonwebtoken');

const validRoles = ['customer', 'staff', 'admin'];

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// [GET] /admin/logout
const handleLogout = (req, res) => {
  res.clearCookie('admin_token');
  const commonLoginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : 'http://localhost:5173/login';
  return res.redirect(commonLoginUrl);
};

// [GET] /admin/dashboard
const showDashboard = async (req, res) => {
  try {
    const [totalUsers, totalAdmins, totalStaff, totalCustomers, totalCoupons] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ role: 'customer' }),
      Coupon.countDocuments({}),
    ]);

    const recentUsers = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('dashboard', {
      pageTitle: 'Tổng quan hệ thống',
      activeTab: 'dashboard',
      stats: {
        totalUsers,
        totalAdmins,
        totalStaff,
        totalCustomers,
        totalCoupons,
      },
      recentUsers,
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
};

// [GET] /admin/users (Search, Filter, Pagination)
const showUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const query = {};

    // 1. Search by name or email
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    // 2. Filter by role
    if (role && role !== 'all' && validRoles.includes(role)) {
      query.role = role;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNum) || 1;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.render('users', {
      pageTitle: 'Quản lý người dùng',
      activeTab: 'users',
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        limit: limitNum,
      },
      filter: {
        search: search || '',
        role: role || 'all',
      },
      notice: req.query.notice || null,
      error: req.query.error || null,
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
};

// [POST] /admin/users/:id/role
const handleUpdateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!validRoles.includes(role)) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('Vai trò không hợp lệ'));
    }

    if (id === req.user._id.toString()) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('Bạn không thể tự thay đổi vai trò của chính mình'));
    }

    const updateData = { role };
    if (role === 'staff' || role === 'admin') {
      updateData.addresses = [];
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
    if (!updated) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('Không tìm thấy người dùng'));
    }

    return res.redirect('/admin/users?notice=' + encodeURIComponent(`Đã cập nhật vai trò của ${updated.name} thành "${role}"`));
  } catch (error) {
    return res.redirect('/admin/users?error=' + encodeURIComponent(error.message));
  }
};

// [POST] /admin/users/:id/delete
const handleDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('Bạn không thể tự xóa tài khoản của chính mình'));
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.redirect('/admin/users?error=' + encodeURIComponent('Người dùng không tồn tại'));
    }

    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.redirect('/admin/users?error=' + encodeURIComponent('Không thể xóa Quản trị viên (Admin) duy nhất còn lại'));
      }
    }

    await User.findByIdAndDelete(id);
    return res.redirect('/admin/users?notice=' + encodeURIComponent(`Đã xóa tài khoản ${targetUser.name} (${targetUser.email}) thành công`));
  } catch (error) {
    return res.redirect('/admin/users?error=' + encodeURIComponent(error.message));
  }
};

// [GET] /admin/coupons
const showCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.render('coupons', {
      pageTitle: 'Quản lý Mã giảm giá (Coupons)',
      activeTab: 'coupons',
      coupons,
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
};

module.exports = {
  handleLogout,
  showDashboard,
  showUsers,
  handleUpdateUserRole,
  handleDeleteUser,
  showCoupons,
};
