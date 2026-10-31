## 2026-10-31T15:47:10Z
Bạn là Sub-agent Frontend trong mô hình 4 Sub-agents của phân hệ Member 2: Product (Management, Search, Filter & Sort) thuộc dự án SE1909 G5 SDN302 Final Project.

Working directory của bạn: c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\frontend_part6\

Nhiệm vụ của bạn trong Phần 6 (Gate 3 - Product Filter, Sort & URL Synchronization):
1. Đọc kỹ các tài liệu bắt buộc sau:
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ORIGINAL_REQUEST.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\PROJECT.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\skills\product-management\SKILL.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ui_ux_part6\ux_specs.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\backend_part6\handoff.md
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\shop-project\frontend\src\pages\ProductsPage.jsx
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\shop-project\frontend\src\pages\admin\AdminProductsPage.jsx
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\shop-project\frontend\src\index.css
   - c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\shop-project\frontend\src\services\api.js

2. Quyền sở hữu file (Exclusive File Ownership):
   - Bạn sở hữu độc quyền: `shop-project/frontend/src/pages/ProductsPage.jsx` và `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx`.
   - KHÔNG chỉnh sửa code Backend hoặc file test của Tester.

3. Triển khai chi tiết theo UX Specs:
   - **`ProductsPage.jsx`**:
     - Hoàn thiện bộ lọc đa điều kiện:
       - Danh mục (`category`): chọn danh mục, active badge/highlight.
       - Khoảng giá (`minPrice`, `maxPrice`): preset buttons (<300k, 300k-600k, >600k) và custom input form với nút Áp dụng.
       - Còn hàng (`inStock`): checkbox/toggle.
       - Nút Đặt lại bộ lọc (Reset): xóa toàn bộ filter về mặc định.
     - Sắp xếp (`sortBy`): Dropdown select (`newest`, `price-asc`, `price-desc`, `rating`, `name-asc`).
     - Phân trang (`page`, `limit`): Prev, Next, dãy số trang, label tổng số sản phẩm.
     - Đồng bộ hai chiều với URL Search Params (`useSearchParams`):
       - Khi người dùng thay đổi filter, sort, search, page -> URL search params cập nhật tương ứng.
       - Khi reload trang hoặc back/forward trên trình duyệt -> state được khôi phục chính xác từ URL params và gọi API tương ứng.
       - Xóa các param mang giá trị mặc định khỏi URL để giữ URL luôn sạch gọn (ví dụ page=1, category='all' không cần ghi lên URL).
     - Duy trì và phối hợp mượt mà với Search bar debounced 300ms, nút 'X' và Empty State từ Phần 5.
     - Responsive: hỗ trợ hiển thị tốt trên cả Desktop và Mobile.
   - **`AdminProductsPage.jsx`**:
     - Nâng cấp cơ chế lọc & tìm kiếm sang đồng bộ hai chiều với URL search params (`useSearchParams`): `search`, `category`, `status`, `page`.
     - Đảm bảo reload trang không làm mất các tiêu chí tìm kiếm và phân trang của Admin.
   - **Minimal Code Principle**:
     - Tối giản hóa code, zero bloat, không thêm thư viện thứ ba.
     - Tái sử dụng CSS utility classes trong `index.css` và Axios client trong `src/services/api.js`.

4. Chạy kiểm thử Frontend:
   - Chạy test frontend (`cd shop-project/frontend && npx vitest run`) để đảm bảo toàn bộ tests hiện có tiếp tục pass.

5. Viết `handoff.md` tại thư mục của bạn (`.agents/teamwork/frontend_part6/handoff.md`) và gửi tin nhắn (send_message) về cho Orchestrator để báo cáo kết quả kèm kết quả test.

6. Sau khi hoàn thành và gửi báo cáo, bạn CHUYỂN SANG TRẠNG THÁI CHỜ (IDLE).
