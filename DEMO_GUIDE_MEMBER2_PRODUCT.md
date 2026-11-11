# 🎬 Hướng Dẫn Demo & Thuyết Trình Chi Tiết — Member 2: Product

Tài liệu này hướng dẫn **từng thao tác demo trên màn hình** và **cách thuyết trình dễ hiểu** cho 3 phân hệ bạn phụ trách:
- **Mục 4:** Product Management (Quản lý sản phẩm)
- **Mục 5:** Product Search (Tìm kiếm sản phẩm)
- **Mục 6:** Product Filter & Sort (Lọc, Sắp xếp & Phân trang)

---

## 1. Hiểu Nhanh Bản Chất Để Giải Thích Cho Mọi Người

Trước khi bấm chuột demo, hãy tóm tắt ngắn gọn cấu trúc để người nghe (giảng viên hoặc thành viên nhóm) hình dung ngay bạn đã làm những gì:

| Thành phần | Chức năng thực tế | Vị trí trong code |
| :--- | :--- | :--- |
| **1. Trang Quản trị (`/admin/products`)** | Dành cho **Admin & Staff** để Xem, Thêm, Sửa, Xóa, Bật/Tắt hiển thị sản phẩm và Tìm kiếm/Lọc nhanh trong kho. | `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx` |
| **2. Trang Cửa hàng (`/products`)** | Dành cho **Khách hàng** duyệt danh mục thời trang, gõ tìm kiếm thông minh, lọc đa điều kiện, sắp xếp và chuyển trang. | `shop-project/frontend/src/pages/ProductsPage.jsx` |
| **3. Bộ não Backend (`getProducts`)** | Gom toàn bộ logic Search + Filter + Sort + Pagination + Phân quyền xem sản phẩm ẩn/hiện vào **1 controller duy nhất** để tối ưu tốc độ. | `shop-project/backend/src/controllers/productController.js` |
| **4. Bảo vệ RBAC** | Chặn Khách hàng (Customer) tự ý Thêm/Sửa/Xóa sản phẩm; chỉ Admin & Staff mới có quyền thao tác quản trị. | `shop-project/backend/src/routes/productRoutes.js` |

> **Cách nói dễ hiểu cho người không rành kỹ thuật:**
> *"Phân hệ của em lo toàn bộ vòng đời hiển thị của sản phẩm: từ lúc Admin/Nhân viên đăng sản phẩm lên kho, kiểm soát ẩn/hiện, cho tới lúc Khách hàng lên web gõ tìm kiếm, lọc theo túi tiền/danh mục và sắp xếp để tìm đúng món đồ mình cần."*

---

## 2. Chuẩn Bị Trước Khi Demo (Checklist 1 Phút)

1. **Đảm bảo Backend & Frontend đang chạy:**
   - Backend: `http://localhost:5000` (kết nối MongoDB thành công)
   - Frontend: `http://localhost:5173`
2. **Mở sẵn 2 cửa sổ trình duyệt cạnh nhau (hoặc 1 cửa sổ thường + 1 cửa sổ Ẩn danh):**
   - **Cửa sổ 1 (Admin):** Mở [http://localhost:5173/login](http://localhost:5173/login)
   - **Cửa sổ 2 (Khách hàng - Ẩn danh):** Mở [http://localhost:5173/products](http://localhost:5173/products)
3. **Bật sẵn DevTools (F12 → Tab Network → lọc `Fetch/XHR`)** ở Cửa sổ 2 để chút nữa chứng minh kỹ thuật **Debounce 300ms** cho giảng viên thấy bằng mắt.
4. **Tài khoản đăng nhập mặc định:**
   - **Admin:** `admin@shop.com` / `admin123`
   - **Staff:** `staff@shop.com` / `staff123`
   - **Customer:** `customer@shop.com` / `password123`
   *(Mẹo: Trên màn hình Login có sẵn 3 nút điền nhanh **Admin / Staff / Customer**, chỉ cần bấm là tự điền không cần gõ tay).*

> [!NOTE]
> Nếu bạn muốn demo tính năng **chọn file ảnh từ máy tính** đã hoàn thiện trên nhánh riêng, hãy đảm bảo đang chạy nhánh `feature/tram_CE191681_Product` (hoặc đã merge nhánh đó vào `main`).

---

## 3. Kịch Bản Demo Chi Tiết Từng Mục

### 🅰️ MỤC 4: PRODUCT MANAGEMENT (Quản Lý Sản Phẩm — Cửa sổ Admin)

**Đăng nhập:** Ở Cửa sổ 1, bấm nút điền nhanh **Admin** (`admin@shop.com`) → bấm **Đăng nhập** → ở Sidebar bên trái chọn **"Quản lý sản phẩm"** (`/admin/products`).

#### Bước 1: Giới thiệu bảng quản trị
- **Thao tác:** Cuộn nhẹ bảng sản phẩm cho mọi người quan sát các cột.
- **Lời thoại:**
  > *"Đây là màn hình quản lý sản phẩm dành riêng cho Admin và Staff. Mỗi dòng hiển thị ảnh đại diện, tên, thương hiệu, mã SKU, danh mục, giá bán kèm % giảm so với giá gốc, tình trạng tồn kho và trạng thái đang bán hay tạm ẩn."*

#### Bước 2: Demo Validate dữ liệu + Tạo sản phẩm mới (`POST /api/products`)
- **Thao tác:**
  1. Bấm nút **"+ Thêm Sản Phẩm Mới"**.
  2. Thử bấm **"Tạo Sản Phẩm"** ngay khi đang bỏ trống Tên sản phẩm → Hiện thông báo lỗi đỏ (`Vui lòng nhập tên sản phẩm`). *(Chứng minh có kiểm tra dữ liệu chặt chẽ, không cho lưu rác).*
  3. Nhập đầy đủ thông tin sản phẩm mẫu:
     - **Tên sản phẩm:** `Áo Khoác Bomber Gió Nam`
     - **Danh mục:** `Áo khoác` | **Thương hiệu:** `CLOSET`
     - **Giá bán (VND):** `350000` | **Giá gốc niêm yết:** `490000`
     - **Số lượng tồn kho:** `25`
     - **Tích chọn:** `Kích hoạt hiển thị sản phẩm`
     - **Ảnh sản phẩm:** Chọn file ảnh từ máy *(hoặc dán link ảnh)* → chỉ vào khung **Ảnh xem trước (Preview)**.
     - **Mô tả sản phẩm:** `Áo khoác gió 2 lớp nhẹ, chống thấm nhẹ, phù hợp mặc hằng ngày.`
  4. Bấm **"Tạo Sản Phẩm"**.
- **Kết quả:** Hiện Toast thông báo thành công màu xanh, sản phẩm lập tức nhảy lên đầu bảng kèm badge giảm giá `-29%`.

#### Bước 3: Demo 1-Click Ẩn/Hiện sản phẩm (`PUT /api/products/:id`)
- **Thao tác:**
  1. Ngay tại dòng `Áo Khoác Bomber Gió Nam`, bấm thẳng vào nút màu xanh **"Hoạt động"** ở cột Trạng thái.
  2. Nút lập tức đổi sang màu đỏ **"Tạm ẩn"** mà không cần mở form sửa hay tải lại trang.
  3. Quay sang **Cửa sổ 2 (Khách hàng `/products`)**, nhấn **F5** → Tìm `Bomber` → **Không thấy sản phẩm xuất hiện**.
  4. Quay lại **Cửa sổ 1**, bấm vào nút **"Tạm ẩn"** để bật lại **"Hoạt động"** → Sang Cửa sổ 2 nhấn **F5** → Sản phẩm hiện ra lại ngay lập tức.
- **Lời thoại giải thích dễ hiểu:**
  > *"Thay vì xóa mất sản phẩm hết mùa, Admin chỉ cần 1 click để tạm ẩn. Ở Backend, API `GET /api/products` sử dụng middleware `optionalAuth` để phân biệt người gọi: khách hàng chỉ thấy sản phẩm đang mở bán (`isActive: true`), còn Admin/Staff vẫn thấy toàn bộ để quản lý."*

#### Bước 4: Demo Chỉnh sửa & Xóa an toàn
- **Sửa:** Bấm icon **Cây bút (Chỉnh sửa)** → Đổi giá bán thành `320000` → Bấm **"Cập Nhật Sản Phẩm"** → Giá trên bảng cập nhật tức thì.
- **Xóa:** Bấm icon **Thùng rác** → Hộp thoại xác nhận **"Xác Nhận Xóa Sản Phẩm?"** bật lên:
  - Bấm **"Hủy Bỏ"** để chứng minh lỡ tay bấm nhầm vẫn an toàn.
  - Bấm lại icon Thùng rác → Chọn **"Xóa Vĩnh Viễn"** → Sản phẩm bị xóa khỏi bảng và tổng số sản phẩm giảm đi 1.

#### Bước 5: Demo Bảo mật phân quyền (RBAC)
- **Thao tác:** Dùng Cửa sổ 2 đăng nhập bằng tài khoản Khách hàng (`customer@shop.com` / `password123`), sau đó thử gõ thẳng lên thanh địa chỉ: `http://localhost:5173/admin/products`.
- **Kết quả:** Hệ thống lập tức chặn và điều hướng ra ngoài, không cho truy cập giao diện quản trị.
- **Lời thoại:**
  > *"Bảo mật được khóa 2 lớp: Frontend dùng `AdminRoute` chặn giao diện; Backend dùng `protect` và `isStaffOrAdmin` chặn các request `POST / PUT / DELETE`, nếu Customer cố gọi API bằng Postman sẽ bị trả về lỗi `403 Forbidden`."*

---

### 🅱️ MỤC 5: PRODUCT SEARCH (Tìm Kiếm Sản Phẩm — Cửa sổ Khách hàng)

Chuyển sang **Cửa sổ 2** ([http://localhost:5173/products](http://localhost:5173/products)), mở sẵn **F12 → Tab Network**.

#### Bước 1: Demo Debounce 300ms (Điểm kỹ thuật quan trọng)
- **Thao tác:**
  1. Xóa sạch log cũ trong Tab Network (bấm nút 🚫 Clear).
  2. Đặt chuột vào ô tìm kiếm, gõ nhanh liên tiếp từ khóa: `Oxford` (hoặc `Áo`).
  3. Chỉ cho mọi người nhìn vào **Network Tab**.
- **Kết quả quan sát:**
  - Trong suốt lúc bạn gõ 6 chữ cái `O-x-f-o-r-d`, Network Tab **đứng yên hoàn toàn, không hề gửi 6 request rác**.
  - Sau khi tay bạn ngừng gõ đúng **300ms**, chỉ có **duy nhất 1 request** `GET /api/products?page=1&limit=12&search=Oxford` được gửi đi.
- **Cách giải thích cho người nghe dễ hiểu:**
  > *"Nếu không có Debounce, mỗi lần khách gõ 1 chữ cái là server bị gọi 1 lần, 1000 người gõ sẽ gây nghẽn mạng. Em dùng kỹ thuật Debounce 300ms: hệ thống đợi khách ngừng gõ 0.3 giây mới gom từ khóa gửi lên server 1 lần duy nhất. Đồng thời ở Backend, từ khóa được làm sạch các ký tự đặc biệt (Regex escape) để tránh lỗi sập truy vấn (ReDoS), và tìm khớp không phân biệt hoa thường trên cả Tên sản phẩm, Mô tả và Thương hiệu."*

#### Bước 2: Demo Contextual Empty State (Khi không tìm thấy kết quả)
- **Thao tác:** Gõ một từ khóa chắc chắn không có, ví dụ `laptop999`.
- **Kết quả:**
  - Hiển thị khung thông báo lịch sự kèm chính từ khóa khách vừa gõ (*“laptop999”*) và nút **"Xóa bộ lọc / Xóa tìm kiếm"**.
  - Bấm vào nút đó (hoặc bấm dấu `X` trong ô tìm kiếm) → Danh sách sản phẩm quay về đầy đủ ngay lập tức.

---

### 🅲 MỤC 6: PRODUCT FILTER & SORT (Lọc, Sắp Xếp & Đồng Bộ URL)

Tiếp tục trên **Cửa sổ 2** (`/products`).

#### Bước 1: Lọc đa điều kiện kết hợp (Multi-condition Filter)
- **Thao tác lần lượt ở thanh Sidebar bên trái:**
  1. **Danh mục:** Bấm chọn **`Áo`** → Danh sách chỉ còn các sản phẩm thuộc mục Áo.
  2. **Khoảng giá:**
     - Bấm thử nút chọn nhanh **`300k - 600k ₫`** (hoặc tự gõ Tối thiểu `200000`, Tối đa `500000` rồi bấm **Áp dụng**).
  3. **Tồn kho:** Tích chọn **`Chỉ hiển thị còn hàng`** (`inStock=true`) → Các sản phẩm có `stock = 0` bị loại bỏ ngay.

#### Bước 2: Sắp xếp (`sortBy`) & Phân trang (`page`)
- **Thao tác:** Ở góc trên bên phải danh sách sản phẩm, đổi dropdown Sắp xếp:
  1. Chọn **`Giá: Thấp đến Cao`** (`price_asc`) → Chỉ vào giá các sản phẩm đang tăng dần từ trái sang phải, từ trên xuống dưới.
  2. Chọn **`Giá: Cao đến Thấp`** (`price_desc`) → Giá đảo ngược giảm dần.
  3. Chỉ ra các lựa chọn khác: `Mới nhất`, `Đánh giá cao nhất`, `Tên: A đến Z`.
  4. *(Nếu có nhiều hơn 12 sản phẩm)*: Bấm sang **Trang 2** ở cuối danh sách → Trang cuộn mượt lên đầu lưới sản phẩm.

#### Bước 3: Chứng minh Đồng Bộ URL (Single Source of Truth) — Phần Ăn Điểm Cao Nhất
- **Thao tác:**
  1. Sau khi đang chọn lọc (`Áo` + Giá + Còn hàng + Giá Thấp đến Cao), **chỉ chuột lên thanh địa chỉ trình duyệt**. Mọi người sẽ thấy URL tự động biến thành:
     `http://localhost:5173/products?category=Áo&minPrice=200000&maxPrice=500000&inStock=true&sortBy=price_asc`
  2. **Nhấn F5 (Tải lại trang):** Tất cả bộ lọc và kết quả **không bị mất đi**, giữ nguyên y hệt như trước khi tải lại.
  3. **Copy đường link này mở sang một tab mới:** Mở ra đúng ngay kết quả đang lọc.
  4. **Bấm nút Back (←) trên trình duyệt:** Bộ lọc tự động lùi lại trạng thái trước đó.
  5. Cuối cùng bấm nút **"Đặt lại"** (màu đỏ ở góc trên Sidebar) → URL quay về sạch sẽ `/products` và xóa các tham số mặc định.
- **Cách giải thích dễ hiểu:**
  > *"Thay vì chỉ lưu bộ lọc trong bộ nhớ tạm (`useState`) khiến bấm F5 bị mất sạch, em lấy thanh địa chỉ URL làm nguồn sự thật duy nhất (`useSearchParams`). Mọi thao tác bấm lọc hay sắp xếp đều ghi lên URL, và khi URL đổi thì giao diện tự gọi API cập nhật lại. Nhờ vậy khách hàng có thể F5 thoải mái, bấm Back/Forward trình duyệt hoặc copy link gửi cho bạn bè xem đúng sản phẩm mình đang lọc."*

---

## 4. Cấu Trúc Bài Thuyết Trình Mẫu (3 – 5 Phút)

Bạn có thể nói đúng theo khung 4 ý sau để mạch lạc và không bị sót:

1. **Mở đầu (20 giây):**
   *"Chào thầy/cô và các bạn, em là [Tên bạn], phụ trách phân hệ Member 2 – Product gồm 3 phần: Quản lý sản phẩm cho Admin/Staff, Tìm kiếm, và Lọc/Sắp xếp cho Khách hàng."*
2. **Demo Admin — Mục 4 (1.5 phút):**
   *"Đầu tiên ở góc độ Admin/Staff..."* → Thực hiện Tạo mới (có validate lỗi) → Đổi trạng thái 1-click và kiểm tra bên tab Khách → Sửa & Xóa có hộp thoại xác nhận → Demo Customer bị chặn khi vào `/admin/products`.
3. **Demo Khách hàng — Mục 5 & 6 (1.5 phút):**
   *"Chuyển sang góc độ Khách hàng..."* → Bật Network Tab gõ tìm kiếm để chứng minh Debounce 300ms & Empty State → Lọc kết hợp Danh mục + Khoảng giá + Còn hàng + Sắp xếp → Nhấn F5 & bấm nút Back để chứng minh đồng bộ URL.
4. **Kết thúc & Kiến trúc (30 giây):**
   *"Về mặt kỹ thuật, toàn bộ Search, Filter, Sort và Phân trang ở Backend được gom gọn trong duy nhất 1 hàm `getProducts` giúp code tối giản, không trùng lặp và dễ bảo trì. Em xin kết thúc phần trình bày, mời thầy/cô đặt câu hỏi ạ."*

---

## 5. Bộ Câu Hỏi Phản Biện Thường Gặp (Q&A)

| Câu hỏi của Giảng viên | Cách trả lời ngắn gọn, trúng trọng tâm |
| :--- | :--- |
| **1. Vì sao không viết riêng API `/search`, `/filter`, `/sort` mà gộp chung vào `GET /api/products`?** | Vì trong thực tế khách hàng thường **vừa gõ tìm kiếm, vừa lọc danh mục, vừa chọn khoảng giá và sắp xếp cùng một lúc**. Nếu tách API sẽ không kết hợp được các điều kiện với nhau. Gom vào `getProducts` giúp xây dựng một câu query MongoDB tổng hợp (`$and` các điều kiện) chỉ trong 1 lần gọi DB. |
| **2. Nếu khách gõ các ký tự đặc biệt như `.*+?` vào ô tìm kiếm thì sao?** | Ở `productController.js`, em đã sanitize chuỗi tìm kiếm (loại bỏ ký tự null `\0` và escape toàn bộ metacharacter của Regex) trước khi đưa vào `$regex` của MongoDB, đảm bảo không bị crash server hay tấn công ReDoS. |
| **3. Làm sao đảm bảo khách hàng không sửa/xóa được sản phẩm của shop?** | Ở Frontend có component `AdminRoute` chỉ cho role `admin` và `staff`. Ở Backend, các route `POST`, `PUT`, `DELETE` đều phải đi qua 2 lớp middleware `protect` (kiểm tra JWT hợp lệ) và `isStaffOrAdmin` (kiểm tra đúng vai trò), nếu là `customer` sẽ trả về HTTP `403`. |
| **4. Tại sao trên URL không hiện `?category=Tất cả&page=1` khi mới vào trang?** | Trong hàm `updateParams`, em chủ động loại bỏ (`updated.delete(key)`) các giá trị mặc định như `Tất cả`, `all`, chuỗi rỗng hoặc `page=1` để đường link trên trình duyệt luôn ngắn gọn, sạch đẹp. |
| **5. Có viết Unit/Integration Test cho phần này chưa?** | Dạ có. Em đã kiểm thử tự động các luồng render bảng, modal CRUD, 1-click toggle, debounce 300ms, lọc và đồng bộ URL bằng Vitest & Testing Library (`AdminProductsPage.test.jsx`, `ProductsPage.test.jsx`, `ProductSearch.test.jsx`) cũng như kiểm thử API Backend bằng Jest/Supertest (`product.test.js`, `product-search.test.js`, `product-filter-sort.test.js`). |

