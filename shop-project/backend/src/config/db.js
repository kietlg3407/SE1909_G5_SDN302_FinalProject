const mongoose = require('mongoose');

const connectDB = async () => {
  let connectionUri;

  // 1. Tách biệt hoàn toàn DB Test và DB Thật
  if (process.env.NODE_ENV === 'test') {
    connectionUri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/shop_test';
  } else {
    connectionUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  }

  if (!connectionUri) {
    const error = new Error('Neither MONGO_URI nor MONGODB_URI environment variable is set');
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }

  // 2. Khóa bảo vệ an toàn (Safety Guard): Tuyệt đối không cho phép môi trường TEST kết nối vào DB thật 'shop-project'
  if (process.env.NODE_ENV === 'test' && /[\/:@](shop-project)(\?|$)/.test(connectionUri)) {
    connectionUri = connectionUri.replace(/shop-project/, 'shop_test');
    console.warn('⚠️ [SAFETY GUARD] Phát hiện môi trường TEST trỏ vào shop-project! Đã tự động chuyển sang shop_test.');
  }

  try {
    await mongoose.connect(connectionUri);
    const dbName = mongoose.connection.name;
    console.log(`MongoDB connection successful (${dbName}) [ENV: ${process.env.NODE_ENV || 'development'}]`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
