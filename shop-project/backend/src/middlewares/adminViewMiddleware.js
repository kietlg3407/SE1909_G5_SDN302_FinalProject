const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const requireAdminView = async (req, res, next) => {
  const commonLoginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : 'http://localhost:5173/login';

  try {
    const token = req.cookies?.admin_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.redirect(commonLoginUrl);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.role !== 'admin' || user.isActive === false) {
      res.clearCookie('admin_token', ADMIN_COOKIE_OPTIONS);
      return res.redirect(commonLoginUrl);
    }

    if (
      user.passwordChangedAt &&
      decoded.iat * 1000 < new Date(user.passwordChangedAt).getTime()
    ) {
      res.clearCookie('admin_token', ADMIN_COOKIE_OPTIONS);
      if (req.headers.authorization?.startsWith('Bearer ') && !req.cookies?.admin_token) {
        return res.status(401).json({ message: 'Mật khẩu đã thay đổi, vui lòng đăng nhập lại' });
      }
      return res.redirect(commonLoginUrl);
    }

    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (error) {
    res.clearCookie('admin_token', ADMIN_COOKIE_OPTIONS);
    return res.redirect(commonLoginUrl);
  }
};

module.exports = { requireAdminView };
