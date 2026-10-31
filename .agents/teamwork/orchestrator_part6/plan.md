# Execution Plan: Gate 3 - Product Filter & Sort (Part 6)

## Objective
Triển khai Phần 6: Product Filter & Sort (Gate 3 / Cổng 3) cho phân hệ Member 2: Product (Management, Search, Filter & Sort) với 4 sub-agents chuyên trách (UI/UX, Backend, Frontend, Tester) theo nguyên tắc Minimal Code Principle, zero bloat, an toàn RBAC, đồng bộ 2 chiều với URL query params (`useSearchParams`), và đạt 100% test pass trên bộ tài khoản chuẩn (Admin, Staff, Customer). Sau khi hoàn thành và audit thành công, dừng lại và báo cáo tổng thể toàn bộ phân hệ Member 2.

## Sub-Agents Allocation & Phased Workflow

### Phase 1: Sub-agent UI/UX (`teamwork_worker` - UI/UX Designer)
- **Folder**: `.agents/teamwork/ui_ux_part6/`
- **Nhiệm vụ**:
  - Thiết kế UX Specs cho Bộ lọc (Filter) đa điều kiện: Danh mục (`category`), Khoảng giá (`minPrice`, `maxPrice`), Trạng thái kho hàng (`inStock`), Trạng thái kích hoạt (`isActive` cho Admin).
  - Thiết kế UX Specs cho Sắp xếp (Sort): Giá tăng dần, Giá giảm dần, Mới nhất, Đánh giá cao nhất (`rating`).
  - Thiết kế UX Specs cho Phân trang (Pagination): Nút trang trước, trang sau, danh sách trang, số lượng sản phẩm mỗi trang.
  - Quy chuẩn đồng bộ 2 chiều với URL Search Params: Phản hồi tức thì, không mất state khi reload trang, nút Reset bộ lọc.
  - Tối giản hóa giao diện, tái sử dụng CSS utility classes trong `index.css`.
- **Output**: `.agents/teamwork/ui_ux_part6/ux_specs.md` và `handoff.md`.
- **Trạng thái**: Chuyển sang Chờ (Idle) sau khi hoàn thành specs.

### Phase 2: Sub-agent Backend (`teamwork_worker` - Backend Developer)
- **Folder**: `.agents/teamwork/backend_part6/`
- **Nhiệm vụ**:
  - Cập nhật unified controller `getProducts` tại `shop-project/backend/src/controllers/productController.js`:
    - Xử lý các query params qua `req.query`: `search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `page`, `limit`.
    - Tối ưu Mongoose query: kết hợp an toàn `$and` / `$or` khi đồng thời có `search`, `category`, price range (`$gte`, `$lte`), `stock` (`$gt: 0`), và `isActive` (Customer chỉ thấy sản phẩm active; Admin/Staff có thể xem tất cả).
    - Xử lý sắp xếp đa dạng: `price-asc`, `price-desc`, `newest` (`createdAt: -1`), `rating` (`rating: -1`).
    - Xử lý phân trang chuẩn: `skip`, `limit`, trả về metadata `{ success: true, count, total, totalPages, currentPage, products: [...] }`.
  - Giữ vững Minimal Code Principle: không tạo middleware/helper thừa.
  - Chạy backend test suite kiểm tra API.
- **Output**: `.agents/teamwork/backend_part6/handoff.md`.
- **Trạng thái**: Chuyển sang Chờ (Idle) sau khi API hoàn thành và pass test.

### Phase 3: Sub-agent Frontend (`teamwork_worker` - Frontend Developer)
- **Folder**: `.agents/teamwork/frontend_part6/`
- **Nhiệm vụ**:
  - Cập nhật `shop-project/frontend/src/pages/ProductsPage.jsx` và `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx`:
    - Triển khai UI Filter (Category dropdown/buttons, Price range, In-stock checkbox).
    - Triển khai UI Sort (Dropdown select: Mới nhất, Giá tăng dần, Giá giảm dần, Đánh giá cao nhất).
    - Triển khai UI Pagination (Previous, Next, page numbers).
    - Đồng bộ 2 chiều chặt chẽ với URL query params thông qua `useSearchParams` của `react-router-dom`: khi user đổi filter/sort/page -> update URL params; khi URL thay đổi (hoặc reload/back) -> đọc params đưa vào state và gọi API.
    - Kết hợp mượt mà với Search bar debounced 300ms đã có từ Phần 5.
    - Tái sử dụng `api.js` Axios instance và CSS classes sẵn có.
- **Output**: `.agents/teamwork/frontend_part6/handoff.md`.
- **Trạng thái**: Chuyển sang Chờ (Idle) sau khi UI hoàn tất.

### Phase 4: Sub-agent Tester (`teamwork_test_writer` / `teamwork_worker` - QA Tester)
- **Folder**: `.agents/teamwork/tester_part6/`
- **Nhiệm vụ**:
  - Mở rộng và viết test tự động:
    - Backend (Jest / Supertest): Test lọc đơn lẻ, lọc đa điều kiện kết hợp (search + category + price + stock), test sắp xếp các kiểu, test phân trang, test RBAC trên các query.
    - Frontend (Vitest): Test render Filter/Sort controls, test thay đổi filter cập nhật search params, test pagination click, test kết hợp search + filter.
  - Đảm bảo 100% test pass.
  - Sử dụng bộ tài khoản kiểm thử chuẩn: Admin (`admin@shop.com`/`admin123`), Staff (`staff@shop.com`/`staff123`), Customer (`customer@shop.com`/`password123`).
- **Output**: `.agents/teamwork/tester_part6/handoff.md`.
- **Trạng thái**: Chuyển sang Chờ (Idle) sau khi test suite xanh 100%.

### Phase 5: Verification & Gate 3 Assessment
- Dispatch `teamwork_reviewer` và `teamwork_auditor` kiểm tra tính toàn vẹn (không hardcode test, không dummy facade, minimal code).
- Gate check trong `GATE_STATUS.md`.

### Phase 6: Final Overall Delivery (Gate 3 Protocol)
- Dừng lại và lập Báo Cáo Tổng Thể Toàn Bộ Phân Hệ Member 2 (Phần 4, 5, 6).
