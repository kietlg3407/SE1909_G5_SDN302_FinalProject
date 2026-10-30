# Original User Request

## 2026-10-30T09:09:37Z

Triển khai toàn diện phân hệ Member 2: Product gồm 3 tính năng chính (Product Management, Product Search, Product Filter & Sort) cho hệ thống Shop Quần Áo (Node.js/Express/MongoDB Mongoose + React 19/Vite). Toàn bộ mã nguồn tuân thủ triết lý viết code tối thiểu (Minimal Code Principle), gom gọn logic và chỉ dừng lại báo cáo tổng thể sau mỗi tính năng chính.

Working directory: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject
Integrity mode: development

---

## Requirements

### R1. Product Management (Quản lý sản phẩm CRUD)
- **Backend API**: Cung cấp các RESTful endpoint `/api/products` (GET danh sách phân trang, GET chi tiết, POST tạo mới, PUT cập nhật, DELETE xóa). Áp dụng middleware `protect` và `isStaffOrAdmin` cho POST/PUT/DELETE.
- **Frontend Admin**: Xây dựng trang `/admin/products` với bảng hiển thị danh sách sản phẩm, modal tạo mới/chỉnh sửa, chuyển đổi trạng thái hoạt động nhanh và liên kết trên thanh điều hướng Admin Sidebar.
- **Frontend Catalog**: Hiển thị lưới sản phẩm công khai tại `/products` với hình ảnh, giá, nhãn giảm giá và danh mục.

### R2. Product Search (Tìm kiếm sản phẩm)
- **Search Query**: Tích hợp tìm kiếm từ khóa không phân biệt hoa thường (regex/text index) vào controller `getProducts` xử lý qua tham số `search`.
- **Search UI & UX**: Ô tìm kiếm có tính năng debounce 300ms, nút xóa từ khóa nhanh, hiển thị trạng thái đang tìm kiếm và thông báo giao diện khi không tìm thấy kết quả ("Empty state").

### R3. Product Filter & Sort (Lọc đa điều kiện, Sắp xếp & Phân trang)
- **Multi-Filter**: Lọc sản phẩm theo danh mục (`category`), khoảng giá (`minPrice`, `maxPrice`), và trạng thái tồn kho (`inStock`).
- **Sort & Pagination**: Sắp xếp theo giá tăng/giảm, mới nhất, đánh giá cao. Phân trang mượt mà kèm đồng bộ trạng thái lên URL search parameters (`useSearchParams`).

### R4. Minimal Code & Core Architecture
- Không sinh mã boilerplate thừa, không tạo class trung gian không cần thiết.
- Tái sử dụng tối đa: Axios instance `api.js`, bảng màu và utility classes có sẵn trong `index.css`, thư viện icon `lucide-react`.
- Gom toàn bộ truy vấn Search, Filter, Sort và Pagination vào duy nhất 1 endpoint/controller `getProducts`.

### R5. Quy trình 3 Cổng Kiểm soát & Báo cáo Tổng thể
- **Cổng 1**: Hoàn thành & test pass chức năng chính **Product Management** -> DỪNG LẠI VÀ BÁO CÁO TỔNG THỂ.
- **Cổng 2**: Hoàn thành & test pass chức năng chính **Product Search** -> DỪNG LẠI VÀ BÁO CÁO TỔNG THỂ.
- **Cổng 3**: Hoàn thành & test pass chức năng chính **Product Filter & Sort** -> DỪNG LẠI VÀ BÁO CÁO TỔNG THỂ TOÀN DỰ ÁN.

---

## Default Test Accounts & Verification Resources

### Bộ Tài Khoản Kiểm Thử Bắt Buộc:
- **Admin**: `admin@shop.com` / `admin123` (Toàn quyền CRUD)
- **Staff**: `staff@shop.com` / `staff123` (Tạo, cập nhật sản phẩm & kho)
- **Customer**: `customer@shop.com` / `password123` (Chỉ xem, tìm kiếm, lọc; bị từ chối 403 khi thao tác quản trị)

### Verification Mechanisms:
- **Backend automated test suite**: `npm --prefix shop-project/backend test -- tests/product.test.js`
- **Frontend automated test suite**: `npm --prefix shop-project/frontend test -- src/pages/admin/AdminProductsPage.test.jsx src/pages/ProductsPage.test.jsx --run`

---

## Acceptance Criteria

### Verification & Quality Guardrails:
- [ ] Mongoose Schema `productModel.js` định nghĩa đúng và đủ các trường thiết yếu (`name`, `description`, `price`, `originalPrice`, `category`, `brand`, `stock`, `images`, `rating`, `isActive`).
- [ ] Phân quyền RBAC chính xác: `admin` và `staff` thực hiện CRUD thành công; `customer` hoặc khách chưa đăng nhập bị chặn 401/403 khi gọi POST/PUT/DELETE.
- [ ] Toàn bộ test suite tự động cho Backend và Frontend chạy thành công 100% không có lỗi.
- [ ] Giao diện Admin quản lý sản phẩm trực quan, modal mượt mà, tích hợp chuẩn xác với Admin Sidebar.
- [ ] Tìm kiếm từ khóa phản hồi nhanh với debounce 300ms, hiển thị empty state khi không có kết quả.
- [ ] Bộ lọc đa điều kiện kết hợp sắp xếp và phân trang hoạt động đồng bộ với URL query params.
- [ ] Code tối giản, sạch sẽ, không có console log thừa hay dead code.
- [ ] Tuân thủ dừng lại và báo cáo tổng thể đúng theo từng cổng kiểm soát.

## Follow-up — 2026-10-30T09:13:28Z

[CẬP NHẬT QUAN TRỌNG TỪ USER]:
Người dùng đã yêu cầu: BỎ báo cáo dừng lại tại Cổng 1 (Product Management) và Cổng 2 (Product Search). Chỉ DỪNG LẠI và BÁO CÁO TỔNG THỂ tại CỔNG 3 sau khi hoàn tất toàn bộ cả 3 phần (Product Management, Product Search, Product Filter & Sort).
Đội ngũ hãy tiến hành thực thi liên tục và thông suốt qua cả 3 phần, đảm bảo tuân thủ nguyên tắc viết code tối thiểu, và kiểm thử xanh 100% bằng 3 tài khoản mặc định (admin@shop.com, staff@shop.com, customer@shop.com) trước khi dừng lại báo cáo tổng thể tại Cổng 3.

## Follow-up — 2026-10-30T09:16:03Z

[CHỈ THỊ ĐIỀU CHỈNH QUAN TRỌNG TỪ USER - ÁP DỤNG NGAY LẬP TỨC]:
Người dùng đã chốt quy trình cổng kiểm soát chính xác như sau:
1. Khi hoàn thành PHẦN 4: Product Management (CRUD Admin, phân quyền Staff/Admin, Catalog khách hàng) và chạy test pass:
   => BẮT BUỘC PHẢI DỪNG LẠI, gửi báo cáo chi tiết về cho PM để PM hỏi ý kiến User xem có muốn tiếp tục sang Phần 5 hay không.
   => TUYỆT ĐỐI KHÔNG TỰ ĐỘNG THỰC THI PHẦN 5 khi chưa có sự xác nhận của User.
2. Tương tự, sau khi User đồng ý và hoàn thành PHẦN 5: Product Search:
   => DỪNG LẠI, báo cáo và hỏi ý kiến User trước khi sang Phần 6.
3. Sau khi hoàn thành PHẦN 6: Product Filter & Sort:
   => DỪNG LẠI và Báo cáo tổng thể toàn bộ phân hệ Member 2.
