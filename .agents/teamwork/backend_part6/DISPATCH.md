## 2026-10-31T15:36:17Z
Bạn là Sub-agent Backend trong mô hình 4 Sub-agents của phân hệ Member 2: Product (Management, Search, Filter & Sort) thuộc dự án SE1909 G5 SDN302 Final Project.

Working directory của bạn: c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\backend_part6\

Nhiệm vụ của bạn trong Phần 6 (Gate 3 - Product Filter & Sort):
1. Đọc kỹ các tài liệu bắt buộc sau:
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ORIGINAL_REQUEST.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\PROJECT.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\skills\product-management\SKILL.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ui_ux_part6\ux_specs.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\shop-project\backend\src\controllers\productController.js
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\shop-project\backend\tests\product.test.js

2. Quyền sở hữu file (Exclusive File Ownership):
   - Bạn sở hữu độc quyền: `shop-project/backend/src/controllers/productController.js` và `shop-project/backend/src/routes/productRoutes.js` (nếu cần chỉnh sửa).
   - KHÔNG chỉnh sửa các file frontend hoặc test của tester.

3. Triển khai và tối ưu hóa logic trong unified controller `getProducts`:
   - Lọc đa điều kiện qua `req.query`:
     - `search`: tìm kiếm không phân biệt hoa thường tên/mô tả với regex escaping an toàn chống ReDoS.
     - `category`: lọc theo danh mục (bỏ qua nếu 'Tất cả' hoặc không có).
     - `minPrice` & `maxPrice`: lọc theo khoảng giá số học (`$gte`, `$lte`), validate số không âm.
     - `inStock`: khi `inStock === 'true'`, lọc `stock: { $gt: 0 }`.
     - `status` / `isActive`: Hỗ trợ Admin/Staff lọc theo trạng thái sản phẩm nếu truyền query.
   - Sắp xếp (Sort):
     - Hỗ trợ linh hoạt cả format gạch nối và gạch dưới để tương thích tối đa:
       - `price-asc` / `price_asc`: `{ price: 1 }`
       - `price-desc` / `price_desc`: `{ price: -1 }`
       - `newest`: `{ createdAt: -1 }`
       - `rating` / `rating_desc`: `{ rating: -1 }`
       - `name-asc` / `name_asc`: `{ name: 1 }`
       - `name-desc` / `name_desc`: `{ name: -1 }`
       - Mặc định: `{ createdAt: -1 }`
   - Phân trang & Giới hạn:
     - `page` (default 1), `limit` (default 12).
     - Trả về payload chuẩn: `{ success: true, count, total, totalPages, currentPage, limit, products }`.
   - RBAC:
     - Khách vãng lai và Customer chỉ được thấy sản phẩm `isActive: true`.
     - Admin/Staff có thể xem tất cả hoặc lọc theo status.
   - Minimal Code Principle: code tối giản, zero bloat, sạch sẽ, không middleware/helper thừa.

4. Chạy kiểm thử Backend:
   - Chạy test suite backend (`cd shop-project/backend && npm test`) để đảm bảo toàn bộ tests hiện có tiếp tục pass 100%.

5. Viết `handoff.md` tại thư mục làm việc của bạn và gửi tin nhắn (send_message) về cho Orchestrator để báo cáo kết quả chi tiết kèm lệnh chạy test và kết quả test.

6. Sau khi hoàn thành và gửi báo cáo, bạn CHUYỂN SANG TRẠNG THÁI CHỜ (IDLE).
