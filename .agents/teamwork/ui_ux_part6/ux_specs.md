# UI/UX Specifications: Product Filter, Sort & URL Synchronization (Part 6 - Gate 3)
**Project**: Shop Quần Áo - Fashion E-Commerce System (SE1909 G5 SDN302 Final Project)  
**Author**: Sub-agent UI/UX Designer  
**Milestone**: Gate 3 / Cổng 3 (Part 6: Product Filter & Sort)  
**Status**: APPROVED DESIGN SPECIFICATION  

---

## 1. Executive Summary & Design Principles

Part 6 (Gate 3) is the culmination of the Product Module for Member 2. It integrates **Multi-condition Filtering**, **Sorting**, **Pagination**, and **Two-Way URL Search Parameters Synchronization** (`useSearchParams`) across both the **Public Customer Catalog** (`ProductsPage.jsx`) and the **Admin Product Management** (`AdminProductsPage.jsx`).

### 1.1 Minimal Code Principle (`AGENTS.md`)
In strict compliance with project guidelines:
1. **Zero External Packages**: Do not introduce any third-party UI component libraries (e.g., no headless-ui, no material-ui, no lodash, no react-query). Use only native React 19 hooks (`useState`, `useEffect`, `useCallback`, `useMemo`), React Router DOM v7 (`useSearchParams`), and existing icons from `lucide-react`.
2. **Reusing Existing Styles & Tokens**:
   - Design tokens from `shop-project/frontend/src/index.css`:
     - Colors: `--primary: #0f172a`, `--primary-hover: #1e293b`, `--text-main: #0f172a`, `--text-muted: #64748b`, `--border-light: #e2e8f0`, `--bg-main: #fcfcfd`, `--card-bg: #ffffff`, `--danger: #ef4444`, `--success: #10b981`.
     - Radii: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-full: 9999px`.
     - Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`.
   - Utility & component classes: `.btn-primary`, `.btn-secondary`, `.empty-state-box`, `.empty-icon`, `.admin-users-spin`, `.product-card`, `.badge-tag`, `.input-with-icon`.
3. **Zero Bloat & Direct Implementation**: All components and state-sync logic are embedded cleanly into the respective page components without redundant wrapper abstractions or Higher-Order Components (HOCs).

---

## 2. Two-Way URL Search Params Synchronization Architecture

The core requirement of Part 6 is that **the URL query string is the single source of truth** for all filter, search, sort, and pagination states.

### 2.1 Canonical Query Parameter Schema

| Parameter | Type | Default Value | Serialization Condition | Example Value | Description |
|---|---|---|---|---|---|
| `search` | `string` | `""` | Included ONLY if non-empty string | `search=ao+khoac` | Search keyword for name, brand, description |
| `category` | `string` | `"Tất cả"` / `"all"` | Included ONLY if not default | `category=Ao` | Selected product category |
| `minPrice` | `number` / `string` | `""` | Included ONLY if positive number | `minPrice=200000` | Minimum price filter (VND) |
| `maxPrice` | `number` / `string` | `""` | Included ONLY if positive number | `maxPrice=600000` | Maximum price filter (VND) |
| `inStock` | `boolean` | `false` | Included ONLY if `true` (`inStock=true`) | `inStock=true` | In-stock filter toggle |
| `sortBy` | `string` | `""` (Mới nhất) | Included ONLY if not default | `sortBy=price_asc` | Sort order selector |
| `page` | `number` | `1` | Included ONLY if `page > 1` | `page=2` | Current pagination page number |
| `limit` | `number` | `12` (Client) / `10` (Admin) | Optional; omitted when default | `limit=12` | Number of products per page |

### 2.2 Two-Way Data Flow Diagram

```text
+-----------------------------------------------------------------------------------+
|                               USER INTERACTION                                    |
| (Click Category / Type Price / Toggle In-Stock / Select Sort / Navigate Page)     |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                              updateParams(newParams)                              |
| - Merges newParams with current URLSearchParams                                   |
| - Strips falsy/default values ('' , undefined, 'Tất cả', inStock=false, page=1)   |
| - Resets page to 1 whenever any filter/search/sort criteria changes               |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                        setSearchParams(updatedParams)                             |
| - Updates window.location.search without reloading the page                       |
| - Pushes/replaces history entry for back/forward navigation                       |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                           URL PARAMETER OBSERVATION                               |
| [urlSearch, urlCategory, urlMinPrice, urlMaxPrice, urlInStock, urlSortBy, urlPage]|
+-----------------------------------------------------------------------------------+
                                        |
                   +--------------------+--------------------+
                   |                                         |
                   v                                         v
+-------------------------------------+   +-------------------------------------+
|         UI STATE RECONCILIATION     |   |         API QUERY EXECUTION         |
| - Syncs local input fields          |   | - Calls GET /api/products?params    |
| - Activates category button/pill    |   | - Handles loading state & spinner   |
| - Checks in-stock toggle            |   | - Updates products, total, pages    |
| - Selects sort dropdown option      |   | - Renders catalog grid or empty box |
+-------------------------------------+   +-------------------------------------+
```

### 2.3 URL Hygiene & Cleanliness Rules
1. **Never Pollute the URL with Defaults**:
   - `page=1` must be deleted from search params.
   - `category=Tất cả` or `category=all` must be deleted from search params.
   - `inStock=false` must be deleted from search params.
   - Empty strings (`minPrice=""`, `search=""`) must be deleted from search params.
2. **Deep-linking & Shareability**:
   - When a user copies the URL (e.g. `https://shop.com/products?category=Áo&minPrice=300000&sortBy=price_asc`) and pastes it in a new incognito window, the page must load with:
     - "Áo" selected in Category sidebar.
     - "300000" in Min Price field.
     - "Giá: Thấp đến Cao" selected in Sort dropdown.
     - Filtered products rendered directly.
3. **Browser History (Back & Forward Buttons)**:
   - Clicking Browser "Back" must restore the exact previous filter state.
   - Clicking Browser "Forward" must restore the exact next filter state.
   - Achieved natively via `useSearchParams` hook subscriptions.

---

## 3. Public Customer Catalog (`ProductsPage.jsx`) UX Specifications

### 3.1 Desktop Layout Wireframe (1240px Container)

```text
+---------------------------------------------------------------------------------------------------+
|  [BỘ SƯU TẬP 2026]                                                                               |
|  Bộ Sưu Tập Thời Trang                                                                           |
|  Khám phá phong cách thời thượng với các thiết kế tối giản, tinh tế. (Hiển thị 36 sản phẩm)      |
+---------------------------------------------------------------------------------------------------+
|                                 |                                                                 |
|  [BỘ LỌC TÌM KIẾM]     [Đặt lại]|  [Search: "Tìm kiếm sản phẩm..." [X]]    [Sắp xếp: Mới nhất v]  |
|  -------------------------------|  -------------------------------------------------------------  |
|  DANH MỤC                       |  Hiển thị 1 - 12 trong 36 sản phẩm  [Đang lọc: Áo (x)] [>=300k] |
|  [Tất cả]                       |                                                                 |
|  [Áo] (Active)                  |  +----------------+  +----------------+  +----------------+     |
|  [Quần]                         |  | [Image]  -20%  |  | [Image]        |  | [Image]  -15%  |     |
|  [Váy]                          |  | CLOSET         |  | CLOSET         |  | CLOSET         |     |
|  [Áo khoác]                     |  | Áo Polo Nam    |  | Áo Thun Basic  |  | Áo Sơ Mi Slim  |     |
|  [Phụ kiện]                     |  | 5.0 * (12)     |  | 4.8 * (24)     |  | 4.9 * (8)      |     |
|  [Giày dép]                     |  | 350.000 đ      |  | 199.000 đ      |  | 420.000 đ      |     |
|  [Khác]                         |  | [Xem Chi Tiết] |  | [Xem Chi Tiết] |  | [Xem Chi Tiết] |     |
|  -------------------------------|  +----------------+  +----------------+  +----------------+     |
|  KHOẢNG GIÁ (VND)               |  +----------------+  +----------------+  +----------------+     |
|  [< 300k] [300k-600k] [> 600k]  |  | [Image]        |  | [Image]        |  | [Image]        |     |
|  [Tối thiểu] - [Tối đa]         |  | ...            |  | ...            |  | ...            |     |
|  [  Áp dụng giá  ]              |  +----------------+  +----------------+  +----------------+     |
|  -------------------------------|                                                                 |
|  [X] Chỉ hiện sản phẩm còn hàng |            [ < Trước ]  [ 1 ]  [ 2 ]  [ 3 ]  [ Sau > ]          |
+---------------------------------+-----------------------------------------------------------------+
```

### 3.2 Mobile Layout Wireframe (< 768px Responsive)

On mobile screens, vertical space is precious. Having a long sidebar pushes all products below the fold.
We specify an **Inline Collapsible Filter Bar** or **Mobile Filter Drawer Button**:

```text
+-------------------------------------------------------+
|  Bộ Sưu Tập Thời Trang                                |
|  36 sản phẩm                                          |
|                                                       |
|  +-------------------------------------------------+  |
|  | [Search] Tìm kiếm theo tên sản phẩm...     [X]  |  |
|  +-------------------------------------------------+  |
|                                                       |
|  [ Filter: Bộ lọc (2) v ]     [ Sắp xếp: Mới nhất v ] |
|                                                       |
|  + - - - - - - - - - - - - - - - - - - - - - - - - +  |
|  | (Khi nhấn mở Bộ lọc trên Mobile):               |  |
|  | Danh mục: [Tất cả] [Áo (x)] [Quần] [Váy] ...    |  |
|  | Giá: [< 300k] [300k-600k] [> 600k]              |  |
|  | [Tối thiểu] - [Tối đa]  [Áp dụng]               |  |
|  | [X] Chỉ hiện sản phẩm còn hàng                  |  |
|  | [ Đặt lại bộ lọc ]       [ Áp dụng & Đóng ]     |  |
|  + - - - - - - - - - - - - - - - - - - - - - - - - +  |
|                                                       |
|  +----------------------+   +----------------------+  |
|  | [Image]        -20%  |   | [Image]              |  |
|  | Áo Polo Nam          |   | Áo Thun Basic        |  |
|  | 350.000 đ            |   | 199.000 đ            |  |
|  +----------------------+   +----------------------+  |
|                                                       |
|         [ < Trước ]  [ 1 ]  [ 2 ]  [ Sau > ]          |
+-------------------------------------------------------+
```

### 3.3 Detailed Component Specifications for Client Catalog

#### 3.3.1 Left Filter Sidebar (`<aside>`)
- **Container**:
  - Desktop: `width: 280px`, `position: sticky`, `top: 90px`, `background: #ffffff`, `border: 1px solid #e2e8f0`, `borderRadius: 16px`, `padding: 24px`, `boxShadow: 0 2px 8px rgba(15, 23, 42, 0.04)`.
  - Header: Icon `Filter` (18px, `#0f172a`), Title "Bộ Lọc Tìm Kiếm" (`fontSize: 16px`, `fontWeight: 700`), Reset Button with icon `RotateCcw` (`fontSize: 12px`, `color: #dc2626`).
- **Category Filter**:
  - Title: "DANH MỤC" (`fontSize: 13px`, `fontWeight: 700`, `color: #334155`, uppercase).
  - Category List: `['Tất cả', 'Áo', 'Quần', 'Váy', 'Áo khoác', 'Phụ kiện', 'Giày dép', 'Khác']`.
  - Item Button:
    - Inactive: `background: transparent`, `color: #475569`, hover: `background: #f8fafc`, `color: #0f172a`.
    - Active: `background: #0f172a`, `color: #ffffff`, `fontWeight: 700`, `boxShadow: 0 2px 6px rgba(15, 23, 42, 0.12)`.
    - Interaction: Clicking any category updates URL `category` and resets `page=1`. Clicking "Tất cả" removes `category` param.
- **Price Range Filter**:
  - Title: "KHOẢNG GIÁ (VND)".
  - Quick Range Preset Chips:
    1. `< 300.000 ₫`: Sets `maxPrice=300000`, clears `minPrice`.
    2. `300k - 600k ₫`: Sets `minPrice=300000`, `maxPrice=600000`.
    3. `> 600.000 ₫`: Sets `minPrice=600000`, clears `maxPrice`.
    - Active preset chip receives highlight (`background: #e2e8f0`, `borderColor: #94a3b8`, `fontWeight: 700`).
  - Custom Min-Max Input Form:
    - 2 numeric inputs: Min price and Max price.
    - Placeholder: "Tối thiểu", "Tối đa".
    - Auto-sanitization: Strips negative signs and non-numeric characters.
    - Submit Button: `.btn-secondary`, text "Áp dụng giá", icon `ArrowRight` or simple text. Clicking updates URL `minPrice`, `maxPrice`, resets `page=1`.
- **In-Stock Toggle Filter**:
  - Label: "Chỉ hiện sản phẩm còn hàng".
  - Control: `<input type="checkbox" id="filter-in-stock" />` or styled switch toggle.
  - Interaction: Checked sets `inStock=true` in URL; unchecked removes `inStock` from URL; resets `page=1`.
- **Reset All Filters Button**:
  - Label: "Đặt lại toàn bộ bộ lọc".
  - Behavior: Clears `category`, `minPrice`, `maxPrice`, `inStock`, `search`, `sortBy`, `page`, returning catalog to pristine default state.

#### 3.3.2 Top Toolbar (`<div className="catalog-toolbar">`)
- **Search Bar (Debounced 300ms)**:
  - Input with leading search icon (idle) or spinner (debouncing/querying).
  - Trailing "X" clear button.
  - Esc key clears search text immediately.
  - Enter key commits search query immediately without waiting for 300ms timer.
- **Sort Dropdown (`<select id="catalog-sort">`)**:
  - Options:
    1. `value=""` -> "Mới nhất" (Default, `sort = { createdAt: -1 }`)
    2. `value="price_asc"` -> "Giá: Thấp đến Cao" (`sort = { price: 1 }`)
    3. `value="price_desc"` -> "Giá: Cao đến Thấp" (`sort = { price: -1 }`)
    4. `value="rating_desc"` -> "Đánh giá cao nhất" (`sort = { rating: -1 }`)
    5. `value="name_asc"` -> "Tên: A đến Z" (`sort = { name: 1 }`)
  - Interaction: On change, updates URL `sortBy` and resets `page=1`.
- **Result Metrics & Active Filters Bar**:
  - Displays: "Hiển thị **X - Y** trong **Z** sản phẩm" (e.g. "Hiển thị 1 - 12 trong 36 sản phẩm").
  - If filters are active, displays interactive Badge Chips:
    - `[Danh mục: Áo (x)]`
    - `[Giá: 300.000₫ - 600.000₫ (x)]`
    - `[Còn hàng (x)]`
    - Clicking `(x)` on any chip removes that specific filter parameter instantly.

#### 3.3.3 Pagination Control (`<nav aria-label="Pagination">`)
- **Structure**:
  - "Trước" (Previous) button with icon `ChevronLeft`. Disabled (`disabled`, `opacity: 0.5`, `cursor: not-allowed`) if `page <= 1`.
  - Numbered Page Buttons:
    - Always display page `1`.
    - If `totalPages <= 7`: Display `[1] [2] [3] [4] [5] [6] [7]`.
    - If `totalPages > 7`: Dynamic windowing with ellipsis:
      - Near start: `[1] [2] [3] [4] [...] [totalPages]`
      - Middle: `[1] [...] [page-1] [page] [page+1] [...] [totalPages]`
      - Near end: `[1] [...] [totalPages-3] [totalPages-2] [totalPages-1] [totalPages]`
    - Active Page Button: `background: #0f172a`, `color: #ffffff`, `fontWeight: 700`.
  - "Sau" (Next) button with icon `ChevronRight`. Disabled if `page >= totalPages`.
- **UX Polish**:
  - Whenever page changes, smoothly scroll back to top of product grid (`window.scrollTo({ top: 180, behavior: 'smooth' })`).

---

## 4. Admin Product Management (`AdminProductsPage.jsx`) UX Specifications

The Admin Management page requires full filtering, sorting, and pagination integration with the same two-way URL synchronization standard.

### 4.1 Admin Toolbar Wireframe

```text
+---------------------------------------------------------------------------------------------------+
|  [Search: "Tìm theo tên, SKU..." [X]]  [Danh mục: Tất cả v]  [Trạng thái: Tất cả v]  [Sắp xếp v]  |
|                                        Tổng: 48 sản phẩm  [Làm mới]  [+ Thêm Sản Phẩm Mới]        |
+---------------------------------------------------------------------------------------------------+
|  Ảnh  |  Tên & Thương hiệu   |  Danh mục   |  Giá bán / Gốc  | Kho hàng | Trạng thái |  Hành động |
|-------+----------------------+-------------+-----------------+----------+------------+------------|
| [Img] | Áo Polo Nam          | Áo          | 350.000 ₫       | 42       | (v) Bật    | [Sửa] [Xóa]|
| [Img] | Quần Kaki Slim       | Quần        | 450.000 ₫       | 0 (Hết)  | (x) Tắt    | [Sửa] [Xóa]|
+---------------------------------------------------------------------------------------------------+
|  Hiển thị 1 - 10 trong 48 sản phẩm            [ < Trước ]  [ 1 ]  [ 2 ]  [ 3 ]  [ 4 ]  [ 5 ]  [ Sau > ] |
+---------------------------------------------------------------------------------------------------+
```

### 4.2 Admin Query Parameter Mapping

| URL Param | Admin Control | Options / Behavior |
|---|---|---|
| `search` | Search Input (300ms debounce) | Keyword search on `name`, `description`, `brand` |
| `category` | Category Select | `all` (Tất cả), `Áo`, `Quần`, `Váy`, `Áo khoác`, `Phụ kiện`, `Giày dép`, `Khác` |
| `status` / `isActive` | Status Select | `all` (Tất cả), `active` (`isActive=true`), `inactive` (`isActive=false`) |
| `sortBy` | Sort Dropdown | `newest` (Mới nhất), `oldest` (Cũ nhất), `price_asc` (Giá tăng), `price_desc` (Giá giảm), `name_asc` (Tên A-Z) |
| `page` | Pagination Footer | `1, 2, 3...` (Default 1) |
| `limit` | Items per page | Default `10` |

### 4.3 URL State Restoration in Admin Page
In `AdminProductsPage.jsx`, replace local-only `useState` with `useSearchParams`:
```javascript
const [searchParams, setSearchParams] = useSearchParams();

const urlSearch = searchParams.get('search') || '';
const urlCategory = searchParams.get('category') || 'all';
const urlStatus = searchParams.get('status') || 'all';
const urlSortBy = searchParams.get('sortBy') || '';
const urlPage = parseInt(searchParams.get('page') || '1', 10);
```
- Modifying any dropdown or typing into search updates `searchParams` and resets `page=1`.
- Reloading the page in Admin keeps the filtered list intact.

---

## 5. Empty State Matrix & Messaging

When filtering or searching returns zero products, the system must clearly inform the user why no products were found and provide 1-click recovery actions.

| Scenario | Title | Subtitle / Description | Primary CTA | Secondary CTA |
|---|---|---|---|---|
| **Search Only Empty** | Không Tìm Thấy Sản Phẩm Phù Hợp | Không tìm thấy sản phẩm khớp với từ khóa **"{search}"**. Vui lòng kiểm tra chính tả hoặc thử từ khóa khác. | `[Xóa Từ Khóa Tìm Kiếm]` (Removes `search`) | `[Xóa Tất Cả Bộ Lọc]` (Resets all) |
| **Filter Only Empty** | Không Có Sản Phẩm Thỏa Điều Kiện | Không có sản phẩm nào trong danh mục **"{category}"** với mức giá đã chọn. | `[Xóa Bộ Lọc]` (Removes category & price) | `[Xem Tất Cả Sản Phẩm]` (Resets all) |
| **Search + Filter Empty** | Không Tìm Thấy Kết Quả Phù Hợp | Không có sản phẩm nào khớp với từ khóa **"{search}"** trong bộ lọc hiện tại. | `[Xóa Từ Khóa]` | `[Đặt Lại Toàn Bộ]` |
| **Catalog Completely Empty** | Chưa Có Sản Phẩm Nào | Hiện tại cửa hàng đang cập nhật sản phẩm mới. Vui lòng quay lại sau! | `[Làm Mới Trang]` | - |

---

## 6. Technical Implementation Blueprint for Frontend & Backend Agents

### 6.1 Backend Controller Requirements (`getProducts`)
The unified controller `productController.js` must process the following query parameters safely:
```javascript
// Query parameter extraction with safe defaults
const {
  search,
  category,
  brand,
  minPrice,
  maxPrice,
  inStock,
  isActive,
  sortBy,
  page = 1,
  limit = 12,
} = req.query;
```
1. **Safety & Regex Injection Prevention**:
   - `search` is sanitized via `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` and wrapped in `{ $regex: sanitized, $options: 'i' }` for `name`, `description`, `brand`.
2. **Numeric Filter Sanitization**:
   - `minPrice` and `maxPrice` must be checked: `Number(val) >= 0 && !isNaN(Number(val))`.
   - If both provided, `query.price = { $gte: minVal, $lte: maxVal }`.
3. **In-Stock Filtering**:
   - If `inStock === 'true'`, add `query.stock = { $gt: 0 }`.
4. **Sort Mapping**:
   - `price_asc` -> `{ price: 1 }`
   - `price_desc` -> `{ price: -1 }`
   - `rating_desc` -> `{ rating: -1 }`
   - `name_asc` -> `{ name: 1 }`
   - `name_desc` -> `{ name: -1 }`
   - `oldest` -> `{ createdAt: 1 }`
   - Default (`""` or `newest`) -> `{ createdAt: -1 }`
5. **RBAC Guard**:
   - If customer / public, force `query.isActive = true`.
   - If admin / staff, honor `req.query.isActive` if specified, otherwise return all products.
6. **Unified Return Contract**:
   ```json
   {
     "success": true,
     "count": 12,
     "total": 36,
     "totalPages": 3,
     "currentPage": 1,
     "limit": 12,
     "products": [...]
   }
   ```

### 6.2 Frontend URL Sync Helper (`updateParams`)
Both `ProductsPage.jsx` and `AdminProductsPage.jsx` should implement this clean, reusable callback:
```javascript
const updateParams = useCallback((newParams) => {
  setSearchParams((prev) => {
    const updated = new URLSearchParams(prev);
    Object.entries(newParams).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        value === 'Tất cả' ||
        value === 'all' ||
        (key === 'page' && Number(value) === 1) ||
        (key === 'inStock' && value === false)
      ) {
        updated.delete(key);
      } else {
        updated.set(key, String(value));
      }
    });
    return updated;
  });
}, [setSearchParams]);
```

---

## 7. Accessibility (a11y) & Usability Standards

1. **ARIA Attributes**:
   - Search input: `aria-label="Tìm kiếm sản phẩm"`.
   - Clear button: `aria-label="Xóa từ khóa tìm kiếm"`, `title="Xóa từ khóa"`.
   - Sort dropdown: `aria-label="Sắp xếp sản phẩm theo tiêu chí"`.
   - Category buttons: `aria-pressed={isSelected}`.
   - Price inputs: `aria-label="Giá tối thiểu"`, `aria-label="Giá tối đa"`.
   - In-stock checkbox: Associated with `<label htmlFor="filter-in-stock">`.
   - Pagination container: `<nav aria-label="Phân trang sản phẩm">`.
   - Page buttons: `aria-current={pNum === urlPage ? "page" : undefined}`.
2. **Keyboard Navigation**:
   - Users can `Tab` through all category buttons, price inputs, sort select, and pagination buttons.
   - Pressing `Enter` on any preset chip or category button activates it.
   - Pressing `Esc` in search input clears the search query.

---

## 8. Verification & Acceptance Criteria for Part 6 (Gate 3)

### 8.1 Functional Verification Checklist
- [ ] **Multi-Filter**:
  - [ ] Category filter properly filters products by category (`Áo`, `Quần`, `Váy`, etc.).
  - [ ] Price presets (`< 300k`, `300k - 600k`, `> 600k`) accurately filter products within bounds.
  - [ ] Custom Min/Max price inputs work and validate properly.
  - [ ] In-stock toggle hides out-of-stock items (`stock <= 0`).
  - [ ] Reset All button restores default state.
- [ ] **Sorting**:
  - [ ] "Giá: Thấp đến Cao" sorts products in ascending price order.
  - [ ] "Giá: Cao đến Thấp" sorts products in descending price order.
  - [ ] "Đánh giá cao nhất" sorts products by rating descending.
  - [ ] "Mới nhất" sorts by creation timestamp descending.
- [ ] **Pagination**:
  - [ ] Displays exact results count ("Hiển thị X - Y trong Z sản phẩm").
  - [ ] Navigating between pages fetches the correct slice.
  - [ ] Previous button disabled on page 1; Next button disabled on last page.
  - [ ] Triggering any new filter/sort/search resets current page to 1.
- [ ] **Two-Way URL Synchronization**:
  - [ ] Any interaction updates URL search parameters immediately without full reload.
  - [ ] Reloading the browser retains all filters, sort order, and page number.
  - [ ] Browser Back and Forward buttons navigate between filter states seamlessly.
  - [ ] Sharing/copying the URL loads the identical filtered catalog in another browser/session.
  - [ ] Default values (`page=1`, `inStock=false`, `category=Tất cả`) are stripped from URL query string.
- [ ] **Admin Products Page**:
  - [ ] Filter toolbar in `AdminProductsPage.jsx` supports Search, Category, Status, Sort.
  - [ ] State is synchronized to URL search params.
  - [ ] Admin CRUD actions (Add, Edit, 1-Click Status Toggle, Delete) continue functioning flawlessly without regression.
- [ ] **Responsive Design**:
  - [ ] Desktop layout is spacious with sticky sidebar.
  - [ ] Mobile layout is compact, scroll-efficient, and easy to interact with.
- [ ] **Minimal Code Principle**:
  - [ ] Zero new external npm packages.
  - [ ] Reuses existing `index.css` classes and tokens.
  - [ ] Zero dead code or boilerplate.
- [ ] **Automated Tests**:
  - [ ] 100% test suites pass in Jest (Backend) and Vitest (Frontend).
  - [ ] Standard test accounts verified: Admin (`admin@shop.com`/`admin123`), Staff (`staff@shop.com`/`staff123`), Customer (`customer@shop.com`/`password123`).
