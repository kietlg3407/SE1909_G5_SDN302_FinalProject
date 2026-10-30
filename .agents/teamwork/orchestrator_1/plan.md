# Project Execution Plan - Member 2: Product Module

## Overview
Implement Member 2: Product module (Product Management, Product Search, Product Filter & Sort) for Shop Quần Áo (Node.js/Express/MongoDB + React 19/Vite).
**STRICT USER DIRECTIVE**: Must STOP, REPORT & CONFIRM at each gate:
- **Gate 1 (Phần 4 - Product Management)**: When CRUD Admin, Staff/Admin RBAC, Customer Catalog & tests are complete -> **MUST STOP, REPORT TO PM/USER, AND WAIT FOR EXPLICIT USER APPROVAL** before touching Gate 2.
- **Gate 2 (Phần 5 - Product Search)**: When Search features & tests are complete -> **MUST STOP, REPORT, AND WAIT FOR USER APPROVAL** before Gate 3.
- **Gate 3 (Phần 6 - Product Filter & Sort)**: When Filter, Sort & URL Sync and full tests pass -> **STOP AND REPORT OVERALL FOR MEMBER 2**.

## 4 Sub-Agent Operational Model
1. **Sub-agent UI/UX**: Designs wireframes, UI specs, minimal layout for Admin and Catalog. Enters Idle upon spec completion.
2. **Sub-agent Backend**: Mongoose schema (`productModel.js`), unified `getProducts` controller, CRUD routes, and RBAC (`protect`, `isStaffOrAdmin`). Enters Idle upon API & test pass.
3. **Sub-agent Frontend**: `AdminProductsPage` (table, CRUD modal, status toggle), `ProductsPage` (catalog grid), search bar (300ms debounce, clear, empty state), multi-filters, sorting, and URL sync. Enters Idle upon UI completion.
4. **Sub-agent Tester**: Automated test suites for Backend (`tests/product.test.js`) and Frontend (`AdminProductsPage.test.jsx`, `ProductsPage.test.jsx`), RBAC verification using default test accounts (`admin@shop.com`, `staff@shop.com`, `customer@shop.com`). Enters Idle when test suite is 100% green.

## Milestones & Execution Stages

### Stage 0: Survey & Project Mapping (In Progress)
- Parallel survey of backend, frontend, and test infrastructure.
- Synthesize findings into `PROJECT.md` (Feature Inventory, Architecture, Code Layout, Interfaces).

### Stage 1: Gate 1 - Product Management (Phần 4: CRUD & Catalog)
- **UI/UX Specs**: Table structure, modal fields, catalog card.
- **Backend Implementation**: `productModel.js`, `productController.js` (createProduct, updateProduct, deleteProduct, getProductById, initial getProducts), `productRoutes.js`, RBAC integration (`protect`, `isStaffOrAdmin`).
- **Frontend Implementation**: Admin products route (`/admin/products`), sidebar link, CRUD modal, status toggle, Catalog display (`/products`).
- **Testing & Verification**: Backend & Frontend automated test suites pass 100% with default test accounts.
- **STOP & REPORT GATE 1**: **HALT ALL EXECUTION. Send comprehensive report to Parent/PM and await explicit User confirmation.** DO NOT touch Stage 2 / Gate 2 until confirmed.

### Stage 2: Gate 2 - Product Search (Phần 5) [PENDING USER APPROVAL]
- **Backend Integration**: Text search/regex indexing on `name` and `description` in unified `getProducts`.
- **Frontend Integration**: Search input with 300ms debounce, clear button, loading state, empty state illustration/notice.
- **Testing & Verification**: Search keyword tests in backend and frontend pass 100%.
- **STOP & REPORT GATE 2**: **HALT ALL EXECUTION. Send report to Parent/PM and await explicit User confirmation.**

### Stage 3: Gate 3 - Product Filter, Sort & URL Query Sync (Phần 6) [PENDING USER APPROVAL]
- **Backend Integration**: Complete multi-filter (`category`, `minPrice`, `maxPrice`, `inStock`), `sortBy` (price-asc, price-desc, newest, rating), pagination (`page`, `limit`) in `getProducts`.
- **Frontend Integration**: Filter sidebar/drawer, sort dropdown, pagination controls, URL params synchronization (`useSearchParams`).
- **Comprehensive Testing**: Full test suites run across all features with default test accounts.
- **Forensic Audit & Gate Review**: Independent integrity verification and adversarial test checks.
- **FINAL STOP & OVERALL REPORT**: Comprehensive summary of all Member 2 deliverables.
