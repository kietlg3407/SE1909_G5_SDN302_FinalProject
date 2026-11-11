const crypto = require('crypto');
const mongoose = require('mongoose');
const Coupon = require('../models/couponModel');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../utils/mailer');

// Regex kiểm tra định dạng email và số điện thoại Việt Nam chuẩn
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

// Tạo JWT Token có thời hạn 30 ngày
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// =================== 1. AUTHENTICATION (XÁC THỰC) ===================

// @desc    Đăng ký tài khoản mới (BR-AUTH-01, BR-AUTH-02, BR-AUTH-04)
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // BR: Bắt buộc cung cấp đầy đủ thông tin và đúng kiểu chuỗi
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu' });
    }

    // BR: Họ tên từ 2 đến 100 ký tự
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({ message: 'Họ tên phải có độ dài từ 2 đến 100 ký tự' });
    }

    // BR: Định dạng Email chuẩn
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
    }

    // BR: Độ dài mật khẩu tối thiểu 6 ký tự
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // BR: Email là duy nhất trong toàn hệ thống
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(409).json({ message: 'Email này đã được sử dụng' });
    }

    // BR: Tài khoản tự đăng ký luôn mặc định là customer (chống leo thang đặc quyền)
    const user = await User.create({
      name: trimmedName,
      email: cleanEmail,
      password,
      role: 'customer',
      avatar: '',
      addresses: [],
      usedCoupons: [],
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== false,
        avatar: user.avatar,
        addresses: user.addresses,
        token: generateToken(user._id),
        voucher: {
          code: 'WELCOME10',
          discountType: 'percentage',
          discountValue: 10,
          description: 'Voucher 10% dành cho thành viên mới (sử dụng 1 lần duy nhất)',
        },
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Email này đã được sử dụng' });
    }
    console.error('[registerUser Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đăng ký tài khoản' });
  }
};

// @desc    Đăng nhập & nhận JWT Token (BR-AUTH-03)
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await user.matchPassword(password))) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động. Vui lòng liên hệ quản trị viên.',
        });
      }

      const token = generateToken(user._id);

      // Nếu là admin, lưu cookie để có thể truy cập song song Admin Dashboard (EJS)
      if (user.role === 'admin') {
        res.cookie('admin_token', token, {
          ...ADMIN_COOKIE_OPTIONS,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      } else {
        res.clearCookie('admin_token', ADMIN_COOKIE_OPTIONS);
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== false,
        avatar: user.avatar,
        addresses: user.addresses,
        token,
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    console.error('[loginUser Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đăng nhập' });
  }
};

// @desc    Đăng xuất & xóa cookie admin
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.clearCookie('admin_token', ADMIN_COOKIE_OPTIONS);
  res.json({ message: 'Đăng xuất thành công' });
};

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.';

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// @desc    Gửi email đặt lại mật khẩu (không tiết lộ email có tồn tại hay không)
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = hashResetToken(rawToken);
      user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
      const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

      try {
        await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
      } catch (mailError) {
        console.error('[forgotPassword mail Error]:', mailError.message);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        try {
          await user.save();
        } catch (cleanupError) {
          console.error('[forgotPassword cleanup Error]:', cleanupError.message);
        }
      }
    }

    return res.json({ message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    console.error('[forgotPassword Error]:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi xử lý yêu cầu đặt lại mật khẩu' });
  }
};

// @desc    Đặt mật khẩu mới bằng token một lần (hết hạn sau 15 phút)
// @route   POST /api/users/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body || {};

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const user = await User.findOne({
      passwordResetToken: hashResetToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }

    user.password = password;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    console.error('[resetPassword Error]:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đặt lại mật khẩu' });
  }
};

// =================== 2. USER PROFILE (HỒ SƠ CÁ NHÂN) ===================

// @desc    Lấy thông tin cá nhân hiện tại (BR-PROF-01)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('usedCoupons');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    console.error('[getUserProfile Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi lấy thông tin cá nhân' });
  }
};

// @desc    Cập nhật họ tên (BR-PROF-01)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (req.body && req.body.name !== undefined) {
      if (typeof req.body.name !== 'string') {
        return res.status(400).json({ message: 'Họ tên phải có độ dài từ 2 đến 100 ký tự' });
      }
      const trimmedName = req.body.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({ message: 'Họ tên phải có độ dài từ 2 đến 100 ký tự' });
      }
      user.name = trimmedName;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      addresses: updatedUser.addresses,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    console.error('[updateUserProfile Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi cập nhật thông tin cá nhân' });
  }
};

// @desc    Đổi mật khẩu (BR-PROF-03)
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      !currentPassword.trim() ||
      !newPassword.trim()
    ) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    const authHeader = req.headers.authorization;
    const currentToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const currentDecoded = currentToken ? jwt.decode(currentToken) : null;
    if (currentDecoded?.iat) {
      const waitMs = currentDecoded.iat * 1000 + 1005 - Date.now();
      if (waitMs > 0 && waitMs <= 1100) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Đổi mật khẩu thành công',
      token,
    });
  } catch (error) {
    console.error('[changePassword Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đổi mật khẩu' });
  }
};

// @desc    Upload avatar người dùng lên Cloudinary (BR-PROF-02)
// @route   POST /api/users/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn tệp hình ảnh để tải lên' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.avatar = req.file.path;
    await user.save();

    res.json({
      message: 'Cập nhật ảnh đại diện thành công',
      avatarUrl: user.avatar,
    });
  } catch (error) {
    console.error('[uploadAvatar Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi tải lên ảnh đại diện' });
  }
};

// =================== 3. ADDRESS MANAGEMENT (SỔ ĐỊA CHỈ - CHỈ DÀNH CHO CUSTOMER) ===================

// @desc    Lấy danh sách địa chỉ nhận hàng (BR-ADDR-04)
// @route   GET /api/users/addresses
// @access  Private (Customer only)
const getAddresses = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Chức năng sổ địa chỉ nhận hàng chỉ áp dụng cho tài khoản Khách hàng' });
    }

    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user.addresses || []);
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    console.error('[getAddresses Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi lấy danh sách địa chỉ' });
  }
};

// @desc    Thêm địa chỉ giao hàng mới (BR-ADDR-01, BR-ADDR-02)
// @route   POST /api/users/addresses
// @access  Private (Customer only)
const addAddress = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Tài khoản nhân viên hoặc quản trị viên không được sử dụng chức năng địa chỉ nhận hàng' });
    }

    const { street, city, state, phone, isDefault } = req.body || {};

    if (
      typeof street !== 'string' ||
      typeof city !== 'string' ||
      typeof state !== 'string' ||
      typeof phone !== 'string'
    ) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ: Số nhà/đường, Phường/Xã, Quận/Tỉnh, và Số điện thoại' });
    }

    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const cleanPhone = phone.trim().replace(/\s/g, '');

    // BR-ADDR-01: Bắt buộc điền đủ thông tin (sau khi đã trim)
    if (!trimmedStreet || !trimmedCity || !trimmedState || !cleanPhone) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ: Số nhà/đường, Phường/Xã, Quận/Tỉnh, và Số điện thoại' });
    }

    // BR-ADDR-01: Kiểm tra định dạng số điện thoại
    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ (yêu cầu 10 số, bắt đầu bằng đầu số VN 03, 05, 07, 08, 09)' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // BR-ADDR-02: Địa chỉ đầu tiên luôn mặc định là default, hoặc người dùng tích chọn default
    const shouldBeDefault = isDefault === true || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      street: trimmedStreet,
      city: trimmedCity,
      state: trimmedState,
      phone: cleanPhone,
      isDefault: shouldBeDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    console.error('[addAddress Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi thêm địa chỉ' });
  }
};

// @desc    Cập nhật địa chỉ (BR-ADDR-01, BR-ADDR-02)
// @route   PUT /api/users/addresses/:addressId
// @access  Private (Customer only)
const updateAddress = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Chức năng sổ địa chỉ nhận hàng chỉ áp dụng cho tài khoản Khách hàng' });
    }

    const { addressId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'ID địa chỉ không hợp lệ' });
    }

    const { street, city, state, phone, isDefault } = req.body || {};

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ này' });
    }

    if (street !== undefined) {
      if (typeof street !== 'string' || !street.trim()) {
        return res.status(400).json({ message: 'Số nhà/đường không được để trống' });
      }
      address.street = street.trim();
    }

    if (city !== undefined) {
      if (typeof city !== 'string' || !city.trim()) {
        return res.status(400).json({ message: 'Phường/Xã không được để trống' });
      }
      address.city = city.trim();
    }

    if (state !== undefined) {
      if (typeof state !== 'string' || !state.trim()) {
        return res.status(400).json({ message: 'Quận/Tỉnh không được để trống' });
      }
      address.state = state.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      const cleanPhone = phone.trim().replace(/\s/g, '');
      if (!cleanPhone || !PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      address.phone = cleanPhone;
    }

    // BR-ADDR-02: Đảm bảo duy nhất 1 địa chỉ mặc định
    if (isDefault === true) {
      user.addresses.forEach((addr) => {
        addr.isDefault = addr._id.toString() === addressId;
      });
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error('[updateAddress Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi cập nhật địa chỉ' });
  }
};

// @desc    Xóa địa chỉ (BR-ADDR-03)
// @route   DELETE /api/users/addresses/:addressId
// @access  Private (Customer only)
const deleteAddress = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Chức năng sổ địa chỉ nhận hàng chỉ áp dụng cho tài khoản Khách hàng' });
    }

    const { addressId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'ID địa chỉ không hợp lệ' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ để xóa' });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // BR-ADDR-03: Nếu xóa địa chỉ mặc định mà còn địa chỉ khác, tự động gán địa chỉ đầu tiên làm mặc định mới
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error('[deleteAddress Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi xóa địa chỉ' });
  }
};

// @desc    Đặt địa chỉ làm mặc định (BR-ADDR-02)
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private (Customer only)
const setDefaultAddress = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Chức năng sổ địa chỉ nhận hàng chỉ áp dụng cho tài khoản Khách hàng' });
    }

    const { addressId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: 'ID địa chỉ không hợp lệ' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const targetAddress = user.addresses.id(addressId);
    if (!targetAddress) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error('[setDefaultAddress Error]:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi đặt địa chỉ mặc định' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
