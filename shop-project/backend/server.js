const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Cấu hình Template Engine EJS cho Admin Dashboard
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.get('/', (req, res) => {
  res.send('API Shop Quần Áo đang chạy... Truy cập /admin để vào Admin Dashboard (EJS)');
});

// Admin Dashboard Routes (EJS Engine - Server Side Rendering)
app.use('/admin', require('./src/routes/adminViewRoutes'));

// Routes REST API (cho React Frontend)
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/coupons', require('./src/routes/couponRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/admin/stats', require('./src/routes/statsRoutes'));

const PORT = process.env.PORT || 5000;

const Coupon = require('./src/models/couponModel');

const initDefaultCoupons = async () => {
  try {
    const welcomeCoupon = await Coupon.findOne({ code: 'WELCOME10' });
    if (!welcomeCoupon) {
      await Coupon.create({
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 0,
        usageLimit: null,
      });
      console.log('[System] Khởi tạo mã mặc định WELCOME10 (giảm 10% thành viên mới) thành công');
    }
  } catch (err) {
    console.warn('[System] Khởi tạo mã WELCOME10:', err.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await initDefaultCoupons();

    app.listen(PORT, () => {
      console.log(`Server đang chạy ở chế độ ${process.env.NODE_ENV || 'development'} trên cổng ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exitCode = 1;
  }
};

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
