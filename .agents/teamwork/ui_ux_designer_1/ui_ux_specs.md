# UI/UX Specifications: Product Module (Member 2)
**Project**: Shop Quần Áo - Fashion E-Commerce System  
**Author**: Sub-agent UI/UX Designer  
**Scope**: Gate 1 (Product Management), Gate 2 (Product Search), Gate 3 (Product Filter, Sort & URL Sync)  
**Status**: APPROVED SPECIFICATION  

---

## 1. Design Philosophy & Minimal Code Principle

In strict accordance with the **Minimal Code Principle** (`AGENTS.md`) and project conventions:
- **Zero Bloat**: No heavy external UI libraries (e.g., no Material UI, no Ant Design). Everything relies on React native hooks, existing CSS design tokens in `shop-project/frontend/src/index.css`, and `lucide-react` icons.
- **Maximum Reusability**:
  - Reuses modal classes (`.modal-backdrop`, `.modal-card`, `.modal-header`, `.modal-form`, `.modal-actions`, `.modal-close-btn`).
  - Reuses button tokens (`.btn-primary`, `.btn-secondary`, `.icon-action-btn.edit-btn`, `.icon-action-btn.delete-btn`).
  - Reuses layout shells (`.admin-app-layout`, `.admin-main-content`, `.home-container`).
  - Uses existing color tokens: `--primary: #0f172a`, `--primary-hover: #1e293b`, `--card-bg: #ffffff`, `--card-border: #e2e8f0`, `--text-main: #0f172a`, `--text-muted: #64748b`, `--danger: #ef4444`, `--success: #10b981`.
- **Responsive Layout**: Fluid experience across Desktop (>= 1024px), Tablet (768px - 1023px), and Mobile (< 768px).
- **Accessibility & UX**: Clear ARIA labels, semantic HTML tables (`caption`, `th scope="col"`, `td`), keyboard navigation (Escape to close modals), live feedback, and loading skeletons/spinners.

---

## 2. Gate 1: Admin Products Management (`/admin/products`)

### 2.1 Navigation & Admin Sidebar Link
- **Sidebar item**: Added to `shop-project/frontend/src/components/admin/Sidebar.jsx`:
  ```javascript
  {
    label: 'Quản lý sản phẩm',
    path: '/admin/products',
    icon: Package, // from 'lucide-react'
    roles: ['admin', 'staff'],
  }
  ```
- **Active state**: Uses `.admin-sidebar-link-active` (white background, primary text, subtle shadow).

---

### 2.2 Page Layout & Header Toolbar

#### ASCII Wireframe: Admin Products Page (`/admin/products`)
```text
+----------------------------------------------------------------------------------------------------+
|  ADMIN HEADER: CLOSETSTUDIO                                              [Admin: admin@shop.com]   |
+---------------------+------------------------------------------------------------------------------+
| SIDEBAR             | BREADCRUMB: Administration > Quản lý sản phẩm                                |
| - Dashboard         |                                                                              |
| - Quản lý người dùng| Quản Lý Sản Phẩm                                     [+ Thêm Sản Phẩm Mới]   |
| - Quản lý coupon    | Quản lý thông tin, giá bán, tồn kho và trạng thái hiển thị của các sản phẩm. |
| - Quản lý sản phẩm* |                                                                              |
|                     | +--------------------------------------------------------------------------+ |
|                     | | TOOLBAR:                                                                 | |
|                     | | [Search: Nhập tên, thương hiệu, danh mục... ] [Danh mục: Tất cả v]       | |
|                     | | [Trạng thái: Tất cả v]                                   [(R) Làm mới]  | |
|                     | +--------------------------------------------------------------------------+ |
|                     |                                                                              |
|                     | +--------------------------------------------------------------------------+ |
|                     | | DANH SÁCH SẢN PHẨM (Tổng: 24 sản phẩm)                                  | |
|                     | +------+--------------------+-----------+-----------------+------+----+-----+ |
|                     | | Ảnh  | Tên & Thương hiệu  | Danh mục  | Giá bán / Gốc   | Kho  | TT | HĐ  | |
|                     | +------+--------------------+-----------+-----------------+------+----+-----+ |
|                     | | [IMG]| Áo Sơ Mi Oxford    | Áo        | 299.000 ₫       | 45   | ON |E | D| |
|                     | |      | CLOSET - SKU: 101  |           | (399.000 ₫ -25%)|      |    |     | |
|                     | +------+--------------------+-----------+-----------------+------+----+-----+ |
|                     | | [IMG]| Quần Jean Slimfit  | Quần      | 450.000 ₫       | 0    | OFF|E | D| |
|                     | |      | CLOSET - SKU: 102  |           |                 | [HẾT]|    |     | |
|                     | +------+--------------------+-----------+-----------------+------+----+-----+ |
|                     | | [IMG]| Đầm Dạ Hội Lụa     | Váy       | 890.000 ₫       | 8    | ON |E | D| |
|                     | |      | CLOSET - SKU: 103  |           | (990.000 ₫ -10%)| [Ít] |    |     | |
|                     | +------+--------------------+-----------+-----------------+------+----+-----+ |
|                     |                                                                              |
|                     | PHÂN TRANG: [ < Trước ]  [ 1 ]  [ 2 ]  [ 3 ]  [ Sau > ]  (Trang 1 / 3)       |
+---------------------+------------------------------------------------------------------------------+
```

### 2.3 Table Columns & Data Attributes
1. **Ảnh (Thumbnail)**:
   - Size: `44px x 44px`, `border-radius: 8px`, `object-fit: cover`, `border: 1px solid #e2e8f0`.
   - Fallback: When image fails to load or empty, displays placeholder container with `Package` icon in `#94a3b8`.
2. **Tên & Thương hiệu**:
   - Product name: `font-size: 14px; font-weight: 700; color: #0f172a`.
   - Brand & ID: `font-size: 12px; color: #64748b; margin-top: 2px` (e.g. `CLOSET • SKU: 6721...`).
3. **Danh mục (Category)**:
   - Badge style: `background: #f1f5f9; color: #334155; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; border: 1px solid #e2e8f0`.
4. **Giá bán & Giá gốc (Price & Original Price)**:
   - Current price: `font-size: 14px; font-weight: 700; color: #0f172a` (e.g. `299.000 ₫`).
   - Original price (if `originalPrice > price`): `font-size: 12px; color: #94a3b8; text-decoration: line-through; margin-right: 6px`.
   - Discount badge: `font-size: 11px; font-weight: 700; background: #fee2e2; color: #dc2626; padding: 1px 5px; border-radius: 4px` (e.g. `-25%`).
5. **Kho hàng (Stock Count)**:
   - If `stock === 0`: `<span className="stock-badge stock-empty">Hết hàng (0)</span>` (`background: #fef2f2; color: #dc2626; border: 1px solid #fecaca`).
   - If `stock > 0 && stock <= 10`: `<span className="stock-badge stock-low">{stock} (Sắp hết)</span>` (`background: #fffbeb; color: #d97706; border: 1px solid #fde68a`).
   - If `stock > 10`: `<span className="stock-badge stock-good">{stock}</span>` (`background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0`).
6. **Trạng thái (Active Toggle Button)**:
   - 1-click status toggle button matching `AdminUsersPage.jsx`:
     - Active (`isActive: true`): Green pill button with `CheckCircle2` icon (14px) and text "Hoạt động".
     - Inactive (`isActive: false`): Red pill button with `XCircle` icon (14px) and text "Tạm ẩn".
     - Loading state during mutation: Disabled with `RefreshCw` spin icon.
7. **Hành động (Actions)**:
   - Container: Flex row with 8px gap.
   - Edit button: `.icon-action-btn.edit-btn` (`width: 32px; height: 32px; border: 1px solid #e2e8f0; border-radius: 8px`), contains `Edit3` (15px).
   - Delete button: `.icon-action-btn.delete-btn` (`width: 32px; height: 32px; border: 1px solid #e2e8f0; border-radius: 8px`), contains `Trash2` (15px). Hover red.

---

### 2.4 CRUD Modal: Add & Edit Product

#### ASCII Wireframe: Add/Edit Product Modal
```text
+--------------------------------------------------------------------------+
|  Thêm Sản Phẩm Mới                                                   [X] |
+--------------------------------------------------------------------------+
|  Tên sản phẩm *                                                          |
|  [ Áo Sơ Mi Nam Oxford Cổ Đức Dài Tay                          ]         |
|                                                                          |
|  Danh mục *                           Thương hiệu                        |
|  [ Áo                          v ]    [ CLOSET                         ] |
|                                                                          |
|  Giá bán (VND) *                      Giá gốc niêm yết (VND)             |
|  [ 299000                        ]    [ 399000                         ] |
|                                                                          |
|  Số lượng tồn kho *                   Trạng thái                         |
|  [ 50                            ]    [x] Kích hoạt hiển thị sản phẩm    |
|                                                                          |
|  Đường dẫn ảnh (URL)                                                     |
|  [ https://images.unsplash.com/photo-example...                ]         |
|  Preview: +--------+                                                     |
|           | [IMG]  | (Ảnh xem trước)                                     |
|           +--------+                                                     |
|                                                                          |
|  Mô tả sản phẩm *                                                        |
|  +--------------------------------------------------------------------+  |
|  | Chất liệu 100% cotton dệt chéo cao cấp, thấm hút mồ hôi tốt.      |  |
|  | Phom áo Regular fit thoải mái, đường may tỉ mỉ sắc nét.           |  |
|  +--------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
|                                              [ Hủy Bỏ ]  [ Lưu Sản Phẩm ]|
+--------------------------------------------------------------------------+
```

#### Modal Specs & Validation Rules:
- **Container Structure**:
  - Backdrop: `.modal-backdrop` (`background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px)`).
  - Card: `.modal-card` (`max-width: 580px; background: #fff; border-radius: 16px; box-shadow: var(--shadow-xl)`).
  - Header: `.modal-header` with Title `h3` ("Thêm Sản Phẩm Mới" or "Chỉnh Sửa Sản Phẩm") and `.modal-close-btn`.
- **Form Controls & Constraints**:
  - `name`: String, required, trim, minlength 2, maxlength 150.
  - `category`: String, required. Dropdown options: `Áo`, `Quần`, `Váy`, `Áo khoác`, `Phụ kiện`, `Giày dép`, `Khác`.
  - `brand`: String, optional, default "CLOSET".
  - `price`: Number, required, >= 0. Formatted placeholder `0 ₫`.
  - `originalPrice`: Number, optional, >= 0. If provided and `< price`, show visual hint ("Giá gốc nên lớn hơn giá bán để hiển thị giảm giá").
  - `stock`: Number, required, integer >= 0.
  - `images`: String (URL), optional. Can support comma-separated list or single URL. Renders a small 56x56 thumbnail preview if valid URL.
  - `description`: Textarea, required, 3 rows, minlength 5.
  - `isActive`: Boolean checkbox, default `true`.
- **Buttons**:
  - Cancel: `<button type="button" className="btn-secondary">Hủy Bỏ</button>`.
  - Submit: `<button type="submit" className="btn-primary" disabled={submitting}>` (with loading spinner if submitting).

---

### 2.5 Delete Confirmation Dialog

#### ASCII Wireframe: Delete Dialog
```text
+--------------------------------------------------------------+
|  Xác Nhận Xóa Sản Phẩm?                                  [X] |
+--------------------------------------------------------------+
|   /\  Bạn có chắc chắn muốn xóa sản phẩm này không?          |
|  /!!\                                                        |
|  ---- "Áo Sơ Mi Nam Oxford Cổ Đức Dài Tay"                   |
|                                                              |
|  Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi cơ sở dữ liệu  |
|  và không thể khôi phục lại.                                 |
+--------------------------------------------------------------+
|                                     [ Hủy Bỏ ]  [ Xóa Vĩnh Viễn ]
+--------------------------------------------------------------+
```
- **Markup Tokens**:
  - Backdrop: `.modal-backdrop`.
  - Card: `.modal-card` (`max-width: 440px`).
  - Warning Icon: `AlertTriangle` in `#dc2626`.
  - Confirm Button: Red action button (`background: #dc2626; color: #fff; padding: 10px 18px; border-radius: 8px`).
  - Cancel Button: `.btn-secondary`.

---

## 3. Gate 1: Public Products Catalog (`/products`)

### 3.1 Page Layout Architecture
- Standard Customer layout with top `Navbar` and bottom `Footer`.
- Container: `.home-container` (max-width: 1200px, padding: 30px 24px 60px).
- Main Grid: 2-column layout:
  - **Left Sidebar**: 260px sticky filter panel (Desktop) / collapsible on Mobile.
  - **Right Content**: Search bar header, sorting dropdown, product cards responsive grid, and pagination.

#### ASCII Wireframe: Public Products Catalog (`/products`)
```text
+----------------------------------------------------------------------------------------------------+
| NAVBAR: CLOSETSTUDIO       [Trang Chủ]  [Sản Phẩm*]                     [Cart (0)] [Đăng nhập]     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  BỘ SƯU TẬP THỜI TRANG                                                                             |
|  Khám phá phong cách thời thượng với các thiết kế tối giản, tinh tế. (Hiển thị 24 sản phẩm)        |
|                                                                                                    |
| +-------------------------+ +--------------------------------------------------------------------+ |
| | BỘ LỌC TÌM KIẾM         | | [ Q Tìm kiếm theo tên sản phẩm, thương hiệu...              [X] ]  | |
| |                         | | Sắp xếp: [ Mới nhất v ]                       Hiển thị: 1-12 của 24 | |
| | DANH MỤC:               | +--------------------------------------------------------------------+ |
| | (o) Tất cả              |                                                                        |
| | ( ) Áo (12)             | +------------------+  +------------------+  +------------------+       |
| | ( ) Quần (6)            | | [IMG - 1:1]      |  | [IMG - 1:1]      |  | [IMG - 1:1]      |       |
| | ( ) Váy (4)             | | [-25%]     [Áo]  |  | [HẾT HÀNG] [Quần]|  | [-10%]     [Váy] |       |
| | ( ) Áo khoác (2)        | |                  |  |                  |  |                  |       |
| |                         | | CLOSET           |  | CLOSET           |  | CLOSET           |       |
| | KHOẢNG GIÁ (VND):       | | Áo Sơ Mi Oxford  |  | Quần Jean Slimfit|  | Đầm Dạ Hội Lụa   |       |
| | [ 0       ] - [ 1000000]| | ***** (5.0)      |  | ***** (4.8)      |  | ***** (5.0)      |       |
| | [ Áp dụng giá ]         | | 299.000 ₫        |  | 450.000 ₫        |  | 890.000 ₫        |       |
| |                         | | 399.000 ₫        |  | Hết hàng         |  | 990.000 ₫        |       |
| | TÌNH TRẠNG KHO:         | | [Xem Chi Tiết]   |  | [Xem Chi Tiết]   |  | [Xem Chi Tiết]   |       |
| | [x] Chỉ hiện còn hàng   | +------------------+  +------------------+  +------------------+       |
| |                         |                                                                        |
| | [ Đặt lại bộ lọc ]      | PHÂN TRANG: [ < Trước ]  [ 1 ]  [ 2 ]  [ Sau > ]                       |
| +-------------------------+                                                                        |
+----------------------------------------------------------------------------------------------------+
| FOOTER: CLOSETSTUDIO © 2026. All rights reserved.                                                  |
+----------------------------------------------------------------------------------------------------+
```

---

### 3.2 Product Card Anatomy (`.product-card`)

#### ASCII Wireframe: Product Card Anatomy
```text
+-----------------------------------+
|  +-----------------------------+  |  <- Image Container (aspect-ratio 1 / 1 or 4 / 5)
|  | [-25%]                [ Áo ]|  |  <- Top Badges: Discount (left, red) & Category (right, white)
|  |                             |  |
|  |                             |  |  <- Product Image (smooth zoom on hover)
|  |                             |  |
|  |   [ HẾT HÀNG OVERLAY ]      |  |  <- Out of stock overlay badge if stock <= 0
|  +-----------------------------+  |
|  CLOSET                           |  <- Brand (11px, uppercase, text-muted, font-weight 700)
|  Áo Sơ Mi Nam Oxford Cổ Đức...    |  <- Product Name (15px, font-weight 700, 2-line clamp)
|  [★ ★ ★ ★ ★] 5.0 (12)             |  <- Star rating snippet
|  299.000 ₫   399.000 ₫            |  <- Price (bold 16px) & Strikethrough Original Price
|  (•) Còn hàng (50 sản phẩm)       |  <- Stock Status badge (green dot / red dot)
|  +-----------------------------+  |
|  |       [ Xem Chi Tiết ]      |  |  <- Action Button (.btn-secondary or .btn-primary)
|  +-----------------------------+  |
+-----------------------------------+
```

#### Detailed Element Specifications:
- **Card Wrapper**:
  - `background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: all 0.25s ease; display: flex; flex-direction: column`.
  - Hover: `transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: #cbd5e1`.
- **Image Box**:
  - `position: relative; width: 100%; aspect-ratio: 1 / 1; overflow: hidden; background: #f8fafc`.
  - Image: `width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease`.
  - Hover: `transform: scale(1.05)`.
- **Badges**:
  - Discount Tag: `position: absolute; top: 10px; left: 10px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3)`.
  - Category Badge: `position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); color: #0f172a; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(226, 232, 240, 0.8)`.
  - Out of Stock Banner: `position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em`.
- **Card Body**:
  - Padding: `16px; display: flex; flex-direction: column; flex: 1; gap: 8px`.
  - Brand: `font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase`.
  - Title: `font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.4; height: 38px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical`.
  - Rating: Rating stars in `#f59e0b` with rating value e.g. `5.0`.
  - Price: `display: flex; align-items: baseline; gap: 8px; margin-top: auto`.
    - Main price: `font-size: 16px; font-weight: 800; color: #0f172a`.
    - Strikethrough price: `font-size: 13px; color: #94a3b8; text-decoration: line-through`.
  - Stock badge:
    - In stock: `display: flex; align-items: center; gap: 6px; font-size: 12px; color: #16a34a; font-weight: 600`.
    - Out of stock: `display: flex; align-items: center; gap: 6px; font-size: 12px; color: #dc2626; font-weight: 600`.
- **Action Button**:
  - Full-width button: `.btn-secondary` (`padding: 8px 14px; font-size: 13px; font-weight: 600; width: 100%; border-radius: 8px`). Hover turns darker or active.

---

### 3.3 Empty State Design (`.empty-state-box`)

#### ASCII Wireframe: Empty State Box
```text
+--------------------------------------------------------------------------+
|                                                                          |
|                           [  ShoppingBag / SearchX  ]                    |
|                                                                          |
|                     Không Tìm Thấy Sản Phẩm Nào                          |
|         Rất tiếc, hiện tại không có sản phẩm nào phù hợp với             |
|         tiêu chí tìm kiếm và bộ lọc của bạn. Vui lòng thử lại!           |
|                                                                          |
|                          [  Xóa Tất Cả Bộ Lọc  ]                         |
|                                                                          |
+--------------------------------------------------------------------------+
```
- Reuses `.empty-state-box` from `index.css`:
  - `border: 2px dashed #cbd5e1; border-radius: 16px; padding: 60px 24px; text-align: center`.
  - Icon: `ShoppingBag` or `Search` (48px, color: `#94a3b8`).
  - Heading: `font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 16px; margin-bottom: 8px`.
  - Description: `font-size: 14px; color: #64748b; max-width: 420px; margin: 0 auto 20px`.
  - Action: Button "Xóa Tất Cả Bộ Lọc" (`.btn-primary`).

---

## 4. Gate 2: Product Search UX Specifications

### 4.1 Search Bar Component Anatomy
- **Input Field**:
  - Leading Icon: `Search` (18px, `#94a3b8`) positioned absolute at `left: 14px`.
  - Input: `padding: 12px 40px 12px 42px; border: 1px solid #cbd5e1; border-radius: 10px; background: #ffffff; width: 100%; font-size: 14px`.
  - Focus: `border-color: #0f172a; box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1)`.
- **Instant Clear Button**:
  - Button with `X` icon (16px) positioned at `right: 12px`.
  - Appears only when input has non-empty text.
  - Clicking clears the input immediately and resets query state.
- **Loading Spinner**:
  - When actively debouncing or fetching API, displays `RefreshCw` spin icon in place of clear button.

### 4.2 300ms Debounce Interaction Logic
```javascript
// State flow for Search Debounce:
// [User types character] -> [Local input state updates instantly for 60fps typing]
//                        -> [Timer cleared and restarted for 300ms]
//                        -> [After 300ms idle] -> [Sync to URL query params ?search=...]
//                                              -> [Trigger API call with new search query]
//                        -> [Page reset to 1]
```
- **Live Search Feedback**:
  - Shows result bar: "Tìm kiếm: **'áo sơ mi'** — Tìm thấy 6 kết quả".
  - If no results found, displays specialized Search Empty State with "Xóa từ khóa tìm kiếm" button.

---

## 5. Gate 3: Product Filter, Sort & URL Sync Specifications

### 5.1 Filter Panel Specifications
1. **Danh mục (Category Filter)**:
   - Radio buttons or pill tags: `Tất cả`, `Áo`, `Quần`, `Váy`, `Áo khoác`, `Phụ kiện`.
   - Selecting a category immediately updates query `category=<category>` and resets `page=1`.
2. **Khoảng giá (Price Range Filter)**:
   - Inputs: Min Price (`minPrice`) and Max Price (`maxPrice`) in VND.
   - Quick price chips:
     - `Dưới 300.000 ₫` (`maxPrice=300000`)
     - `300.000 ₫ - 600.000 ₫` (`minPrice=300000&maxPrice=600000`)
     - `Trên 600.000 ₫` (`minPrice=600000`)
   - "Áp dụng giá" button to trigger filter.
3. **Trạng thái tồn kho (In Stock Filter)**:
   - Checkbox: "Chỉ hiển thị sản phẩm còn hàng" (`inStock=true`).
4. **Reset Button**:
   - "Đặt lại bộ lọc" button clears all active filters back to defaults.

### 5.2 Sort & Pagination Specifications
- **Sort Dropdown (`sortBy`)**:
  - Options:
    1. `Mới nhất` (default, `createdAt: -1`)
    2. `Giá: Thấp đến Cao` (`price_asc`)
    3. `Giá: Cao đến Thấp` (`price_desc`)
    4. `Đánh giá cao nhất` (`rating_desc`)
    5. `Tên: A đến Z` (`name_asc`)
- **Pagination Controls**:
  - Buttons: `Trước (Previous)`, page numbers `1, 2, 3...`, `Sau (Next)`.
  - Disabled states for `Previous` when on page 1, and `Next` when on last page.
  - Responsive: On mobile, show simplified `Trang 1 / 3` with Prev/Next buttons.

### 5.3 URL Synchronization Architecture (`useSearchParams`)
- URL schema:
  `/products?search=oxford&category=Áo&minPrice=200000&maxPrice=500000&inStock=true&sortBy=price_asc&page=1`
- **Two-way binding**:
  - User interaction -> Updates `searchParams` via `setSearchParams`.
  - Browser navigation (Back / Forward) or direct bookmark URL load -> Reads `searchParams` to initialize search input, category filters, and price ranges.
  - Preserves clean URLs: default values (e.g. `page=1`, empty search, `all` category) are omitted or cleaned to prevent messy query strings.

---

## 6. Responsive Breakpoint Matrix

| Component | Desktop (>= 1024px) | Tablet (768px - 1023px) | Mobile (< 768px) |
|---|---|---|---|
| **Admin Table** | Full 7 columns, horizontal table layout | Horizontal scrollable wrapper (`overflow-x: auto`) | Responsive scroll wrapper, compact row padding |
| **Admin CRUD Modal** | Center modal, `max-width: 580px`, 2-column form rows (`.form-row-2`) | Center modal, `max-width: 500px` | Full width with 16px margins, single column rows |
| **Catalog Layout** | 2-column: 260px filter sidebar + 3-column product grid | 2-column or collapsible top filter, 2-column grid | Collapsible Filter drawer/modal, 1 or 2-column grid |
| **Product Card** | 3 or 4 cards per row, hover scale animation | 2 or 3 cards per row | 2 cards per row (min-width: 140px), compact font |
| **Pagination** | Full numeric buttons + Prev / Next | Numeric buttons + Prev / Next | Compact "Trang X / Y" + Prev / Next |

---

## 7. CSS Design Tokens & Class Mapping Guide

| UI Element | CSS Class / Selector | Source | Visual Appearance |
|---|---|---|---|
| **Page Layout** | `.admin-app-layout`, `.admin-main-content` | `index.css` | Flex column layout, clean light background `#fcfcfd` |
| **Sidebar Link** | `.admin-sidebar-link`, `.admin-sidebar-link-active` | `index.css` | `#cbd5e1` text on dark sidebar; active is white card with `#0f172a` text |
| **Primary Button** | `.btn-primary` | `index.css` | `#0f172a` dark slate, white text, 8px border-radius, hover `#1e293b` |
| **Secondary Button** | `.btn-secondary` | `index.css` | `#ffffff`, 1px solid `#e2e8f0`, dark text, hover `#f1f5f9` |
| **Action Icon Button** | `.icon-action-btn.edit-btn`, `.delete-btn` | `index.css` | 32x32px rounded square, edit hover blue `#eef2ff`, delete hover red `#fef2f2` |
| **Modal Backdrop** | `.modal-backdrop` | `index.css` | Fixed inset 0, `rgba(15, 23, 42, 0.6)`, blur 4px, centered |
| **Modal Card** | `.modal-card` | `index.css` | White background, rounded 16px, shadow-xl, max-width 580px |
| **Modal Header** | `.modal-header`, `.modal-close-btn` | `index.css` | Border-bottom `#e2e8f0`, flex justify-between, 18px bold title |
| **Form Inputs** | `.form-group input`, `textarea`, `select` | `index.css` | 1px solid `#cbd5e1`, 8px radius, focus border `#0f172a` with ring |
| **Empty State** | `.empty-state-box`, `.empty-icon` | `index.css` | 2px dashed border `#cbd5e1`, 16px radius, centered icon and text |
| **Active Status Toggle**| Custom scoped status button | `AdminUsersPage` style | Active: `#f0fdf4` / `#16a34a`; Inactive: `#fef2f2` / `#dc2626` |
| **Product Card** | `.product-card` | Custom component | White card, 1px border `#e2e8f0`, hover translateY(-4px), 12px radius |

---

## 8. Verification & Acceptance Checklist

- [x] Full column layout for Admin Products Table specified (`Ảnh`, `Tên & Brand`, `Danh mục`, `Giá bán & Gốc`, `Kho hàng`, `Trạng thái`, `Hành động`).
- [x] CRUD Modal specifications complete with validation constraints for all product fields (`name`, `category`, `price`, `originalPrice`, `stock`, `brand`, `images`, `description`, `isActive`).
- [x] Delete Confirmation Dialog specified with warning icon and dangerous action protection.
- [x] Public Product Catalog grid & Product Card anatomy specified with badges, pricing, stock indicators, and responsive breakpoints.
- [x] Search Bar with 300ms debounce, clear button, and empty state specified for Gate 2.
- [x] Multi-Filter panel, Sorting dropdown, and `useSearchParams` two-way synchronization specified for Gate 3.
- [x] 100% adherence to Minimal Code Principle and design tokens in `index.css`.
