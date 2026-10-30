const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop-project';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const count = await db.collection('products').countDocuments();
  console.log('====================================================');
  console.log('XÁC NHẬN KẾT NỐI DATABASE THẬT:');
  console.log('MongoDB URI    :', uri);
  console.log('Database Name  :', mongoose.connection.name);
  console.log('Collection     : products');
  console.log('TỔNG SỐ SẢN PHẨM HIỆN TẠI TRONG DB:', count);
  console.log('====================================================\n');

  console.log('DANH SÁCH 10 SẢN PHẨM MẪU TRỰC TIẾP TỪ DATABASE:');
  const sample = await db.collection('products').find({}).limit(10).toArray();
  sample.forEach((p, idx) => {
    console.log(`${idx + 1}. [ID: ${p._id}] ${p.name}`);
    console.log(`   - Giá: ${p.price?.toLocaleString('vi-VN')}đ | Gốc: ${p.originalPrice ? p.originalPrice.toLocaleString('vi-VN') + 'đ' : 'Không'} | Kho: ${p.stock}`);
    console.log(`   - Danh mục: ${p.category} | Thương hiệu: ${p.brand} | Trạng thái: ${p.isActive ? '🟢 Hoạt động' : '🔴 Tạm ẩn'}`);
    console.log(`   - Ảnh: ${p.images?.[0] || 'Chưa có'}\n`);
  });

  const categories = await db.collection('products').aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log('THỐNG KÊ PHÂN BỐ THEO DANH MỤC TRONG DB:');
  console.table(
    categories.map((c) => ({
      'Danh Mục': c._id,
      'Số Lượng': c.count,
      'Giá Trung Bình (VND)': Math.round(c.avgPrice).toLocaleString('vi-VN') + 'đ',
    }))
  );

  await mongoose.connection.close();
}

checkDB();
