const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('API Shop Quần Áo đang chạy...');
});

// Routes API
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/coupons', require('./src/routes/couponRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/admin/stats', require('./src/routes/statsRoutes'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server đang chạy ở chế độ ${process.env.NODE_ENV || 'development'} trên cổng ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exitCode = 1;
  }
};

startServer();
