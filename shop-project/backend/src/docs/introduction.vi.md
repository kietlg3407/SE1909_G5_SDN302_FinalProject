Dự án SE1909_G5_SDN302_FinalProject (CLOSET STUDIO) là website thương mại điện tử bán quần áo, phục vụ bài tập lớn môn SDN302. Khách hàng xem danh mục, tìm kiếm, lọc, sắp xếp, quản lý giỏ hàng và danh sách yêu thích, đặt hàng, đánh giá và bình luận. Nhân viên và quản trị viên quản lý sản phẩm, phân loại, đơn hàng, mã giảm giá, người dùng và thống kê.

Công nghệ sử dụng:

- Backend: Node.js và Express 5.
- Cơ sở dữ liệu: MongoDB với Mongoose.
- Frontend: React 19, Vite, React Router 7, Axios, react-hot-toast, lucide-react và Chart.js.
- Xác thực: JWT (jsonwebtoken) qua header Authorization Bearer; mật khẩu được băm bằng bcryptjs trong hook pre-save của model User; phân quyền bằng middleware protect, isAdmin và isStaffOrAdmin. Dashboard quản trị render bằng EJS dùng cookie httpOnly admin_token.
- Thư viện và dịch vụ khác: Cloudinary và Multer cho ảnh sản phẩm và avatar, Nodemailer cho email đặt lại mật khẩu, CORS, cookie-parser, dotenv, và Swagger UI (OpenAPI 3) tại /api-docs.

Hệ thống đăng ký đúng 96 endpoint. Mỗi endpoint là một cặp phương thức HTTP và đường dẫn sau khi gắn prefix trong server.js. Router đánh giá được mount tại /api và /api/reviews, mỗi nơi 8 đường dẫn. Router bình luận được mount tại /api và /api/comments; 5 handler gắn tại /api trùng phương thức và đường dẫn với router đánh giá (Express khớp router đánh giá trước) nên không tính thêm endpoint. Phân bổ:

- Hệ thống: 1 (GET /)
- Giao diện Admin EJS: 7
- Người dùng: 14 (xác thực 5, gồm quên mật khẩu và đặt lại mật khẩu; hồ sơ 4; địa chỉ 5)
- Yêu thích: 4
- Đánh giá: 16
- Bình luận: 5
- Mã giảm giá: 6
- Sản phẩm: 9
- Danh mục: 5
- Thương hiệu: 5
- Giỏ hàng: 5
- Wishlist: 4
- Đơn hàng: 7
- Quản trị người dùng: 7
- Thống kê: 1
