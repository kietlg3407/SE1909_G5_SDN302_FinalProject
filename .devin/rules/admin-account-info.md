# Thông Tin Tài Khoản Admin

## Tài khoản Admin hiện có trong Database

### Thông tin đăng nhập
- **Email:** `admin@shop.com`
- **Mật khẩu:** `admin123` (nếu bạn chưa đổi)
- **Vai trò:** `admin`
- **Tên hiển thị:** `Quản trị viên`
- **Ngày tạo:** 2026-10-07

### Lưu ý quan trọng
⚠️ **Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu để bảo mật!**

## Cách sử dụng tài khoản admin

### 1. Đăng nhập qua Frontend
1. Khởi động backend: `cd shop-project/backend && npm start`
2. Khởi động frontend: `cd shop-project/frontend && npm run dev`
3. Mở trình duyệt và truy cập frontend (thường là http://localhost:5173)
4. Đăng nhập với email: `admin@shop.com` và mật khẩu: `admin123`
5. Sau khi đăng nhập, bạn sẽ có quyền truy cập vào các trang admin

### 2. Đăng nhập qua API (Postman/Thunder Client)
**Endpoint:** `POST /api/users/login`

**Request Body:**
```json
{
  "email": "admin@shop.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "_id": "...",
  "name": "Quản trị viên",
  "email": "admin@shop.com",
  "role": "admin",
  "avatar": "",
  "addresses": [],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Sử dụng JWT Token cho Admin API
Sau khi đăng nhập, copy `token` từ response và sử dụng trong header:

**Header:**
```
Authorization: Bearer <your_token_here>
```

## Các quyền của Admin

### Admin có thể truy cập:
- ✅ Dashboard điều hành (`/admin/dashboard`)
- ✅ Quản lý người dùng (`/admin/users`)
- ✅ Quản lý mã giảm giá (`/admin/coupons`)
- ✅ Xem thống kê (`/api/admin/stats`)

### Admin API Endpoints (được bảo vệ):
- `GET /api/admin/users` - Lấy danh sách tất cả users
- `PUT /api/admin/users/:id/role` - Cập nhật role của user
- `DELETE /api/admin/users/:id` - Xóa user
- `GET /api/admin/stats` - Lấy thống kê dashboard
- `GET /api/coupons` - Lấy danh sách coupons
- `POST /api/coupons` - Tạo coupon mới
- `PUT /api/coupons/:id` - Cập nhật coupon
- `DELETE /api/coupons/:id` - Xóa coupon

## Kiểm tra tài khoản admin

Nếu bạn muốn kiểm tra lại tài khoản admin trong tương lai, chạy script:

```bash
cd shop-project/backend
node scripts/check-admin.js
```

Script này sẽ:
- Kiểm tra xem có tài khoản admin nào trong database không
- Hiển thị thông tin admin nếu đã tồn tại
- Gợi ý tạo admin mới nếu chưa có

## Tạo thêm tài khoản admin mới

Nếu bạn muốn tạo thêm tài khoản admin khác, có 2 cách:

### Cách 1: Tạo trực tiếp trong MongoDB Compass/Atlas
1. Mở MongoDB Compass hoặc MongoDB Atlas
2. Kết nối đến database
3. Chọn collection `users`
4. Tạo document mới với:
```json
{
  "name": "Tên Admin Mới",
  "email": "new-admin@shop.com",
  "password": "mật_khẩu_mới",
  "role": "admin",
  "avatar": "",
  "addresses": []
}
```
Lưu ý: Mật khẩu sẽ được tự động hash bởi Mongoose pre-save hook.

### Cách 2: Tạo qua API (sử dụng admin hiện có)
Sử dụng endpoint đăng ký thông thường, sau đó cập nhật role thành admin:

1. Đăng ký user mới qua `POST /api/users/register`
2. Sử dụng tài khoản admin hiện có để cập nhật role:
   `PUT /api/admin/users/:id/role` với body `{"role": "admin"}`

## Bảo mật

### Khuyến nghị:
- 🔒 Đổi mật khẩu mặc định ngay lập tức
- 🔒 Sử dụng mật khẩu mạnh (ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt)
- 🔒 Không chia sẻ thông tin đăng nhập với người không có quyền
- 🔒 Thay đổi mật khẩu định kỳ
- 🔒 Sử dụng HTTPS trong production

### Lưu ý về JWT Token:
- Token có thời hạn 30 ngày
- Sau khi đổi mật khẩu, token cũ sẽ vẫn hoạt động cho đến khi hết hạn
- Token được lưu trong localStorage của trình duyệt (frontend)
- Logout sẽ xóa token khỏi localStorage

## Xử lý sự cố

### Quên mật khẩu admin
Hiện tại hệ thống chưa có tính năng "quên mật khẩu". Bạn có thể:
1. Kết nối trực tiếp đến MongoDB
2. Tìm user với email `admin@shop.com`
3. Update password field (sẽ được tự động hash bởi Mongoose)
4. Hoặc tạo tài khoản admin mới

### Không thể đăng nhập
Kiểm tra:
- Email và mật khẩu có đúng không
- Backend server có đang chạy không
- MongoDB có đang kết nối không
- User có bị xóa khỏi database không

### Không có quyền truy cập admin
Kiểm tra:
- Role của user có phải là `admin` không
- JWT token có hợp lệ không
- Token có được gửi trong header `Authorization` không

## Liên hệ
Nếu gặp vấn đề với tài khoản admin, hãy kiểm tra:
- File `.env` trong backend (MONGO_URI, JWT_SECRET)
- Database connection
- Logs của backend server
