# Execution Plan: Gate 2 - Product Search (Part 5)

## Objective
Triển khai tính năng Product Search cho cả trang khách hàng và trang quản trị theo chuẩn Minimal Code, an toàn Regex/ReDoS, hỗ trợ debounce 300ms, nút xóa nhanh, loading, empty state, và 100% test pass.

## Sub-Agents Allocation (4 Core Sub-Agents)
1. **Sub-agent UI/UX** (`teamwork_worker` - UI/UX Designer):
   - Thiết kế UX Search Bar (Search icon, Input field, Clear 'X' button, Loading spinner).
   - Thiết kế Empty State (Icon minh họa, thông điệp rõ ràng, gợi ý từ khóa).
   - Output: `.agents/teamwork/ui_ux_part5/ux_specs.md`.
   - Trạng thái: Chuyển sang Idle sau khi hoàn thành specs.

2. **Sub-agent Backend** (`teamwork_worker` - Backend Developer):
   - Cập nhật `productController.js` - hàm `getProducts`:
     - Xử lý tham số `search`.
     - Thoát ký tự đặc biệt Regex (Regex escaping) tránh ReDoS / Regex Injection.
     - Tìm kiếm `$or: [{ name: { $regex: escapedSearch, $options: 'i' } }, { description: { $regex: escapedSearch, $options: 'i' } }]`.
     - Đảm bảo tương thích với các bộ lọc `isActive`, phân trang.
   - Chạy kiểm tra API và unit tests.
   - Trạng thái: Chuyển sang Idle sau khi backend API hoàn tất.

3. **Sub-agent Frontend** (`teamwork_worker` - Frontend Developer):
   - Triển khai Search Bar trên `ProductsPage.jsx` (Khách hàng) và `AdminProductsPage.jsx` (Quản trị):
     - Input debounced 300ms với native React (`useState`, `useEffect` / `useMemo`).
     - Icon kính lúp (Lucide `Search`), icon nút 'X' xóa nhanh (Lucide `X`), loading spinner.
     - Hiển thị Empty State đẹp mắt khi danh sách rỗng sau tìm kiếm.
     - Tối giản code, tái sử dụng CSS utility tokens.
   - Trạng thái: Chuyển sang Idle sau khi UI hoàn tất.

4. **Sub-agent Tester** (`teamwork_test_writer` / `teamwork_worker` - QA Tester):
   - Viết và chạy test tự động:
     - Backend (Jest): tìm kiếm chính xác, tìm kiếm một phần, ký tự đặc biệt (`.*+?^${}()|[]\`), không phân biệt hoa thường, kết hợp quyền Admin/Staff/Customer.
     - Frontend (Vitest): debounce typing, clear input, render empty state, loading state.
   - Đảm bảo 100% tests pass.
   - Trạng thái: Chuyển sang Idle sau khi test suite xanh.

5. **Auditor & Review Verification**:
   - `teamwork_auditor`: Kiểm tra tính toàn vẹn (không hardcode kết quả test, không dummy facade, an toàn bảo mật ReDoS).
   - Đánh giá GATE 2.

6. **Gate 2 Completion**:
   - Dừng lại, tổng hợp báo cáo chi tiết và hỏi ý kiến User trước khi tiếp tục Phần 6.
