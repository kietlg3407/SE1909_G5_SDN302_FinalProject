const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/userModel');

dotenv.config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    const connectionUri = process.env.MONGO_URI;
    if (!connectionUri) {
      console.error('❌ MONGO_URI không được tìm thấy trong file .env');
      process.exit(1);
    }

    console.log('🔄 Đang kết nối đến MongoDB...');
    await mongoose.connect(connectionUri);
    console.log('✅ Kết nối thành công!');

    // Find admin user
    console.log('\n🔍 Đang tìm tài khoản admin...');
    const admin = await User.findOne({ email: 'admin@shop.com' });

    if (!admin) {
      console.log('\n⚠️  Không tìm thấy tài khoản admin với email admin@shop.com');
      console.log('\n📝 Sẽ tạo tài khoản admin mới...');

      const newAdmin = await User.create({
        name: 'Admin User',
        email: 'admin@shop.com',
        password: 'admin123',
        role: 'admin',
        avatar: '',
        addresses: [],
      });

      console.log('\n✅ Tài khoản admin mới đã được tạo thành công!');
      console.log('   Email:', newAdmin.email);
      console.log('   Password: admin123');
      console.log('   Role:', newAdmin.role);
    } else {
      console.log('\n✅ Đã tìm thấy tài khoản admin:');
      console.log('   Email:', admin.email);
      console.log('   Name:', admin.name);
      console.log('   Role:', admin.role);

      // Reset password
      admin.password = 'admin123';
      await admin.save();

      console.log('\n✅ Mật khẩu đã được reset thành công!');
      console.log('   Email:', admin.email);
      console.log('   New Password: admin123');
    }

    console.log('\n⚠️  Vui lòng sử dụng thông tin sau để đăng nhập:');
    console.log('   Email: admin@shop.com');
    console.log('   Password: admin123');
    console.log('\n💡 Đừng quên đổi mật khẩu sau khi đăng nhập!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

resetAdminPassword();
