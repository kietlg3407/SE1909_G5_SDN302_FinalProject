const express = require('express');
const router = express.Router();
const {
  showLoginPage,
  handleLogin,
  handleLogout,
  showDashboard,
  showUsers,
  handleUpdateUserRole,
  handleDeleteUser,
  showCoupons,
} = require('../controllers/adminViewController');
const { requireAdminView } = require('../middlewares/adminViewMiddleware');

// Admin Logout Route
router.get('/logout', handleLogout);

// Protected Admin Dashboard Routes (yêu cầu quyền Admin từ phiên đăng nhập chung)
router.use(requireAdminView);

router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', showDashboard);
router.get('/users', showUsers);
router.post('/users/:id/role', handleUpdateUserRole);
router.post('/users/:id/delete', handleDeleteUser);
router.get('/coupons', showCoupons);

module.exports = router;
