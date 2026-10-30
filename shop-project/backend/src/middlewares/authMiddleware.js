const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Chưa đăng nhập, không có token xác thực' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Không tìm thấy người dùng của phiên đăng nhập này' });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Bạn không có quyền truy cập. Chỉ quản trị viên mới được phép.' });
};

const isStaffOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    return next();
  }

  return res.status(403).json({
    message: 'Bạn không có quyền truy cập. Chỉ quản trị viên hoặc nhân viên mới được phép.',
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Bạn không có quyền truy cập. Yêu cầu một trong các vai trò: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  isAdmin,
  admin: isAdmin,
  isStaffOrAdmin,
  authorizeRoles,
};
