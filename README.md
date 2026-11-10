# SE1909_G5_SDN302_FinalProject

Dự án SE1909_G5_SDN302_FinalProject (CLOSET STUDIO) là website thương mại điện tử bán quần áo, phục vụ bài tập lớn môn SDN302. Khách hàng xem danh mục, tìm kiếm, lọc, sắp xếp, quản lý giỏ hàng và danh sách yêu thích, đặt hàng, đánh giá và bình luận. Nhân viên và quản trị viên quản lý sản phẩm, phân loại, đơn hàng, mã giảm giá, người dùng và thống kê.

Công nghệ sử dụng:

- Backend: Node.js và Express 5.
- Cơ sở dữ liệu: MongoDB với Mongoose.
- Frontend: React 19, Vite, React Router 7, Axios, react-hot-toast, lucide-react và Chart.js.
- Xác thực: JWT (jsonwebtoken) qua header Authorization Bearer; mật khẩu được băm bằng bcryptjs trong hook pre-save của model User; phân quyền bằng middleware protect, isAdmin và isStaffOrAdmin. Dashboard quản trị render bằng EJS dùng cookie httpOnly admin_token.
- Thư viện và dịch vụ khác: Cloudinary và Multer cho ảnh sản phẩm và avatar, Nodemailer cho email đặt lại mật khẩu, CORS, cookie-parser, dotenv, và Swagger UI (OpenAPI 3) tại /api-docs.

Hệ thống đăng ký đúng 93 endpoint. Mỗi endpoint là một cặp phương thức HTTP và đường dẫn sau khi gắn prefix trong server.js. Router đánh giá được mount tại /api và /api/reviews, mỗi nơi 7 đường dẫn. Router bình luận được mount tại /api và /api/comments; 5 handler gắn tại /api trùng phương thức và đường dẫn với router đánh giá (Express khớp router đánh giá trước) nên không tính thêm endpoint. Phân bổ:

- Hệ thống: 1 (GET /)
- Giao diện Admin EJS: 7
- Người dùng: 14 (xác thực 5, gồm quên mật khẩu và đặt lại mật khẩu; hồ sơ 4; địa chỉ 5)
- Yêu thích: 4
- Đánh giá: 14
- Bình luận: 5
- Mã giảm giá: 6
- Sản phẩm: 8
- Danh mục: 5
- Thương hiệu: 5
- Giỏ hàng: 5
- Wishlist: 4
- Đơn hàng: 7
- Quản trị người dùng: 7
- Thống kê: 1

Tài liệu tương tác của toàn bộ endpoint nằm ở `http://localhost:5000/api-docs` khi backend đang chạy.

## Cách chạy

Backend:

```bash
cd shop-project/backend
cp .env.example .env
npm install
npm start
```

Điền `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` và, nếu muốn gửi email thật, `EMAIL_USER` cùng `EMAIL_PASS`. API mặc định lắng nghe cổng 5000. Swagger UI: `http://localhost:5000/api-docs`.

Frontend:

```bash
cd shop-project/frontend
cp .env.example .env
npm install
npm run dev
```

Ứng dụng React chạy tại `http://localhost:5173`.

## Forgot password environment

Copy `shop-project/backend/.env.example` to `shop-project/backend/.env`. These variables send the reset email:

| Variable | Required | Purpose |
| --- | --- | --- |
| `EMAIL_USER` | Yes, for real email | SMTP username (Gmail address) |
| `EMAIL_PASS` | Yes, for real email | SMTP password (Gmail App Password) |
| `EMAIL_HOST` | No | SMTP host, default `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP port, default `587` |
| `EMAIL_FROM` | No | From address, defaults to `EMAIL_USER` |
| `CLIENT_URL` | Yes | Frontend origin used in the reset link, e.g. `http://localhost:5173` |
| `JWT_SECRET` | Yes | Existing login token secret |
| `MONGO_URI` | Yes | Existing database connection |

If `EMAIL_USER` or `EMAIL_PASS` is empty outside production, the API does not send mail. It still returns the same success message and prints the reset link in the server log so the flow can be tested without SMTP. The response never says whether the email is registered. Reset tokens are stored as a SHA-256 hash, expire after 15 minutes, and are deleted after a successful reset. The new password is hashed by the same User pre-save hook used at registration.
