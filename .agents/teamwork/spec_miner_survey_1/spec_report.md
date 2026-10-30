# Product Module Specification & Test Mining Report (Member 2)

**Integrity Mode**: Development  
**Working Directory**: `c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject`  
**Author**: Specification Miner Subagent (`spec_miner_survey_1`)  
**Date**: 2026-10-30  
**References**: `ORIGINAL_REQUEST.md`, `AGENTS.md`, `SKILL.md`, `backend/src/models/productModel.js`, `backend/src/controllers/productController.js`, `backend/src/routes/productRoutes.js`

---

## 1. Executive Summary & Architecture Overview

Member 2 is responsible for the **Product Module**, encompassing:
1. **Gate 1: Product Management (CRUD & RBAC)**: Mongoose model, RESTful endpoints (`/api/products`), Admin table & CRUD modal (`/admin/products`), Sidebar navigation, and Public Catalog grid (`/products`).
2. **Gate 2: Product Search**: Case-insensitive text/regex search, 300ms debounce input, clear button, and Empty State UI.
3. **Gate 3: Product Filter, Sort & URL Sync**: Multi-condition filters (`category`, `minPrice`, `maxPrice`, `inStock`), multi-attribute sorting (`price_asc`, `price_desc`, `rating_desc`, `name_asc`, `name_desc`, `oldest`, `newest`), pagination, and bidirectional URL query synchronization (`useSearchParams`).

### Architectural Principles
- **Minimal Code Principle (Zero Bloat)**: All search, filter, sort, and pagination logic is consolidated into a single backend controller `getProducts` (`/api/products`). No redundant endpoints or boilerplate wrappers.
- **Unified RBAC**: Protected mutating routes (`POST`, `PUT`, `DELETE`) utilize existing `protect` and `isStaffOrAdmin` middlewares.
- **Frontend Architecture**: Native React hooks (`useState`, `useEffect`, `useMemo`), `api.js` Axios instance, `lucide-react` icons, and existing styling variables in `index.css`.
- **Test Accounts**: Standardized credentials for Admin (`admin@shop.com`), Staff (`staff@shop.com`), and Customer (`customer@shop.com`).
- **Gate Execution Strategy**: Follow-up instruction from User specifies continuous implementation across all 3 Gates without pausing, culminating in a comprehensive Gate 3 stop and full-system report after all tests pass 100%.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Model / Schema | Mongoose Product Schema | Schema with validation rules for products (`name`, `description`, `price`, `originalPrice`, `category`, `brand`, `stock`, `images`, `rating`, `numReviews`, `isActive`, timestamps) | Product document object | Mongoose Model `Product` | Mongoose ValidationError (400) if required fields missing or negative numbers | `productModel.js` & `SKILL.md` |
| 2 | Model / Indexing | Database Indexes | Text index on `name`, `description`, `brand`; compound index on `category`, `price`, `isActive` | MongoDB schema indexes | Indexed collections | None | `productModel.js` |
| 3 | Backend API | Unified Products Query (`GET /api/products`) | Consolidated endpoint handling listing, pagination, keyword search, multi-filter, and sorting | Query params: `page`, `limit`, `search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `isActive` | `{ success: true, products: [], total, totalPages, currentPage, limit }` | 500 on database query failure | `productController.js` & `ORIGINAL_REQUEST.md` |
| 4 | Backend API | Product Detail (`GET /api/products/:id`) | Fetches single product by ID | Path param: `:id` (ObjectId) | `{ success: true, product: {} }` | 404 if product not found; 500 on invalid ID / server error | `productController.js` & `ORIGINAL_REQUEST.md` |
| 5 | Backend API | Create Product (`POST /api/products`) | Creates a new product; requires Admin or Staff role | JSON body: `{ name, description, price, originalPrice, category, brand, stock, images, isActive }` + Bearer token | 201 Created with `{ success: true, message: '...', product: {} }` | 400 if required fields missing; 401 if unauthorized; 403 if Customer | `productController.js`, `authMiddleware.js`, `ORIGINAL_REQUEST.md` |
| 6 | Backend API | Update Product (`PUT /api/products/:id`) | Updates product fields or toggles `isActive`; requires Admin or Staff role | Path param `:id`, JSON body with updated fields + Bearer token | 200 OK with `{ success: true, message: '...', product: {} }` | 400 if validation error; 404 if not found; 401 if unauth; 403 if Customer | `productController.js`, `authMiddleware.js`, `ORIGINAL_REQUEST.md` |
| 7 | Backend API | Delete Product (`DELETE /api/products/:id`) | Removes product from database; requires Admin or Staff role | Path param `:id` + Bearer token | 200 OK with `{ success: true, message: '...', productId }` | 404 if not found; 401 if unauth; 403 if Customer | `productController.js`, `authMiddleware.js`, `ORIGINAL_REQUEST.md` |
| 8 | Gate 1 Frontend | Admin Navigation & Route Guard | Adds `/admin/products` route under AdminRoute guard and link in Admin Sidebar | Route path `/admin/products` | Rendered `AdminProductsPage` within `AdminLayout` | Redirect to login if unauth; 403 page if customer | `App.jsx`, `Sidebar.jsx`, `ORIGINAL_REQUEST.md` |
| 9 | Gate 1 Frontend | Admin Products Table (`/admin/products`) | Clean responsive table displaying product image, name, category, price, stock, isActive status badge/toggle, and action buttons (Edit, Delete) | API list data | HTML Table with row actions | Empty table state if 0 products; error toast on fetch failure | `ORIGINAL_REQUEST.md` & `SKILL.md` |
| 10 | Gate 1 Frontend | 1-Click Status Toggle | Toggle `isActive` on Admin table via single click | Click event on toggle button / badge | Dispatches `PUT /api/products/:id` with `{ isActive: !status }` | Displays error toast and rolls back UI state if request fails | `SKILL.md` & `ORIGINAL_REQUEST.md` |
| 11 | Gate 1 Frontend | Product Create/Edit Modal | Modal dialog containing form fields (`name`, `category`, `price`, `originalPrice`, `stock`, `brand`, `description`, `images`, `isActive`) | Form inputs | Submits `POST` or `PUT`, refreshes list, displays success toast | Client-side validation prevents submit with empty required fields | `ORIGINAL_REQUEST.md` & `SKILL.md` |
| 12 | Gate 1 Frontend | Public Catalog Grid (`/products`) | Public catalog displaying responsive product card grid with thumbnail, category badge, title, formatted price (VND), discount badge, stock status | Products list from API | Product cards grid | Empty state if no products; Skeleton/spinner during loading | `ORIGINAL_REQUEST.md` & `SKILL.md` |
| 13 | Gate 2 Search | Backend Regex Keyword Search | Case-insensitive regex matching across `name`, `description`, `brand`, `category` | `search` query param | Filtered products array | Safe regex escaping to prevent regex injection crashes | `productController.js` & `ORIGINAL_REQUEST.md` |
| 14 | Gate 2 Search | 300ms Debounced Search Input | Search input in Public Catalog and Admin with 300ms debounce before firing query | Keyboard typing | Triggers search update after 300ms idle | None | `ORIGINAL_REQUEST.md` |
| 15 | Gate 2 Search | Quick Clear Search Button | "X" icon inside search box to reset search query | Click on "X" icon | Clears search input, resets query, re-fetches list | None | `ORIGINAL_REQUEST.md` |
| 16 | Gate 2 Search | Search Empty State UI | Dedicated informative empty state display when search returns 0 products | 0 results from search | Visual Empty State with icon (`SearchX`), explanatory text, and "Xóa tìm kiếm" button | None | `ORIGINAL_REQUEST.md` |
| 17 | Gate 3 Multi-Filter | Category Filter | Filter products by category (`Áo Thun`, `Sơ Mi`, `Quần Jean`, `Váy Đầm`, `Phụ Kiện`, etc.) | `category=<name>` or `category=all` | Matching products | Clears filter when 'all' is selected | `productController.js` & `ORIGINAL_REQUEST.md` |
| 18 | Gate 3 Multi-Filter | Price Range Filter | Filter products between `minPrice` and `maxPrice` | `minPrice=<num>`, `maxPrice=<num>` | Products where `minPrice <= price <= maxPrice` | Safely ignores empty inputs | `productController.js` & `ORIGINAL_REQUEST.md` |
| 19 | Gate 3 Multi-Filter | In Stock Filter | Filter products with positive inventory (`stock > 0`) | `inStock=true` | Products with `stock > 0` | Ignores filter if false or omitted | `productController.js` & `ORIGINAL_REQUEST.md` |
| 20 | Gate 3 Sorting | Multi-Attribute Sorting | Sorts products by multiple criteria: `price_asc`, `price_desc`, `rating_desc`, `name_asc`, `name_desc`, `oldest`, `newest` | `sortBy=<value>` | Ordered products array | Defaults to `newest` (`createdAt: -1`) if unspecified or invalid | `productController.js` & `ORIGINAL_REQUEST.md` |
| 21 | Gate 3 Pagination | Dynamic Pagination | Paginated data navigation (`page`, `limit`) with page indicators and boundary disabling | `page=<num>`, `limit=<num>` | Paginated chunk + totalPages + total | Clamps `page >= 1` and `1 <= limit <= 100` | `productController.js` & `ORIGINAL_REQUEST.md` |
| 22 | Gate 3 URL Sync | URL Query Sync (`useSearchParams`) | Synchronizes all search, filter, sort, and pagination state with browser URL query string | Filter/search/sort change | Browser URL updated (`?search=...&category=...`); bookmarkable and shareable | Resets `page=1` whenever filters or search terms change | `ORIGINAL_REQUEST.md` & `SKILL.md` |

---

## 3. Edge Cases & Error Behavior

| # | Feature | Input / Condition | Observed & Required Behavior |
|---|---------|-------------------|-----------------------------|
| 1 | Backend Search | Regex special characters in search: `(`, `[`, `*`, `+`, `?`, `\` | Without regex escaping, `new RegExp(search)` throws a SyntaxError and crashes endpoint with 500. **Requirement**: Escape regex special characters with `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`. |
| 2 | Backend Search | Vietnamese Unicode characters (e.g., "Áo Thun", "Đầm", "Váy") | Case-insensitive regex `i` flag correctly matches Unicode characters in Mongoose. Empty/whitespace search is trimmed and ignored. |
| 3 | Backend Filter | Empty string parameters: `minPrice=""`, `maxPrice=""` | If `req.query.minPrice === ''`, `query.price` must NOT be left as an empty object `{}` because `{ price: {} }` interferes with Mongoose queries. Only set `$gte`/`$lte` when non-empty, and clean up empty object. |
| 4 | Backend Filter | Inverted price bounds: `minPrice=500000&maxPrice=100000` | Mongoose queries `{ price: { $gte: 500000, $lte: 100000 } }` returning 0 products (`products: []`, `total: 0`). Catalog gracefully shows Empty State without crashing. |
| 5 | Backend Visibility | Customer queries `isActive=false` (`GET /api/products?isActive=false`) | Customers and guests must NOT be allowed to view hidden/inactive products. The backend controller must enforce `query.isActive = true` unless the requester is an authenticated Admin or Staff. |
| 6 | Backend RBAC | Customer or Guest calls `POST /api/products` | Guest receives `401 Unauthorized` (`{ message: 'Chưa đăng nhập, không có token xác thực' }`). Customer receives `403 Forbidden` (`{ message: 'Bạn không có quyền truy cập. Chỉ quản trị viên hoặc nhân viên mới được phép.' }`). |
| 7 | Backend CRUD | Missing required fields in `POST /api/products` | Returns `400 Bad Request` with clear message: `'Vui lòng cung cấp đầy đủ: Tên, Mô tả, Giá, Danh mục và Số lượng kho'`. |
| 8 | Backend CRUD | Negative price or negative stock in `POST /api/products` | Mongoose schema validation fires (`min: [0, 'Giá không được âm']`), returning `400 Bad Request` with validation error details. |
| 9 | Backend Detail/Update/Delete | Non-existent or invalid MongoDB ObjectId in `GET/PUT/DELETE /api/products/:id` | If valid ObjectId but does not exist in DB: returns `404 Not Found` (`{ success: false, message: 'Không tìm thấy sản phẩm' }`). If malformed ObjectId: returns `400 Bad Request` (CastError caught). |
| 10 | Frontend Search | User types rapidly in search box | Debounce timer of 300ms cancels previous timeout on each keystroke, firing exactly one API call 300ms after user pauses typing. Prevents API spam. |
| 11 | Frontend Search | User clicks "X" quick-clear button | Immediately clears input value, cancels pending debounce timer, updates URL params, and triggers immediate fetch for all products. |
| 12 | Frontend Search | Search term returns 0 results | Catalog replaces product grid with Empty State card (`SearchX` icon, "Không tìm thấy sản phẩm...", "Xóa tìm kiếm" button). Clicking "Xóa tìm kiếm" restores full catalog. |
| 13 | Frontend Filter | User applies filter while on page 3 | When any filter (`category`, `minPrice`, `maxPrice`, `inStock`) or `search` changes, `page` resets to 1 in URL and state, preventing empty pages due to stale offset. |
| 14 | Frontend URL | User reloads page or pastes direct URL with query parameters | Components read `useSearchParams` on mount and initialize search input, filter selects, price bounds, sort dropdown, and active page accordingly. |
| 15 | Frontend Admin | Quick toggle `isActive` fails due to network error | Catches error, shows toast notification `'Không thể cập nhật trạng thái sản phẩm'`, and retains/restores the previous toggle state. |
| 16 | Frontend Admin | User clicks Delete button on product | Prompts browser confirmation dialog (`window.confirm`). If cancelled, no action. If confirmed, dispatches `DELETE`, removes row, shows success toast. |

---

## 4. Default Test Accounts & RBAC Matrix

| Role | Email | Password | Permissions & Expectations |
|------|-------|----------|----------------------------|
| **Admin** | `admin@shop.com` | `admin123` | **Full CRUD**: Can access `/admin/products`, view all active & inactive products, create products (`POST /api/products`), edit/toggle status (`PUT /api/products/:id`), delete products (`DELETE /api/products/:id`). |
| **Staff** | `staff@shop.com` | `staff123` | **Product & Stock Operations**: Can access `/admin/products`, view all active & inactive products, create products (`POST`), edit/toggle status (`PUT`), delete products (`DELETE`). Blocked from `/admin/users`. |
| **Customer** | `customer@shop.com` | `password123` | **Catalog & Search Only**: Can view `/products`, search, filter, sort. Blocked from `/admin/products` (403). Blocked from `POST`, `PUT`, `DELETE /api/products` (403 Forbidden). |
| **Guest** | *(Unauthenticated)* | *(None)* | **Public Catalog Only**: Can view `/products`, search, filter, sort. Blocked from `/admin/products`. Blocked from mutating endpoints (401 Unauthorized). |

---

## 5. Automated Test Suites Specification

### 5.1. Backend Automated Test Suite
- **Command**: `npm --prefix shop-project/backend test -- tests/product.test.js`
- **Runner**: Jest (`backend/package.json` -> `"test": "jest"`)
- **Database**: Local MongoDB instance (`mongodb://127.0.0.1:27017/shop_test`)
- **Current Status**: `tests/product.test.js` does NOT exist yet. It must be created by the Tester agent.
- **Required Test Cases**:
  1. **Gate 1 - CRUD & RBAC**:
     - `POST /api/products`:
       - Admin creates product -> returns `201 Created` and product JSON.
       - Staff creates product -> returns `201 Created` and product JSON.
       - Customer creates product -> returns `403 Forbidden`.
       - Guest (no token) creates product -> returns `401 Unauthorized`.
       - Missing required fields (name, price, category, stock) -> returns `400 Bad Request`.
       - Negative price or negative stock -> returns `400 Bad Request`.
     - `GET /api/products`:
       - Public/Guest access -> returns `200 OK` with paginated active products only.
       - Admin/Staff access -> returns `200 OK`, can query `isActive=false`.
     - `GET /api/products/:id`:
       - Existing product -> returns `200 OK` with product details.
       - Non-existent ObjectId -> returns `404 Not Found`.
     - `PUT /api/products/:id`:
       - Admin updates fields / toggles `isActive` -> returns `200 OK` and persists update.
       - Staff updates fields / toggles `isActive` -> returns `200 OK` and persists update.
       - Customer updates -> returns `403 Forbidden`.
       - Guest updates -> returns `401 Unauthorized`.
       - Non-existent ID -> returns `404 Not Found`.
     - `DELETE /api/products/:id`:
       - Admin deletes product -> returns `200 OK` and removes from DB.
       - Staff deletes product -> returns `200 OK` and removes from DB.
       - Customer deletes product -> returns `403 Forbidden`.
       - Guest deletes product -> returns `401 Unauthorized`.
       - Non-existent ID -> returns `404 Not Found`.
  2. **Gate 2 - Search**:
     - `GET /api/products?search=ao` -> returns matching products (name, description, brand, or category).
     - Case-insensitive search -> matches regardless of case ("AO" vs "ao").
     - Search with regex special characters -> handles safely without crashing.
     - Search with non-matching query -> returns `{ products: [], total: 0 }`.
  3. **Gate 3 - Multi-Filter, Sort & Pagination**:
     - Filter by `category` -> returns only products in that category.
     - Filter by `minPrice` & `maxPrice` -> returns only products within price range.
     - Filter by `inStock=true` -> returns only products with `stock > 0`.
     - Combined filters (`category` + `minPrice` + `inStock`) -> correct intersection.
     - Sorting: `price_asc` (ascending price), `price_desc` (descending price), `rating_desc` (descending rating), `name_asc` (A-Z).
     - Pagination: `page=1&limit=2` vs `page=2&limit=2` returns correct subsets and accurate `totalPages` & `total`.

### 5.2. Frontend Automated Test Suite
- **Command**: `npm --prefix shop-project/frontend test -- src/pages/admin/AdminProductsPage.test.jsx src/pages/ProductsPage.test.jsx --run`
- **Runner**: Vitest + React Testing Library (`frontend/package.json` -> `"test": "vitest"`)
- **Current Status**: Neither `src/pages/admin/AdminProductsPage.test.jsx` nor `src/pages/ProductsPage.test.jsx` exists yet. They must be authored by the Tester agent.
- **Required Test Cases**:
  1. `src/pages/admin/AdminProductsPage.test.jsx`:
     - Renders admin page title, action buttons, and product table with column headers.
     - Fetches and displays product list from `/api/products`.
     - Opens Create Product modal on clicking "Thêm Sản Phẩm", validates inputs, and submits `POST /api/products`.
     - Opens Edit Product modal on clicking Edit icon, pre-populates form, and submits `PUT /api/products/:id`.
     - Toggles product `isActive` status via single click on table status badge/button (dispatches PUT).
     - Deletes product after user confirms prompt (dispatches DELETE and updates UI table).
     - Enforces RBAC visibility (Admin and Staff can view and operate).
  2. `src/pages/ProductsPage.test.jsx`:
     - Renders public product catalog header, search bar, filter controls, sort dropdown, and product grid cards.
     - Product cards correctly render thumbnail, category, title, formatted price (e.g. `250.000₫`), discount tag, and stock status.
     - Debounced search input: typing updates query after 300ms delay.
     - Displays Empty State when search or filter returns 0 products, with "Xóa tìm kiếm" button that resets query.
     - Filters by category, price bounds (`minPrice`, `maxPrice`), and inStock toggle.
     - Changes sort order via dropdown.
     - Navigates pagination controls (Prev/Next/Page numbers).
     - Synchronizes all states with URL query string (`useSearchParams`).

---

## 6. Implementation Gap Analysis

| Component | File Path | Existing State | Required Changes |
|-----------|-----------|----------------|------------------|
| Backend Model | `backend/src/models/productModel.js` | Implemented with all required fields & text/compound indexes. | Verified complete and valid. |
| Backend Controller | `backend/src/controllers/productController.js` | Implemented `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct`. | Add regex escaping for special characters in search; sanitize empty price filter values; ensure customer requests strictly enforce `isActive=true`. |
| Backend Routes | `backend/src/routes/productRoutes.js` | Implemented with `optionalAuth`, `protect`, `isStaffOrAdmin`. | Verified complete and valid. |
| Backend Test | `backend/tests/product.test.js` | **Missing** | Create comprehensive test suite testing CRUD, RBAC (Admin/Staff/Customer/Guest), validation, search, filters, sort, pagination. |
| Frontend Admin Page | `frontend/src/pages/admin/AdminProductsPage.jsx` | **Missing** | Create clean table, 1-click status toggle, modal CRUD, search/filter toolbar. |
| Frontend Admin Test | `frontend/src/pages/admin/AdminProductsPage.test.jsx` | **Missing** | Create Vitest test suite for Admin table, modal, 1-click toggle, delete, and RBAC. |
| Frontend Catalog Page | `frontend/src/pages/ProductsPage.jsx` | **Missing** (currently `/products` routes to `HomePage`) | Create public catalog grid with 300ms debounced search, empty state, filters, sorting, pagination, and `useSearchParams` sync. |
| Frontend Catalog Test | `frontend/src/pages/ProductsPage.test.jsx` | **Missing** | Create Vitest test suite testing debounced search, empty state, multi-filter, sort, and URL sync. |
| Frontend App Routing | `frontend/src/App.jsx` | Points `/products` to `HomePage`; missing `/admin/products`. | Route `/products` -> `<ProductsPage />`; add `<Route path="products" element={<AdminProductsPage />} />` under `/admin`. |
| Frontend Sidebar | `frontend/src/components/admin/Sidebar.jsx` | Has Dashboard, Users, Coupons. Missing Products. | Add `Product Management` (`/admin/products`, icon: `ShoppingBag`, roles: `['admin', 'staff']`). |

---

## 7. Recommended Execution Order for Subagents

1. **Backend Agent**:
   - Sanitize `productController.js` for regex escaping and customer `isActive` lockdown.
   - Verify `server.js` and `productRoutes.js` integration.
2. **Tester Agent (Backend Test First)**:
   - Create `backend/tests/product.test.js` covering all Gate 1, Gate 2, Gate 3 requirements.
   - Run `npm --prefix shop-project/backend test -- tests/product.test.js` to achieve 100% pass.
3. **Frontend Agent**:
   - Create `frontend/src/pages/admin/AdminProductsPage.jsx` (Minimal Code, table, modal, 1-click toggle).
   - Create `frontend/src/pages/ProductsPage.jsx` (Responsive catalog grid, 300ms debounce, empty state, multi-filter, sort, URL sync).
   - Update `frontend/src/App.jsx` and `frontend/src/components/admin/Sidebar.jsx`.
4. **Tester Agent (Frontend Tests)**:
   - Create `frontend/src/pages/admin/AdminProductsPage.test.jsx` and `frontend/src/pages/ProductsPage.test.jsx`.
   - Run `npm --prefix shop-project/frontend test -- src/pages/admin/AdminProductsPage.test.jsx src/pages/ProductsPage.test.jsx --run` to achieve 100% pass.
5. **Final Review & Report at Gate 3**:
   - Verify full end-to-end integration and run all automated suites.
   - Present final milestone summary.
