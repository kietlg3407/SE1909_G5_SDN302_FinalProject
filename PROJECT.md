# Project: Shop Quần Áo - Member 2: Product Module

## Architecture
- **Tech Stack**:
  - Backend: Node.js, Express, MongoDB (Mongoose), Jest, Supertest.
  - Frontend: React 19, Vite, Tailwind/Custom CSS tokens (`index.css`), React Router DOM v7, Axios, Lucide React, Vitest, Testing Library.
- **Architectural Principles**:
  - Minimal Code Principle (AGENTS.md): Zero boilerplate, no unnecessary classes/wrappers, single unified controller `getProducts` for query/search/filter/sort/pagination.
  - Direct reuse of `src/services/api.js` Axios instance, `src/index.css` design tokens and modal classes.
  - Strict Role-Based Access Control (RBAC): `admin` and `staff` have CRUD rights; `customer` has read-only access (403 on mutations); unauthenticated requests receive 401 on mutations.
- **3 Control Gates**:
  - **Gate 1 (Phần 4)**: Product Management (CRUD Admin + Catalog Display + RBAC). **MUST STOP, REPORT, AND AWAIT USER APPROVAL.**
  - **Gate 2 (Phần 5)**: Product Search (Keyword, 300ms debounce, empty state). **MUST STOP, REPORT, AND AWAIT USER APPROVAL.**
  - **Gate 3 (Phần 6)**: Product Filter, Sort & URL Sync (Multi-filter, sort, pagination, `useSearchParams`). **FINAL OVERALL REPORT.**

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Product Schema & Model | Mongoose schema with `name`, `description`, `price`, `originalPrice`, `category`, `brand`, `stock`, `images`, `rating`, `numReviews`, `isActive`, timestamps, indexes. | M1 (Gate 1) | ORIGINAL_REQUEST §R1 |
| 2 | Unified Controller & CRUD Routes | RESTful routes (`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`) in `productController.js` and `productRoutes.js`. | M1 (Gate 1) | ORIGINAL_REQUEST §R1 |
| 3 | RBAC Middleware Integration | `protect` and `isStaffOrAdmin` middlewares guarding POST/PUT/DELETE; `optionalAuth` on GET. | M1 (Gate 1) | ORIGINAL_REQUEST §R1 |
| 4 | Admin Products Page & Sidebar Link | `/admin/products` route in `App.jsx`, item in `Sidebar.jsx`, product table with status toggle, CRUD modal form. | M1 (Gate 1) | ORIGINAL_REQUEST §R1 |
| 5 | Public Products Catalog Grid | `/products` route rendering `ProductsPage.jsx` with responsive grid of product cards. | M1 (Gate 1) | ORIGINAL_REQUEST §R1 |
| 6 | Automated Test Suite for Gate 1 | Backend `tests/product.test.js` & Frontend `AdminProductsPage.test.jsx`, `ProductsPage.test.jsx` for CRUD and RBAC. | M1 (Gate 1) | ORIGINAL_REQUEST §Verification |
| 7 | Product Search Query Backend | Keyword text/regex query support in `getProducts` handling `search` parameter with special character escaping. | M2 (Gate 2) | ORIGINAL_REQUEST §R2 |
| 8 | Search UI & Debounce UX | Search input with 300ms debounce, instant clear "X" button, loading spinner, and empty state message/illustration. | M2 (Gate 2) | ORIGINAL_REQUEST §R2 |
| 9 | Automated Test Suite for Search | Backend and Frontend tests verifying keyword search, debounced input, and empty state. | M2 (Gate 2) | ORIGINAL_REQUEST §Verification |
| 10 | Multi-Filter Attributes | Filter by `category`, `minPrice`, `maxPrice`, and `inStock` in `getProducts` controller and frontend filter sidebar. | M3 (Gate 3) | ORIGINAL_REQUEST §R3 |
| 11 | Sort & Pagination | Sort by price asc/desc, newest, rating. Pagination with page and limit controls. | M3 (Gate 3) | ORIGINAL_REQUEST §R3 |
| 12 | URL Search Params Synchronization | Synchronizing search, filter, sort, and pagination state with URL query string via `useSearchParams`. | M3 (Gate 3) | ORIGINAL_REQUEST §R3 |
| 13 | Comprehensive Verification & Audit | Complete test suites pass 100%, Forensic Audit CLEAN, final overall delivery report. | M3 (Gate 3) | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Gate 1: Product Management | F1-F6: Backend input sanitization, AdminProductsPage with CRUD modal & toggle, Sidebar link, ProductsPage basic catalog, Backend & Frontend test suites. STOP & REPORT. | none | IN_PROGRESS |
| 2 | Gate 2: Product Search | F7-F9: Search query regex escaping, 300ms debounced search bar, clear button, empty state, search tests. STOP & REPORT. | Gate 1 approved | PLANNED |
| 3 | Gate 3: Product Filter, Sort & URL Sync | F10-F13: Multi-filters, sorting options, pagination, `useSearchParams` URL sync, full test suites & audit. FINAL REPORT. | Gate 2 approved | PLANNED |

## Interface Contracts

### Backend REST Endpoints
- `GET /api/products`:
  - Query params: `search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `page`, `limit`
  - Response: `{ success: true, count, total, totalPages, currentPage, products: [...] }`
  - Visibility: Public users see only `isActive: true`; Admin/Staff see all if requested.
- `GET /api/products/:id`:
  - Response: `{ success: true, product: { ... } }`
- `POST /api/products`:
  - Auth: Bearer JWT (`admin` or `staff`)
  - Body: `{ name, description, price, originalPrice, category, brand, stock, images, isActive }`
  - Response: `201 Created` -> `{ success: true, product: { ... } }`
- `PUT /api/products/:id`:
  - Auth: Bearer JWT (`admin` or `staff`)
  - Body: Partial product fields
  - Response: `200 OK` -> `{ success: true, product: { ... } }`
- `DELETE /api/products/:id`:
  - Auth: Bearer JWT (`admin` or `staff`)
  - Response: `200 OK` -> `{ success: true, message: 'Xóa sản phẩm thành công' }`

### Frontend Routes & Navigation
- `/admin/products`: Guarded by `AdminRoute` (`admin`, `staff`), renders `AdminProductsPage`.
- `/products`: Public route, renders `ProductsPage`.
- Sidebar entry: `{ label: 'Quản lý sản phẩm', path: '/admin/products', icon: Package, roles: ['admin', 'staff'] }`.

### Test Accounts
- Admin: `admin@shop.com` / `admin123`
- Staff: `staff@shop.com` / `staff123`
- Customer: `customer@shop.com` / `password123`

## Code Layout
- Backend:
  - `shop-project/backend/src/models/productModel.js` (Exclusive: Backend Worker)
  - `shop-project/backend/src/controllers/productController.js` (Exclusive: Backend Worker)
  - `shop-project/backend/src/routes/productRoutes.js` (Exclusive: Backend Worker)
  - `shop-project/backend/tests/product.test.js` (Exclusive: Tester Worker)
- Frontend:
  - `shop-project/frontend/src/App.jsx` (Exclusive: Frontend Worker)
  - `shop-project/frontend/src/components/admin/Sidebar.jsx` (Exclusive: Frontend Worker)
  - `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx` (Exclusive: Frontend Worker)
  - `shop-project/frontend/src/pages/ProductsPage.jsx` (Exclusive: Frontend Worker)
  - `shop-project/frontend/src/pages/admin/AdminProductsPage.test.jsx` (Exclusive: Tester Worker)
  - `shop-project/frontend/src/pages/ProductsPage.test.jsx` (Exclusive: Tester Worker)
