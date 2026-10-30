# Project Rules & Guidelines - SE1909 G5 SDN302 Final Project
## Member 2: Product (Management, Search, Filter & Sort)

### 1. Nguyên Tắc Cốt Lõi: Viết Code Tối Thiểu (Minimal Code Principle)
- **Tối giản & Đầy đủ**: Chỉ viết code phục vụ trực tiếp cho yêu cầu nghiệp vụ. Tuyệt đối không sinh boilerplate code, không tạo abstraction classes hoặc helper trung gian nếu chưa thực sự cần.
- **Tái sử dụng tối đa**:
  - Dùng chung Axios client tại `frontend/src/services/api.js`.
  - Tận dụng hệ thống màu sắc, utility classes và components đã có trong `index.css`.
  - Tái sử dụng `authMiddleware.js` (`protect`, `isStaffOrAdmin`).
  - Gom các truy vấn (Search, Filter, Sort, Pagination) vào duy nhất một endpoint/controller `getProducts` ở Backend.
- **Sạch sẽ (Zero Bloat)**: Không để lại console log thừa, không import thư viện dư thừa, xóa toàn bộ dead code.

### 2. Mô Hình Vận Hành 4 Sub-Agents
- **Project Manager (PM)**: Điều phối toàn bộ vòng đời, giao việc tuần tự hoặc song song, nghiệm thu sản phẩm của các agent.
- **Sub-agent UI/UX**: Chuyên trách wireframe, UX specs, layout tối giản. Chuyển sang trạng thái Chờ (Idle) khi specs hoàn thành.
- **Sub-agent Backend**: Chuyên trách Mongoose schema, controller gọn gàng, REST routes, RBAC. Chuyển sang trạng thái Chờ (Idle) khi API hoàn thành và pass test.
- **Sub-agent Frontend**: Chuyên trách React components, modal CRUD, state query URL, kết nối API. Chuyển sang trạng thái Chờ (Idle) khi UI hoàn thiện.
- **Sub-agent Tester**: Chuyên trách kiểm thử tự động (Jest/Vitest), kiểm tra logic RBAC, edge cases. Chuyển sang trạng thái Chờ (Idle) khi test suite xanh 100%.

### 3. Tài Khoản Kiểm Thử Mặc Định (Default Test Accounts)
Tất cả các kịch bản kiểm thử (Automated Tests & Manual Verification) bắt buộc sử dụng bộ tài khoản chuẩn sau:
- **Admin (Quản trị viên)**:
  - Email: `admin@shop.com`
  - Password: `admin123`
  - Quyền hạn: Toàn quyền CRUD sản phẩm, cấu hình trạng thái, xem thống kê.
- **Staff (Nhân viên)**:
  - Email: `staff@shop.com`
  - Password: `staff123`
  - Quyền hạn: Tạo, sửa, cập nhật trạng thái sản phẩm và kho hàng.
- **Customer (Khách hàng)**:
  - Email: `customer@shop.com`
  - Password: `password123`
  - Quyền hạn: Xem danh mục, tìm kiếm, lọc, xem chi tiết sản phẩm. Bị chặn truy cập các thao tác CRUD quản trị.

### 4. Cơ Chế 3 Cổng Kiểm Soát (Stop, Report & Confirm Gates)
Quy trình bắt buộc DỪNG LẠI, BÁO CÁO và HỎI Ý KIẾN sau mỗi giai đoạn:
1. **Cổng 1 (Hoàn thành Phần 4: Product Management)**:
   - Nghiệm thu CRUD Admin, phân quyền Staff/Admin, Catalog khách hàng và 100% test pass.
   - **DỪNG LẠI, BÁO CÁO CHI TIẾT** và **HỎI Ý KIẾN USER** có muốn tiếp tục sang Phần 5 hay không. Tuyệt đối không tự ý làm tiếp nếu chưa được User phê duyệt.
2. **Cổng 2 (Hoàn thành Phần 5: Product Search)**:
   - Nghiệm thu Tìm kiếm từ khóa, Debounce 300ms, Empty State và test pass.
   - **DỪNG LẠI, BÁO CÁO CHI TIẾT** và **HỎI Ý KIẾN USER** có muốn tiếp tục sang Phần 6 hay không.
3. **Cổng 3 (Hoàn thành Phần 6: Product Filter & Sort)**:
   - Nghiệm thu Lọc đa điều kiện, Sắp xếp, Phân trang URL và test suite tổng thể.
   - **DỪNG LẠI VÀ BÁO CÁO TỔNG THỂ TOÀN BỘ PHÂN HỆ MEMBER 2**.
