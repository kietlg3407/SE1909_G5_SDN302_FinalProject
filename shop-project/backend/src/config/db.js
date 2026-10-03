const mongoose = require('mongoose');
const dns = require('dns');

// Fix lỗi querySrv ECONNREFUSED do DNS cục bộ/mạng chặn SRV query của MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.log('Không thể set DNS server tuỳ chỉnh:', e.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Lỗi kết nối MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
