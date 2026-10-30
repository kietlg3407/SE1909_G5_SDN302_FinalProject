const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/userModel');
const Coupon = require('../src/models/couponModel');

const seedRoles = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop-project';
    console.log('🔄 Đang kết nối tới MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Đảm bảo mã giảm giá WELCOME10 (10%) tồn tại trong DB
    let welcomeCoupon = await Coupon.findOne({ code: 'WELCOME10' });
    if (!welcomeCoupon) {
      welcomeCoupon = await Coupon.create({
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 0,
        usageLimit: null,
      });
      console.log('🎁 Đã tạo mã giảm giá hệ thống WELCOME10 (10%)');
    }

    // 2. Tài khoản ADMIN
    let admin = await User.findOne({ email: 'admin@shop.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Quản Trị Viên Hệ Thống',
        email: 'admin@shop.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        usedCoupons: [],
      });
      console.log('👑 Đã tạo tài khoản Admin: admin@shop.com / admin123');
    } else {
      admin.password = 'admin123';
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      console.log('👑 Đã cập nhật tài khoản Admin: admin@shop.com / admin123');
    }

    // 3. Tài khoản STAFF
    let staff = await User.findOne({ email: 'staff@shop.com' });
    if (!staff) {
      staff = await User.create({
        name: 'Nhân Viên Cửa Hàng',
        email: 'staff@shop.com',
        password: 'staff123',
        role: 'staff',
        isActive: true,
        usedCoupons: [],
      });
      console.log('💼 Đã tạo tài khoản Staff: staff@shop.com / staff123');
    } else {
      staff.password = 'staff123';
      staff.role = 'staff';
      staff.isActive = true;
      await staff.save();
      console.log('💼 Đã cập nhật tài khoản Staff: staff@shop.com / staff123');
    }

    // 4. Tài khoản CUSTOMER
    let customer = await User.findOne({ email: 'customer@shop.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Khách Hàng Mẫu',
        email: 'customer@shop.com',
        password: 'password123',
        role: 'customer',
        isActive: true,
        usedCoupons: [],
      });
      console.log('🛍️ Đã tạo tài khoản Customer: customer@shop.com / password123');
    } else {
      customer.password = 'password123';
      customer.role = 'customer';
      customer.isActive = true;
      await customer.save();
      console.log('🛍️ Đã cập nhật tài khoản Customer: customer@shop.com / password123');
    }

    // 5. Tài khoản CUSTOMER (Bảo - Quick Fill)
    let bao = await User.findOne({ email: 'bao@shop.com' });
    if (!bao) {
      bao = await User.create({
        name: 'Bảo Customer',
        email: 'bao@shop.com',
        password: 'password123',
        role: 'customer',
        isActive: true,
        usedCoupons: [],
      });
      console.log('🛍️ Đã tạo tài khoản Customer (Bảo): bao@shop.com / password123');
    } else {
      bao.password = 'password123';
      bao.role = 'customer';
      bao.isActive = true;
      await bao.save();
    }

    console.log('\n=========================================');
    console.log('✅ KHỞI TẠO TÀI KHOẢN 3 ROLE THÀNH CÔNG!');
    console.log('=========================================');
    const users = await User.find({}, 'name email role isActive');
    console.table(users.map((u) => ({ Name: u.name, Email: u.email, Role: u.role, Active: u.isActive })));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khởi tạo tài khoản:', error);
    process.exit(1);
  }
};

seedRoles();
