const fs = require('fs');
const path = require('path');

const introduction = fs.readFileSync(path.join(__dirname, 'introduction.vi.md'), 'utf8').trim();

const str = (description, extra) => ({ type: 'string', description, ...extra });
const num = (description, extra) => ({ type: 'number', description, ...extra });
const bool = (description) => ({ type: 'boolean', description });

const q = (name, description, schema = { type: 'string' }) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema,
});

const jsonBody = (properties, required = [], description) => ({
  required: true,
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required,
        properties,
      },
    },
  },
});

const message = { $ref: '#/components/schemas/MessageResponse' };
const authUser = { $ref: '#/components/schemas/AuthResponse' };

const json = (description, schema = message) => ({
  description,
  content: { 'application/json': { schema } },
});

const text = (description, mime) => ({
  description,
  content: { [mime]: { schema: { type: 'string' } } },
});

const authText = {
  public: 'Không yêu cầu đăng nhập.',
  user: 'Yêu cầu Bearer JWT.',
  staff: 'Yêu cầu Bearer JWT của staff hoặc admin.',
  admin: 'Yêu cầu Bearer JWT của admin.',
  customer: 'Yêu cầu Bearer JWT của customer.',
  optional: 'Bearer JWT là tùy chọn. Staff hoặc admin đăng nhập có thể xem thêm sản phẩm ngừng bán.',
  cookie: 'Yêu cầu cookie httpOnly admin_token của tài khoản admin. Thiếu quyền thì chuyển hướng về trang đăng nhập.',
};

const baseErrors = (auth) => {
  const responses = {};
  if (auth === 'cookie') {
    responses['302'] = { description: 'Chuyển về trang đăng nhập khi thiếu cookie, token hết hạn hoặc không phải admin' };
    return responses;
  }
  if (auth !== 'public') {
    responses['401'] = json('Thiếu token, token hết hạn hoặc mật khẩu đã đổi');
  }
  if (auth === 'staff' || auth === 'admin' || auth === 'customer') {
    responses['403'] = json('Không đủ quyền');
  }
  responses['500'] = json('Lỗi hệ thống');
  return responses;
};

const endpoint = (method, routePath, tag, summary, auth, extra = {}) => ({
  method,
  path: routePath,
  tag,
  summary,
  auth,
  ...extra,
});

const idParam = (description = 'MongoDB ObjectId') => str(description);

const productQuery = [
  q('page', 'Trang, mặc định 1', { type: 'integer' }),
  q('limit', 'Số bản ghi, mặc định 12, tối đa 100', { type: 'integer' }),
  q('search', 'Từ khóa tìm theo tên'),
  q('category', 'Tên danh mục'),
  q('brand', 'Tên thương hiệu'),
  q('minPrice', 'Giá tối thiểu', { type: 'number' }),
  q('maxPrice', 'Giá tối đa', { type: 'number' }),
  q('inStock', 'true để chỉ lấy sản phẩm còn hàng'),
  q('sortBy', 'price-asc, price-desc, rating, name-asc, name-desc, newest, oldest. Cũng nhận sort.'),
  q('status', 'all hoặc active khi người gọi là staff/admin'),
  q('isActive', 'Lọc theo trạng thái bán'),
];

const productBody = {
  name: str('Tên sản phẩm, tối đa 150 ký tự'),
  description: str('Mô tả'),
  price: num('Giá bán, không âm'),
  originalPrice: num('Giá gốc'),
  category: str('Tên danh mục'),
  brand: str('Tên thương hiệu, mặc định CLOSET'),
  stock: num('Tồn kho'),
  images: { type: 'array', items: { type: 'string' }, description: 'URL ảnh' },
  isActive: bool('Đang bán'),
};

const variantBody = {
  sku: str('Mã SKU'),
  size: str('Kích cỡ'),
  color: str('Màu'),
  price: num('Giá biến thể, có thể null'),
  stock: num('Tồn kho biến thể'),
  isActive: bool('Đang bán'),
};

const addressBody = {
  street: str('Số nhà, đường'),
  city: str('Phường, xã'),
  state: str('Quận, tỉnh'),
  phone: str('Số điện thoại Việt Nam'),
  isDefault: bool('Đặt làm địa chỉ mặc định'),
};

const shippingAddress = {
  type: 'object',
  required: ['street', 'city', 'phone'],
  properties: {
    street: str('Số nhà, đường'),
    city: str('Phường, xã'),
    state: str('Quận, tỉnh'),
    phone: str('Số điện thoại'),
  },
};

const orderItem = {
  type: 'object',
  required: ['product', 'quantity'],
  properties: {
    product: str('ID sản phẩm'),
    quantity: num('Số lượng'),
    variant: str('ID biến thể, nếu sản phẩm có phân loại'),
  },
};

const classificationBody = (withLogo) => ({
  name: str('Tên'),
  description: str('Mô tả'),
  ...(withLogo ? { logo: str('URL logo') } : {}),
  isActive: bool('Đang hoạt động'),
});

const reviewBody = {
  productId: str('ID sản phẩm'),
  rating: num('Số sao từ 1 đến 5'),
  comment: str('Nội dung đánh giá'),
};

const commentBody = {
  productId: str('ID sản phẩm'),
  content: str('Nội dung bình luận'),
  parentComment: str('ID bình luận cha khi nhân viên hoặc admin trả lời'),
};

const couponBody = {
  code: str('Mã, 3-50 ký tự, chữ hoa, số, gạch ngang hoặc gạch dưới'),
  discountType: str('percentage hoặc fixed', { enum: ['percentage', 'fixed'] }),
  discountValue: num('Giá trị giảm. Phần trăm không quá 100'),
  minOrderValue: num('Giá trị đơn tối thiểu'),
  expiryDate: str('Ngày hết hạn ISO, phải ở tương lai nếu có', { format: 'date-time' }),
  usageLimit: num('Giới hạn lượt dùng'),
};

const endpoints = [
  endpoint('get', '/', 'Hệ thống', 'Kiểm tra API đang chạy', 'public', {
    responses: { 200: text('Chuỗi thông báo API đang chạy', 'text/plain') },
  }),

  endpoint('post', '/admin/logout', 'Giao diện Admin', 'Đăng xuất dashboard EJS và xóa cookie admin_token', 'public', {
    responses: { 200: text('Chuyển hướng hoặc trang xác nhận đăng xuất', 'text/html'), 302: { description: 'Chuyển hướng sau khi đăng xuất' } },
  }),
  endpoint('get', '/admin', 'Giao diện Admin', 'Chuyển tới dashboard', 'cookie', {
    responses: { 302: { description: 'Redirect /admin/dashboard hoặc trang đăng nhập' } },
  }),
  endpoint('get', '/admin/dashboard', 'Giao diện Admin', 'Trang tổng quan EJS', 'cookie', {
    responses: { 200: text('HTML dashboard', 'text/html') },
  }),
  endpoint('get', '/admin/users', 'Giao diện Admin', 'Trang quản lý người dùng EJS', 'cookie', {
    responses: { 200: text('HTML danh sách người dùng', 'text/html') },
  }),
  endpoint('post', '/admin/users/{id}/role', 'Giao diện Admin', 'Đổi vai trò người dùng từ form EJS', 'cookie', {
    body: jsonBody({ role: str('customer, staff hoặc admin', { enum: ['customer', 'staff', 'admin'] }) }, ['role']),
    responses: { 302: { description: 'Quay lại danh sách người dùng' } },
  }),
  endpoint('post', '/admin/users/{id}/delete', 'Giao diện Admin', 'Xóa người dùng từ form EJS', 'cookie', {
    responses: { 302: { description: 'Quay lại danh sách người dùng' } },
  }),
  endpoint('get', '/admin/coupons', 'Giao diện Admin', 'Trang mã giảm giá EJS', 'cookie', {
    responses: { 200: text('HTML mã giảm giá', 'text/html') },
  }),

  endpoint('post', '/api/users/register', 'Xác thực', 'Đăng ký tài khoản customer', 'public', {
    body: jsonBody({
      name: str('Họ tên, 2 đến 100 ký tự'),
      email: str('Email'),
      password: str('Mật khẩu, tối thiểu 6 ký tự'),
    }, ['name', 'email', 'password']),
    responses: {
      201: json('Tạo tài khoản và trả JWT', authUser),
      400: json('Thiếu trường hoặc dữ liệu không hợp lệ'),
      409: json('Email đã được dùng'),
    },
  }),
  endpoint('post', '/api/users/login', 'Xác thực', 'Đăng nhập và nhận JWT', 'public', {
    body: jsonBody({ email: str('Email'), password: str('Mật khẩu') }, ['email', 'password']),
    responses: {
      200: json('Đăng nhập thành công. Admin còn nhận cookie admin_token', authUser),
      400: json('Thiếu email hoặc mật khẩu'),
      401: json('Email hoặc mật khẩu không đúng'),
      403: json('Tài khoản bị khóa'),
    },
  }),
  endpoint('post', '/api/users/logout', 'Xác thực', 'Đăng xuất và xóa cookie admin_token', 'public', {
    responses: { 200: json('Đăng xuất thành công') },
  }),
  endpoint('post', '/api/users/forgot-password', 'Xác thực', 'Gửi email đặt lại mật khẩu', 'public', {
    body: jsonBody({ email: str('Email tài khoản') }, ['email']),
    responses: {
      200: json('Luôn cùng một thông báo, không tiết lộ email có tồn tại hay không'),
      400: json('Email không hợp lệ'),
    },
  }),
  endpoint('post', '/api/users/reset-password/{token}', 'Xác thực', 'Đặt mật khẩu mới bằng token một lần', 'public', {
    body: jsonBody({ password: str('Mật khẩu mới, tối thiểu 6 ký tự') }, ['password']),
    responses: {
      200: json('Đổi mật khẩu thành công và hủy token'),
      400: json('Token không hợp lệ, hết hạn, đã dùng, hoặc mật khẩu quá ngắn'),
    },
  }),

  endpoint('get', '/api/users/profile', 'Hồ sơ', 'Lấy hồ sơ người dùng hiện tại', 'user', {
    responses: { 200: json('Hồ sơ, không gồm mật khẩu và token đặt lại mật khẩu', { $ref: '#/components/schemas/UserProfile' }) },
  }),
  endpoint('put', '/api/users/profile', 'Hồ sơ', 'Cập nhật họ tên', 'user', {
    body: jsonBody({ name: str('Họ tên mới, 2 đến 100 ký tự') }, ['name']),
    responses: { 200: json('Hồ sơ đã cập nhật và JWT mới', authUser), 400: json('Họ tên không hợp lệ') },
  }),
  endpoint('put', '/api/users/change-password', 'Hồ sơ', 'Đổi mật khẩu khi đang đăng nhập', 'user', {
    body: jsonBody({
      currentPassword: str('Mật khẩu hiện tại'),
      newPassword: str('Mật khẩu mới, tối thiểu 6 ký tự, khác mật khẩu cũ'),
    }, ['currentPassword', 'newPassword']),
    responses: { 200: json('Đổi mật khẩu thành công, trả JWT mới'), 400: json('Mật khẩu không hợp lệ') },
  }),
  endpoint('post', '/api/users/upload-avatar', 'Hồ sơ', 'Tải ảnh đại diện lên Cloudinary', 'user', {
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['avatar'],
            properties: { avatar: { type: 'string', format: 'binary', description: 'JPEG, PNG hoặc WEBP, tối đa 2MB' } },
          },
        },
      },
    },
    responses: { 200: json('URL avatar mới'), 400: json('Tệp không hợp lệ'), 413: json('Vượt quá 2MB') },
  }),

  endpoint('get', '/api/users/addresses', 'Địa chỉ', 'Danh sách địa chỉ nhận hàng', 'customer', {
    responses: { 200: json('Mảng địa chỉ') },
  }),
  endpoint('post', '/api/users/addresses', 'Địa chỉ', 'Thêm địa chỉ nhận hàng', 'customer', {
    body: jsonBody(addressBody, ['street', 'city', 'state', 'phone']),
    responses: { 201: json('Danh sách địa chỉ sau khi thêm'), 400: json('Thiếu trường hoặc số điện thoại không hợp lệ') },
  }),
  endpoint('put', '/api/users/addresses/{addressId}', 'Địa chỉ', 'Cập nhật một địa chỉ', 'customer', {
    body: jsonBody(addressBody),
    responses: { 200: json('Danh sách địa chỉ sau khi sửa'), 400: json('Dữ liệu không hợp lệ'), 404: json('Không tìm thấy địa chỉ') },
  }),
  endpoint('delete', '/api/users/addresses/{addressId}', 'Địa chỉ', 'Xóa một địa chỉ', 'customer', {
    responses: { 200: json('Danh sách địa chỉ còn lại'), 404: json('Không tìm thấy địa chỉ') },
  }),
  endpoint('put', '/api/users/addresses/{addressId}/default', 'Địa chỉ', 'Đặt địa chỉ mặc định', 'customer', {
    responses: { 200: json('Danh sách địa chỉ'), 404: json('Không tìm thấy địa chỉ') },
  }),

  endpoint('post', '/api/favorites/toggle', 'Yêu thích', 'Bật hoặc tắt sản phẩm yêu thích', 'user', {
    body: jsonBody({ productId: str('ID sản phẩm') }, ['productId']),
    responses: { 200: json('Trạng thái yêu thích mới') },
  }),
  endpoint('get', '/api/favorites', 'Yêu thích', 'Danh sách sản phẩm yêu thích', 'user', {
    responses: { 200: json('Danh sách yêu thích') },
  }),
  endpoint('get', '/api/favorites/ids', 'Yêu thích', 'Các ID sản phẩm đang yêu thích', 'user', {
    responses: { 200: json('Mảng ID') },
  }),
  endpoint('delete', '/api/favorites/{productId}', 'Yêu thích', 'Bỏ một sản phẩm khỏi yêu thích', 'user', {
    responses: { 200: json('Đã xóa') },
  }),

  endpoint('get', '/api/my-reviews', 'Đánh giá', 'Lấy danh sách đánh giá của tôi (router reviews mount tại /api)', 'user', {
    responses: { 200: json('Danh sách đã đánh giá và chưa đánh giá') },
  }),
  endpoint('get', '/api/product/{productId}', 'Đánh giá', 'Lấy đánh giá của sản phẩm (router reviews mount tại /api)', 'public', {
    query: [q('page', 'Trang', { type: 'integer' }), q('limit', 'Kích thước trang', { type: 'integer' }), q('rating', 'Lọc theo số sao', { type: 'integer' })],
    responses: { 200: json('Danh sách đánh giá') },
  }),
  endpoint('get', '/api/product/{productId}/eligibility', 'Đánh giá', 'Kiểm tra quyền đánh giá (router reviews mount tại /api)', 'user', {
    responses: { 200: json('Được phép hoặc lý do không được đánh giá') },
  }),
  endpoint('post', '/api', 'Đánh giá', 'Tạo đánh giá (router reviews mount tại /api)', 'customer', {
    body: jsonBody(reviewBody, ['productId', 'rating', 'comment']),
    responses: { 201: json('Đánh giá đã tạo'), 400: json('Dữ liệu hoặc điều kiện mua hàng không hợp lệ'), 404: json('Không tìm thấy sản phẩm') },
  }),
  endpoint('put', '/api/{id}', 'Đánh giá', 'Sửa đánh giá của chính mình (router reviews mount tại /api)', 'user', {
    body: jsonBody({ rating: num('Số sao 1 đến 5'), comment: str('Nội dung') }),
    responses: { 200: json('Đánh giá đã sửa'), 400: json('Dữ liệu không hợp lệ'), 403: json('Không phải đánh giá của bạn'), 404: json('Không tìm thấy') },
  }),
  endpoint('get', '/api/admin', 'Đánh giá', 'Danh sách đánh giá cho staff (router reviews mount tại /api)', 'staff', {
    query: [q('page', 'Trang', { type: 'integer' }), q('limit', 'Kích thước trang', { type: 'integer' }), q('filter', 'approved hoặc hidden'), q('rating', 'Lọc số sao', { type: 'integer' })],
    responses: { 200: json('Danh sách đánh giá') },
  }),
  endpoint('put', '/api/{id}/status', 'Đánh giá', 'Ẩn hoặc hiện đánh giá (router reviews mount tại /api)', 'staff', {
    body: jsonBody({ status: str('approved hoặc hidden', { enum: ['approved', 'hidden'] }) }, ['status']),
    responses: { 200: json('Đã cập nhật trạng thái'), 400: json('Trạng thái không hợp lệ') },
  }),
  endpoint('delete', '/api/{id}', 'Đánh giá', 'Xóa đánh giá (router reviews mount tại /api)', 'staff', {
    responses: { 200: json('Đã xóa'), 404: json('Không tìm thấy') },
  }),

  endpoint('get', '/api/coupons', 'Mã giảm giá', 'Danh sách mã giảm giá', 'public', {
    query: [
      q('page', 'Trang', { type: 'integer' }),
      q('limit', 'Kích thước trang', { type: 'integer' }),
      q('sortBy', 'field:asc hoặc field:desc'),
      q('status', 'active, expired hoặc limit_reached'),
      q('discountType', 'percentage hoặc fixed'),
    ],
    responses: { 200: json('Danh sách coupon'), 400: json('Tham số lọc không hợp lệ') },
  }),
  endpoint('post', '/api/coupons/apply', 'Mã giảm giá', 'Kiểm tra mã giảm giá cho đơn hàng', 'user', {
    body: jsonBody({ code: str('Mã coupon'), orderAmount: num('Giá trị đơn, mặc định 0') }, ['code']),
    responses: { 200: json('Mã hợp lệ và số tiền giảm'), 400: json('Mã không dùng được') },
  }),
  endpoint('post', '/api/coupons/consume', 'Mã giảm giá', 'Ghi nhận khách đã dùng mã', 'user', {
    body: jsonBody({ code: str('Mã coupon') }, ['code']),
    responses: { 200: json('Đã ghi nhận'), 400: json('Mã không dùng được') },
  }),
  endpoint('post', '/api/coupons', 'Mã giảm giá', 'Tạo mã giảm giá', 'staff', {
    body: jsonBody(couponBody, ['code', 'discountType', 'discountValue']),
    responses: { 201: json('Coupon đã tạo'), 400: json('Dữ liệu không hợp lệ'), 409: json('Mã đã tồn tại') },
  }),
  endpoint('put', '/api/coupons/{id}', 'Mã giảm giá', 'Cập nhật mã giảm giá', 'staff', {
    body: jsonBody(couponBody),
    responses: { 200: json('Coupon đã cập nhật'), 400: json('Dữ liệu không hợp lệ'), 404: json('Không tìm thấy') },
  }),
  endpoint('delete', '/api/coupons/{id}', 'Mã giảm giá', 'Xóa mã giảm giá', 'staff', {
    responses: { 200: json('Đã xóa'), 400: json('Không được xóa WELCOME10'), 404: json('Không tìm thấy') },
  }),

  endpoint('get', '/api/products', 'Sản phẩm', 'Danh sách sản phẩm, có tìm kiếm, lọc, sắp xếp và phân trang', 'optional', {
    query: productQuery,
    responses: { 200: json('Danh sách và thông tin phân trang') },
  }),
  endpoint('get', '/api/products/{id}', 'Sản phẩm', 'Chi tiết một sản phẩm', 'public', {
    responses: { 200: json('Sản phẩm'), 404: json('Không tìm thấy') },
  }),
  endpoint('post', '/api/products/{id}/variants', 'Sản phẩm', 'Thêm biến thể', 'staff', {
    body: jsonBody(variantBody, ['stock']),
    responses: { 201: json('Sản phẩm kèm biến thể mới'), 400: json('Biến thể không hợp lệ'), 404: json('Không tìm thấy sản phẩm') },
  }),
  endpoint('put', '/api/products/{id}/variants/{variantId}', 'Sản phẩm', 'Sửa biến thể', 'staff', {
    body: jsonBody(variantBody),
    responses: { 200: json('Sản phẩm đã cập nhật'), 400: json('Biến thể không hợp lệ'), 404: json('Không tìm thấy') },
  }),
  endpoint('delete', '/api/products/{id}/variants/{variantId}', 'Sản phẩm', 'Xóa biến thể', 'staff', {
    responses: { 200: json('Đã xóa biến thể'), 404: json('Không tìm thấy') },
  }),
  endpoint('post', '/api/products', 'Sản phẩm', 'Tạo sản phẩm', 'staff', {
    body: jsonBody(productBody, ['name', 'description', 'price', 'category', 'stock']),
    responses: { 201: json('Sản phẩm đã tạo'), 400: json('Thiếu trường bắt buộc') },
  }),
  endpoint('put', '/api/products/{id}', 'Sản phẩm', 'Cập nhật sản phẩm hoặc bật tắt trạng thái bán', 'staff', {
    body: jsonBody(productBody),
    responses: { 200: json('Sản phẩm đã cập nhật'), 400: json('Dữ liệu không hợp lệ'), 404: json('Không tìm thấy') },
  }),
  endpoint('delete', '/api/products/{id}', 'Sản phẩm', 'Xóa sản phẩm', 'staff', {
    responses: { 200: json('Đã xóa'), 404: json('Không tìm thấy') },
  }),

  endpoint('get', '/api/categories', 'Danh mục', 'Danh mục đang hoạt động', 'public', {
    responses: { 200: json('records') },
  }),
  endpoint('get', '/api/categories/manage', 'Danh mục', 'Mọi danh mục, kể cả đang tắt', 'staff', {
    responses: { 200: json('records') },
  }),
  endpoint('post', '/api/categories', 'Danh mục', 'Tạo danh mục', 'staff', {
    body: jsonBody(classificationBody(false), ['name']),
    responses: { 201: json('Danh mục đã tạo'), 400: json('Tên không hợp lệ'), 409: json('Tên đã tồn tại') },
  }),
  endpoint('put', '/api/categories/{id}', 'Danh mục', 'Sửa danh mục', 'staff', {
    body: jsonBody(classificationBody(false)),
    responses: { 200: json('Đã cập nhật'), 404: json('Không tìm thấy'), 409: json('Đang được sản phẩm dùng nên không đổi tên') },
  }),
  endpoint('delete', '/api/categories/{id}', 'Danh mục', 'Xóa danh mục', 'staff', {
    responses: { 200: json('Đã xóa'), 404: json('Không tìm thấy'), 409: json('Đang được sản phẩm dùng') },
  }),

  endpoint('get', '/api/brands', 'Thương hiệu', 'Thương hiệu đang hoạt động', 'public', {
    responses: { 200: json('records') },
  }),
  endpoint('get', '/api/brands/manage', 'Thương hiệu', 'Mọi thương hiệu, kể cả đang tắt', 'staff', {
    responses: { 200: json('records') },
  }),
  endpoint('post', '/api/brands', 'Thương hiệu', 'Tạo thương hiệu', 'staff', {
    body: jsonBody(classificationBody(true), ['name']),
    responses: { 201: json('Thương hiệu đã tạo'), 400: json('Tên không hợp lệ'), 409: json('Tên đã tồn tại') },
  }),
  endpoint('put', '/api/brands/{id}', 'Thương hiệu', 'Sửa thương hiệu', 'staff', {
    body: jsonBody(classificationBody(true)),
    responses: { 200: json('Đã cập nhật'), 404: json('Không tìm thấy'), 409: json('Đang được sản phẩm dùng nên không đổi tên') },
  }),
  endpoint('delete', '/api/brands/{id}', 'Thương hiệu', 'Xóa thương hiệu', 'staff', {
    responses: { 200: json('Đã xóa'), 404: json('Không tìm thấy'), 409: json('Đang được sản phẩm dùng') },
  }),

  endpoint('get', '/api/reviews/my-reviews', 'Đánh giá', 'Lấy danh sách đánh giá của tôi', 'user', {
    responses: { 200: json('Danh sách đã đánh giá và chưa đánh giá') },
  }),
  endpoint('get', '/api/reviews/product/{productId}', 'Đánh giá', 'Lấy đánh giá của một sản phẩm', 'public', {
    query: [q('page', 'Trang', { type: 'integer' }), q('limit', 'Kích thước trang', { type: 'integer' }), q('rating', 'Lọc theo số sao', { type: 'integer' })],
    responses: { 200: json('Danh sách đánh giá') },
  }),
  endpoint('get', '/api/reviews/product/{productId}/eligibility', 'Đánh giá', 'Kiểm tra khách có được đánh giá sản phẩm không', 'user', {
    responses: { 200: json('Kết quả điều kiện đánh giá') },
  }),
  endpoint('post', '/api/reviews', 'Đánh giá', 'Tạo đánh giá', 'customer', {
    body: jsonBody(reviewBody, ['productId', 'rating', 'comment']),
    responses: { 201: json('Đánh giá đã tạo'), 400: json('Chưa mua, đã đánh giá, hoặc dữ liệu không hợp lệ'), 404: json('Không tìm thấy sản phẩm') },
  }),
  endpoint('put', '/api/reviews/{id}', 'Đánh giá', 'Sửa đánh giá của chính mình', 'user', {
    body: jsonBody({ rating: num('Số sao 1 đến 5'), comment: str('Nội dung') }),
    responses: { 200: json('Đã cập nhật'), 403: json('Không phải đánh giá của bạn'), 404: json('Không tìm thấy') },
  }),
  endpoint('get', '/api/reviews/admin', 'Đánh giá', 'Danh sách đánh giá cho nhân viên', 'staff', {
    query: [q('page', 'Trang', { type: 'integer' }), q('limit', 'Kích thước trang', { type: 'integer' }), q('filter', 'approved hoặc hidden'), q('status', 'Cùng ý nghĩa với filter'), q('rating', 'Lọc số sao', { type: 'integer' })],
    responses: { 200: json('Danh sách đánh giá') },
  }),
  endpoint('put', '/api/reviews/{id}/status', 'Đánh giá', 'Duyệt hoặc ẩn đánh giá', 'staff', {
    body: jsonBody({ status: str('approved hoặc hidden', { enum: ['approved', 'hidden'] }) }, ['status']),
    responses: { 200: json('Đã cập nhật trạng thái'), 400: json('Trạng thái không hợp lệ') },
  }),
  endpoint('delete', '/api/reviews/{id}', 'Đánh giá', 'Xóa đánh giá', 'staff', {
    responses: { 200: json('Đã xóa'), 404: json('Không tìm thấy') },
  }),

  endpoint('get', '/api/comments/product/{productId}', 'Bình luận', 'Bình luận của một sản phẩm', 'public', {
    responses: { 200: json('Danh sách bình luận') },
  }),
  endpoint('post', '/api/comments', 'Bình luận', 'Tạo bình luận hoặc trả lời', 'user', {
    body: jsonBody(commentBody, ['productId', 'content']),
    responses: { 201: json('Bình luận đã tạo'), 400: json('Thiếu nội dung'), 403: json('Khách không được trả lời bình luận'), 404: json('Không tìm thấy sản phẩm hoặc bình luận cha') },
  }),
  endpoint('put', '/api/comments/{id}', 'Bình luận', 'Sửa bình luận của chính mình', 'user', {
    body: jsonBody({ content: str('Nội dung mới') }, ['content']),
    responses: { 200: json('Đã cập nhật'), 403: json('Không phải bình luận của bạn'), 404: json('Không tìm thấy') },
  }),
  endpoint('delete', '/api/comments/{id}', 'Bình luận', 'Xóa bình luận của mình, hoặc staff xóa bất kỳ bình luận', 'user', {
    responses: { 200: json('Đã xóa'), 403: json('Không được xóa'), 404: json('Không tìm thấy') },
  }),
  endpoint('get', '/api/comments/admin', 'Bình luận', 'Danh sách bình luận cho nhân viên', 'staff', {
    query: [q('page', 'Trang', { type: 'integer' }), q('limit', 'Kích thước trang', { type: 'integer' }), q('filter', 'Bộ lọc danh sách quản trị')],
    responses: { 200: json('Danh sách bình luận') },
  }),

  endpoint('get', '/api/cart', 'Giỏ hàng', 'Lấy giỏ hàng hiện tại', 'user', {
    responses: { 200: json('Giỏ hàng') },
  }),
  endpoint('post', '/api/cart', 'Giỏ hàng', 'Thêm sản phẩm vào giỏ', 'user', {
    body: jsonBody({
      productId: str('ID sản phẩm'),
      quantity: num('Số lượng, mặc định 1'),
      variantId: str('ID biến thể nếu sản phẩm có phân loại'),
    }, ['productId']),
    responses: { 200: json('Giỏ hàng sau khi thêm'), 400: json('Hết hàng hoặc thiếu phân loại') },
  }),
  endpoint('delete', '/api/cart', 'Giỏ hàng', 'Xóa toàn bộ giỏ hàng', 'user', {
    responses: { 200: json('Giỏ trống') },
  }),
  endpoint('put', '/api/cart/{productId}', 'Giỏ hàng', 'Đổi số lượng một dòng trong giỏ', 'user', {
    query: [q('variantId', 'ID biến thể của dòng cần sửa')],
    body: jsonBody({ quantity: num('Số lượng mới'), variantId: str('ID biến thể') }, ['quantity']),
    responses: { 200: json('Giỏ hàng đã cập nhật'), 400: json('Số lượng không hợp lệ') },
  }),
  endpoint('delete', '/api/cart/{productId}', 'Giỏ hàng', 'Xóa một dòng trong giỏ', 'user', {
    query: [q('variantId', 'ID biến thể của dòng cần xóa')],
    responses: { 200: json('Giỏ hàng sau khi xóa') },
  }),

  endpoint('get', '/api/wishlist', 'Wishlist', 'Lấy wishlist', 'user', {
    responses: { 200: json('Wishlist') },
  }),
  endpoint('post', '/api/wishlist', 'Wishlist', 'Thêm sản phẩm vào wishlist', 'user', {
    body: jsonBody({ productId: str('ID sản phẩm') }, ['productId']),
    responses: { 200: json('Wishlist'), 400: json('Thiếu productId'), 404: json('Không tìm thấy sản phẩm') },
  }),
  endpoint('delete', '/api/wishlist/{productId}', 'Wishlist', 'Xóa sản phẩm khỏi wishlist', 'user', {
    responses: { 200: json('Wishlist sau khi xóa') },
  }),
  endpoint('post', '/api/wishlist/move-to-cart', 'Wishlist', 'Chuyển một sản phẩm sang giỏ hàng', 'user', {
    body: jsonBody({
      productId: str('ID sản phẩm'),
      quantity: num('Số lượng, mặc định 1'),
      variantId: str('ID biến thể nếu có phân loại'),
    }, ['productId']),
    responses: { 200: json('Đã chuyển sang giỏ'), 400: json('Thiếu phân loại hoặc hết hàng'), 404: json('Không tìm thấy sản phẩm') },
  }),

  endpoint('post', '/api/orders', 'Đơn hàng', 'Tạo đơn từ giỏ hàng hoặc từ danh sách items', 'user', {
    body: jsonBody({
      shippingAddress,
      paymentMethod: str('COD, Banking hoặc VNPAY', { enum: ['COD', 'Banking', 'VNPAY'] }),
      couponCode: str('Mã giảm giá'),
      items: { type: 'array', items: orderItem, description: 'Bỏ trống để lấy giỏ hàng hiện tại' },
      shippingPrice: num('Phí vận chuyển, mặc định 30000'),
    }, ['shippingAddress']),
    responses: { 201: json('Đơn đã tạo'), 400: json('Thiếu địa chỉ, giỏ trống hoặc hết hàng') },
  }),
  endpoint('get', '/api/orders/my-orders', 'Đơn hàng', 'Đơn hàng của tôi', 'user', {
    query: [q('status', 'Pending, Confirmed, Processing, Shipping, Delivered hoặc Cancelled')],
    responses: { 200: json('Danh sách đơn') },
  }),
  endpoint('get', '/api/orders', 'Đơn hàng', 'Mọi đơn hàng', 'staff', {
    query: [q('status', 'Lọc trạng thái'), q('search', 'Tìm theo mã hoặc khách'), q('page', 'Trang', { type: 'integer' }), q('limit', 'Kích thước trang', { type: 'integer' })],
    responses: { 200: json('Danh sách và phân trang') },
  }),
  endpoint('get', '/api/orders/{id}', 'Đơn hàng', 'Chi tiết đơn. Khách chỉ xem đơn của mình', 'user', {
    responses: { 200: json('Đơn hàng'), 403: json('Không phải đơn của bạn'), 404: json('Không tìm thấy') },
  }),
  endpoint('put', '/api/orders/{id}/cancel', 'Đơn hàng', 'Khách hủy đơn của mình', 'user', {
    body: jsonBody({ reason: str('Lý do hủy') }),
    responses: { 200: json('Đã hủy'), 400: json('Đơn không còn hủy được'), 403: json('Không phải đơn của bạn'), 404: json('Không tìm thấy') },
  }),
  endpoint('put', '/api/orders/{id}/status', 'Đơn hàng', 'Đổi trạng thái đơn', 'staff', {
    body: jsonBody({
      status: str('Pending, Confirmed, Processing, Shipping, Delivered hoặc Cancelled'),
      note: str('Ghi chú'),
    }, ['status']),
    responses: { 200: json('Đã cập nhật'), 400: json('Trạng thái không hợp lệ'), 404: json('Không tìm thấy') },
  }),
  endpoint('put', '/api/orders/{id}/shipping', 'Đơn hàng', 'Cập nhật vận đơn', 'staff', {
    body: jsonBody({
      trackingNumber: str('Mã vận đơn'),
      shippingNotes: str('Ghi chú giao hàng'),
      status: str('Trạng thái mới, nếu có'),
    }),
    responses: { 200: json('Đã cập nhật'), 404: json('Không tìm thấy') },
  }),

  endpoint('get', '/api/admin/users', 'Quản trị người dùng', 'Danh sách người dùng', 'admin', {
    query: [
      q('search', 'Tìm theo tên hoặc email'),
      q('role', 'customer, staff hoặc admin'),
      q('page', 'Trang', { type: 'integer' }),
      q('limit', 'Kích thước trang', { type: 'integer' }),
      q('sortBy', 'Trường sắp xếp'),
      q('all', 'true để lấy toàn bộ, không phân trang'),
    ],
    responses: { 200: json('Danh sách người dùng') },
  }),
  endpoint('post', '/api/admin/users/staff', 'Quản trị người dùng', 'Tạo tài khoản staff', 'admin', {
    body: jsonBody({
      name: str('Họ tên, 2 đến 100 ký tự'),
      email: str('Email'),
      password: str('Mật khẩu, tối thiểu 6 ký tự'),
    }, ['name', 'email', 'password']),
    responses: { 201: json('Staff đã tạo'), 400: json('Dữ liệu không hợp lệ hoặc email đã dùng') },
  }),
  endpoint('post', '/api/admin/staff', 'Quản trị người dùng', 'Tạo tài khoản staff (đường dẫn rút gọn)', 'admin', {
    body: jsonBody({
      name: str('Họ tên, 2 đến 100 ký tự'),
      email: str('Email'),
      password: str('Mật khẩu, tối thiểu 6 ký tự'),
    }, ['name', 'email', 'password']),
    responses: { 201: json('Staff đã tạo'), 400: json('Dữ liệu không hợp lệ hoặc email đã dùng') },
  }),
  endpoint('put', '/api/admin/users/{id}/role', 'Quản trị người dùng', 'Đổi vai trò', 'admin', {
    body: jsonBody({ role: str('customer, staff hoặc admin', { enum: ['customer', 'staff', 'admin'] }) }, ['role']),
    responses: { 200: json('Đã đổi vai trò'), 400: json('Vai trò không hợp lệ'), 404: json('Không tìm thấy') },
  }),
  endpoint('patch', '/api/admin/users/{id}/status', 'Quản trị người dùng', 'Khóa hoặc mở tài khoản', 'admin', {
    body: jsonBody({ isActive: bool('true để mở, false để khóa') }),
    responses: { 200: json('Đã cập nhật trạng thái'), 404: json('Không tìm thấy') },
  }),
  endpoint('put', '/api/admin/users/{id}/status', 'Quản trị người dùng', 'Khóa hoặc mở tài khoản', 'admin', {
    body: jsonBody({ isActive: bool('true để mở, false để khóa') }),
    responses: { 200: json('Đã cập nhật trạng thái'), 404: json('Không tìm thấy') },
  }),
  endpoint('delete', '/api/admin/users/{id}', 'Quản trị người dùng', 'Xóa người dùng', 'admin', {
    responses: { 200: json('Đã xóa'), 400: json('Không xóa được chính mình'), 404: json('Không tìm thấy') },
  }),

  endpoint('get', '/api/admin/stats', 'Thống kê', 'Thống kê doanh thu và đơn hàng', 'staff', {
    query: [
      q('filterType', 'day, month hoặc year'),
      q('date', 'Ngày YYYY-MM-DD khi filterType=day'),
      q('month', 'Tháng khi filterType=month', { type: 'integer' }),
      q('year', 'Năm', { type: 'integer' }),
    ],
    responses: { 200: json('Số liệu thống kê') },
  }),
];

const securityFor = (auth) => {
  if (auth === 'public') return [];
  if (auth === 'cookie') return [{ adminCookie: [] }];
  return [{ bearerAuth: [] }];
};

const buildSpec = () => {
  const paths = {};

  endpoints.forEach((item) => {
    const parameters = [];
    const names = [...item.path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    names.forEach((name) => {
      parameters.push({
        name,
        in: 'path',
        required: true,
        schema: idParam(name === 'token' ? 'Token đặt lại mật khẩu, 64 ký tự hex' : 'Định danh'),
      });
    });
    (item.query || []).forEach((parameter) => parameters.push(parameter));

    const operation = {
      tags: [item.tag],
      summary: item.summary,
      description: authText[item.auth],
      security: securityFor(item.auth),
      responses: {
        ...item.responses,
        ...baseErrors(item.auth),
      },
    };
    if (parameters.length) operation.parameters = parameters;
    if (item.body) operation.requestBody = item.body;

    paths[item.path] = paths[item.path] || {};
    paths[item.path][item.method] = operation;
  });

  return {
    openapi: '3.0.3',
    info: {
      title: 'CLOSET STUDIO API',
      version: '1.0.0',
      description: introduction,
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Máy phát triển cục bộ' },
      { url: '/', description: 'Máy chủ hiện tại' },
    ],
    tags: [...new Set(endpoints.map((item) => item.tag))].map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT trả về từ đăng nhập hoặc đăng ký. Gửi header Authorization: Bearer <token>.',
        },
        adminCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'admin_token',
          description: 'Cookie httpOnly tạo khi admin đăng nhập, dùng cho các trang EJS /admin.',
        },
      },
      schemas: {
        MessageResponse: {
          type: 'object',
          properties: { message: { type: 'string' }, success: { type: 'boolean' } },
        },
        UserProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['customer', 'staff', 'admin'] },
            isActive: { type: 'boolean' },
            avatar: { type: 'string' },
            addresses: { type: 'array', items: { type: 'object' } },
          },
        },
        AuthResponse: {
          allOf: [
            { $ref: '#/components/schemas/UserProfile' },
            { type: 'object', properties: { token: { type: 'string' } } },
          ],
        },
      },
    },
  };
};

const spec = buildSpec();

const countOperations = (document) => Object.values(document.paths).reduce(
  (total, pathItem) => total + Object.keys(pathItem).filter((key) => ['get', 'post', 'put', 'patch', 'delete'].includes(key)).length,
  0
);

module.exports = {
  spec,
  countOperations,
  introduction,
};

if (require.main === module) {
  const YAML = require('yaml');
  const target = path.join(__dirname, '../../openapi.yaml');
  fs.writeFileSync(target, YAML.stringify(spec, { aliasDuplicateObjects: false }));
  console.log(`Wrote ${target} (${countOperations(spec)} operations)`);
}
