const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Regex kiểm tra định dạng email và số điện thoại Việt Nam chuẩn
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

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
    const { name, email, password } = req.body;

    // BR: Bắt buộc cung cấp đầy đủ thông tin
    if (!name || !email || !password) {
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
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }

    // BR: Tài khoản tự đăng ký luôn mặc định là customer (chống leo thang đặc quyền)
    const user = await User.create({
      name: trimmedName,
      email: cleanEmail,
      password,
      role: 'customer',
      avatar: '',
      addresses: [],
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đăng nhập & nhận JWT Token (BR-AUTH-03)
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =================== 2. USER PROFILE (HỒ SƠ CÁ NHÂN) ===================

// @desc    Lấy thông tin cá nhân hiện tại (BR-PROF-01)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    if (req.body.name) {
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đổi mật khẩu (BR-PROF-03)
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
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

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};

// =================== 3. ADDRESS MANAGEMENT (SỔ ĐỊA CHỈ) ===================

// @desc    Lấy danh sách địa chỉ nhận hàng (BR-ADDR-04)
// @route   GET /api/users/addresses
// @access  Private
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user.addresses || []);
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Thêm địa chỉ giao hàng mới (BR-ADDR-01, BR-ADDR-02)
// @route   POST /api/users/addresses
// @access  Private
const addAddress = async (req, res) => {
  try {
    const { street, city, state, phone, isDefault } = req.body;

    // BR-ADDR-01: Bắt buộc điền đủ thông tin
    if (!street || !city || !state || !phone) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ: Số nhà/đường, Phường/Xã, Quận/Tỉnh, và Số điện thoại' });
    }

    // BR-ADDR-01: Kiểm tra định dạng số điện thoại
    const cleanPhone = phone.trim().replace(/\s/g, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ (yêu cầu 10 số, bắt đầu bằng đầu số VN 03, 05, 07, 08, 09)' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // BR-ADDR-02: Địa chỉ đầu tiên luôn mặc định là default, hoặc người dùng tích chọn default
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      phone: cleanPhone,
      isDefault: shouldBeDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cập nhật địa chỉ (BR-ADDR-01, BR-ADDR-02)
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, phone, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ này' });
    }

    if (phone) {
      const cleanPhone = phone.trim().replace(/\s/g, '');
      if (!PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
      }
      address.phone = cleanPhone;
    }

    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();

    // BR-ADDR-02: Đảm bảo duy nhất 1 địa chỉ mặc định
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = addr._id.toString() === addressId;
      });
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xóa địa chỉ (BR-ADDR-03)
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Đặt địa chỉ làm mặc định (BR-ADDR-02)
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
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
