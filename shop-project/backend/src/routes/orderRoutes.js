const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus,
  updateOrderShipping,
} = require('../controllers/orderController');
const { protect, isStaffOrAdmin } = require('../middlewares/authMiddleware');

router.use(protect);

// Customer endpoints
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);

// Staff Order Processing & Admin endpoints (must be defined before /:id)
router.get('/', isStaffOrAdmin, getAllOrders);

router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelMyOrder);
router.put('/:id/status', isStaffOrAdmin, updateOrderStatus);
router.put('/:id/shipping', isStaffOrAdmin, updateOrderShipping);

module.exports = router;

