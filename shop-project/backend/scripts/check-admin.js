const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/userModel');

dotenv.config();

const checkAndCreateAdmin = async () => {
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

    // Check for existing admin
    console.log('\n🔍 Đang kiểm tra tài khoản admin...');
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('\n✅ Đã tìm thấy tài khoản admin:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      console.log('   Created At:', existingAdmin.createdAt);
      console.log('\n💡 Bạn có thể sử dụng tài khoản này để đăng nhập với vai trò admin.');
    } else {
      console.log('\n⚠️  Không tìm thấy tài khoản admin nào trong database.');
      console.log('\n📝 Thông tin tài khoản admin mặc định sẽ được tạo:');
      console.log('   Email: admin@shop.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');

      // Ask for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('\n❓ Bạn có muốn tạo tài khoản admin này không? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          try {
            const admin = await User.create({
              name: 'Admin User',
              email: 'admin@shop.com',
              password: 'admin123',
              role: 'admin',
              avatar: '',
              addresses: [],
            });

            console.log('\n✅ Tài khoản admin đã được tạo thành công!');
            console.log('   Email:', admin.email);
            console.log('   Password: admin123');
            console.log('   Role:', admin.role);
            console.log('\n⚠️  Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu!');
          } catch (error) {
            console.error('\n❌ Lỗi khi tạo admin:', error.message);
          }
        } else {
          console.log('\n❌ Đã hủy tạo tài khoản admin.');
        }

        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      });
    }

    // Exit if admin already exists
    if (existingAdmin) {
      await mongoose.connection.close();
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkAndCreateAdmin();
