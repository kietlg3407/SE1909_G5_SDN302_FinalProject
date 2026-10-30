const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAdminView = async (req, res, next) => {
  const commonLoginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : 'http://localhost:5173/login';

  try {
    const token = req.cookies?.admin_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.redirect(commonLoginUrl);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.role !== 'admin') {
      res.clearCookie('admin_token');
      return res.redirect(commonLoginUrl);
    }

    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (error) {
    res.clearCookie('admin_token');
    return res.redirect(commonLoginUrl);
  }
};

module.exports = { requireAdminView };
