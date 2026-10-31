Sử dụng 4 Sub agent UI/UX, Sub agent Backend, Sub agent Frontend, Sub agent Tester chạy cùng nhau (các agent nào có việc thì hoạt động, không có việc sẽ ở trạng thái chờ) để triển khai Phần 6: Product Filter & Sort (Gate 3 / Cổng 3) cho phân hệ Member 2: Product (Management, Search, Filter & Sort) thuộc dự án SE1909 G5 SDN302 Final Project.

Working directory: c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject
Integrity mode: development

## Requirements

### R1. Unified Backend Filtering & Sorting API
Gom toàn bộ truy vấn lọc và sắp xếp vào unified controller `getProducts` (`shop-project/backend/src/controllers/productController.js`) xử lý qua `req.query`:
- Lọc đa điều kiện: category, minPrice, maxPrice, inStock,...
- Sắp xếp (Sort): giá tăng/giảm, mới nhất, rating,...
- Phân trang & giới hạn: page, limit.
Tối ưu Mongoose query, xử lý an toàn các trường hợp lọc kết hợp nhiều điều kiện đồng thời và kiểm tra RBAC (Customer xem danh mục sản phẩm, Staff/Admin quản lý theo quyền hạn).

### R2. Frontend Filter & Sort Components and URL Synchronization
Xây dựng giao diện bộ lọc và sắp xếp sản phẩm trên trang khách hàng `shop-project/frontend/src/pages/ProductsPage.jsx` và trang quản trị `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx`:
- Component bộ lọc đa điều kiện và sắp xếp kết hợp mượt mà với thanh tìm kiếm sẵn có.
- Đồng bộ hai chiều với URL search params (page, limit, filter, sort, search,...), phản hồi ngay lập tức, responsive, tái sử dụng các CSS utility classes và Axios client sẵn có.

### R3. Automated Testing & Verification
Sử dụng và mở rộng các test suite Jest (Backend) và Vitest (Frontend) hiện có trong repository:
- Kiểm thử tự động cho toàn bộ tính năng lọc kết hợp nhiều điều kiện, sắp xếp, phân trang, edge cases và RBAC.
- Đảm bảo 100% test suite pass. Sử dụng bộ tài khoản kiểm thử chuẩn: Admin (`admin@shop.com`/`admin123`), Staff (`staff@shop.com`/`staff123`), Customer (`customer@shop.com`/`password123`).

### R4. Minimal Code Principle & Gate 3 Protocol
Tuân thủ Minimal Code Principle: code tối giản, zero bloat, không sinh boilerplate hay abstraction thừa, tái sử dụng components, CSS utilities và API client sẵn có.
Sau khi hoàn thành Phần 6 và kiểm thử thành công, dừng lại và báo cáo tổng thể toàn bộ phân hệ Member 2 (Cổng 3 - Gate 3).

## Acceptance Criteria

### Backend Filter & Sort
- [ ] Unified controller `getProducts` hỗ trợ đầy đủ các query parameters cho lọc đa điều kiện (category, minPrice, maxPrice, inStock,...), sắp xếp (giá tăng/giảm, mới nhất, rating,...) và phân trang (page, limit).
- [ ] Query Mongoose được tối ưu, xử lý an toàn và chính xác các trường hợp lọc kết hợp nhiều điều kiện đồng thời.
- [ ] RBAC được áp dụng đúng chuẩn cho Customer, Staff và Admin.

### Frontend & URL Sync
- [ ] Giao diện bộ lọc và sắp xếp hiển thị trực quan, responsive và sử dụng CSS utilities hiện có trên cả `ProductsPage.jsx` và `AdminProductsPage.jsx`.
- [ ] Mọi thay đổi về bộ lọc, sắp xếp, phân trang và tìm kiếm được đồng bộ hai chiều với URL search params mà không làm mất trạng thái khi tải lại trang.

### Testing & Verification
- [ ] Test suites (Jest cho Backend, Vitest cho Frontend) kiểm thử đầy đủ các điều kiện lọc, sắp xếp, phân trang và edge cases, đạt 100% pass.
- [ ] Kiểm thử thành công với các tài khoản test chuẩn: Admin (`admin@shop.com`/`admin123`), Staff (`staff@shop.com`/`staff123`), Customer (`customer@shop.com`/`password123`).

### Gate 3 Protocol
- [ ] Dừng lại và báo cáo tổng thể toàn bộ phân hệ Member 2 sau khi hoàn thành Phần 6 và kiểm thử thành công.
