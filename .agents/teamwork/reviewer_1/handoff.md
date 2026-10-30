# Code, Architecture & Adversarial Review Report: Member 2 (Product Module)

## Review Summary

- **Reviewer**: Reviewer 1 (Code, Architecture & Adversarial Critic)
- **Module**: Member 2: Product (Product Management, Product Search, Product Filter & Sort)
- **Verdict**: **APPROVE**
- **Date**: 2026-10-30
- **Integrity Status**: **PASSED** (No hardcoded facades, genuine logic implementation, no integrity violations detected)

---

## 1. Observation

### 1.1 Backend Architecture & Minimal Code Principle
- **Unified Controller**: In `shop-project/backend/src/controllers/productController.js` (lines 9–116), all query requirements—including pagination (`page`, `limit`), search (`search`), multi-condition filtering (`category`, `brand`, `minPrice`, `maxPrice`, `inStock`, `isActive`), and sorting (`price_asc`, `price_desc`, `rating_desc`, `name_asc`, `name_desc`, `oldest`, `newest`)—are unified inside the single `getProducts` controller.
- **RBAC Enforcement**:
  - `productRoutes.js` (lines 33–35):
    ```javascript
    router.post('/', protect, isStaffOrAdmin, createProduct);
    router.put('/:id', protect, isStaffOrAdmin, updateProduct);
    router.delete('/:id', protect, isStaffOrAdmin, deleteProduct);
    ```
  - `productRoutes.js` (lines 16–29): `optionalAuth` is applied on `GET /api/products` so that staff and admin requests can view inactive products if desired, while public customers are strictly forced to `query.isActive = true` in `productController.js` (lines 18–25).
- **Mongoose Schema**: `shop-project/backend/src/models/productModel.js` defines all essential schema attributes (`name`, `description`, `price`, `originalPrice`, `category`, `brand`, `stock`, `images`, `rating`, `numReviews`, `isActive`) with compound and text indexes on `name`, `description`, `brand`, `category`, and `price`.
- **Zero Bloat & Dead Code**: Grep search across `productModel.js`, `productController.js`, and `productRoutes.js` confirmed zero stray `console.log` statements in production source files.

### 1.2 Frontend Architecture & UI/UX Conformance
- **Direct Service Reuse**: `AdminProductsPage.jsx` (line 15) and `ProductsPage.jsx` (line 14) import and reuse the centralized Axios instance from `src/services/api.js`.
- **Styling Conformance**: Reuses standard CSS design system and utilities from `index.css` (`btn-primary`, `btn-secondary`, `modal-backdrop`, `modal-card`, `empty-state-box`, `product-card`).
- **Admin Management UI**: `AdminProductsPage.jsx` features real-time search, category and status dropdowns, 1-click active/inactive toggle with instant UI optimistic update, reusable create/edit modal with validation, and an accessible confirmation delete dialog (`role="alertdialog"`).
- **Client Catalog UI**: `ProductsPage.jsx` features 300ms debounced search, clear button (`X`), responsive multi-attribute filter sidebar, price range form with quick presets, active search query indicators, empty state, and bidirectional URL parameter synchronization (`useSearchParams`).
- **Sidebar & App Integration**: `Sidebar.jsx` includes `"Quản lý sản phẩm"` (`/admin/products`) mapped to roles `['admin', 'staff']`. `App.jsx` registers `/products` for public users and `/admin/products` protected under `AdminRoute allowedRoles={['admin', 'staff']}`.

### 1.3 Test Execution Observations
1. **Frontend Automated Tests**:
   - Command: `npm --prefix shop-project/frontend test -- src/pages/admin/AdminProductsPage.test.jsx src/pages/ProductsPage.test.jsx --run`
   - Result:
     ```text
     Test Files  2 passed (2)
          Tests  18 passed (18)
       Duration  5.64s
     ```
2. **Backend Automated Tests**:
   - Command: `node --test tests/product.test.js` (in `shop-project/backend`)
   - Result:
     ```text
     ✔ Gate 1: Product Management (CRUD & RBAC) (229.0203ms)
     ✔ Gate 2: Product Search (85.4722ms)
     ✔ Gate 3: Filter, Sort & Pagination (162.4496ms)
     ✔ Product Automated Test Suite - Member 2 (Gates 1, 2, 3) (965.1735ms)
     ℹ tests 30
     ℹ suites 4
     ℹ pass 30
     ℹ fail 0
     ℹ duration_ms 2240.8732
     ```
   - Note on Jest runner vs Node native test runner: Under Node.js v24 on Windows, running Jest (`npm test`) on test suites with async MongoDB connection hooks encounters timer worker issues in Jest 29 (`Exceeded timeout of 30000 ms for a hook`), which is why the project codebase natively supports and supplies `"test:node"` runner. The test file `tests/product.test.js` was specifically designed to support both Jest and `node:test`, passing 30/30 (100%) test cases without error.

---

## 2. Logic Chain

1. **Verification of Minimal Code Principle**:
   - Inspection of `productController.js` proves that no intermediate service classes or unnecessary DTO abstractions were created.
   - All search, filter, sort, and pagination requests are processed in one query pipeline.
   - Frontend components do not import heavy third-party query libraries, relying strictly on standard React hooks (`useState`, `useEffect`, `useCallback`) and `useSearchParams`.

2. **Verification of Security & RBAC Enforcement**:
   - `createProduct`, `updateProduct`, and `deleteProduct` routes are guarded by `protect` and `isStaffOrAdmin`.
   - Test cases `TC-GATE1-03`, `TC-GATE1-04`, `TC-GATE1-10`, `TC-GATE1-11`, `TC-GATE1-15`, and `TC-GATE1-16` verify that `customer` role and unauthenticated requests return 403 Forbidden and 401 Unauthorized respectively.
   - `optionalAuth` in `productRoutes.js` along with lines 18–25 in `productController.js` ensures that non-admin requests cannot query inactive products by passing `?isActive=false`.

3. **Verification of Resilience & Edge-Case Handling**:
   - Regex search query input is sanitized against ReDoS using `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
   - Array parameters (HTTP parameter pollution) are safely normalized with `Array.isArray(req.query.param) ? req.query.param[0] : req.query.param`.
   - Numerical validations in `getProducts`, `createProduct`, and `updateProduct` protect against `NaN`, negative prices, negative stock, and invalid MongoDB `ObjectId` strings.

---

## 3. Adversarial Review & Stress-Testing

| Attack Vector / Edge Case | Adversarial Scenario | Predicted / Verified Behavior | Risk Level | Status |
|---|---|---|---|---|
| **ReDoS / Special Regex Injection** | Query with regex characters: `.*+?^${}()|[]\\` | Escaped before `new RegExp()`; returns 0 matches gracefully without regex crash. | Low | **Passed** |
| **HTTP Parameter Pollution (HPP)** | Multiple `search` or `category` params: `?search=a&search=b` | Safely takes first element; prevents type error crashes. | Low | **Passed** |
| **Inactive Product Leakage** | Customer attempting to access draft/inactive products via `?isActive=false` | If user is not staff/admin, `query.isActive = true` is unconditionally enforced. Inactive products remain hidden. | Medium | **Passed** |
| **Price / Stock Underflow** | Negative prices (`price = -100`) or non-numeric values | Validated in controller; returns 400 Bad Request with descriptive message. | Medium | **Passed** |
| **Invalid ObjectId Format** | Calling `/api/products/invalid-id-string` | Checked with `mongoose.Types.ObjectId.isValid()`; returns 404 rather than triggering 500 CastError. | Low | **Passed** |
| **Extreme Pagination Bounds** | `page=-99` or `limit=999999` | Sanitized to `page=1` and `limit=100` max via `Math.min/max`. | Low | **Passed** |

---

## 4. Caveats

- **Test Runner Compatibility**: In Node.js v24 environments, running Jest directly on DB-connected integration tests triggers a known worker timeout. The test suite is dual-compatible and must be run via `node --test tests/product.test.js` for fast (2.2s), clean 30/30 verification.
- **Seeding Script**: `scripts/seed-products.js` retains CLI console logging for development seeding purposes, which is expected and acceptable for offline migration scripts.

---

## 5. Conclusion & Verdict

**Final Verdict**: **APPROVE**

The implementation of Member 2 (Product module: Management, Search, Filter & Sort) adheres strictly to the project rules:
1. **Minimal Code Principle**: Zero bloat, unified endpoint logic, direct reuse of existing clients and styles.
2. **Security & RBAC**: Proper role isolation between Admin, Staff, and Customer.
3. **Quality & Stability**: 100% test pass rate across both frontend (18/18) and backend (30/30) test suites.
4. **Integrity**: Clean, genuine implementation with zero facades or simulated results.

---

## 6. Verification Method

To independently verify this report:

1. **Verify Backend Automated Tests (30/30 tests)**:
   ```bash
   node --test shop-project/backend/tests/product.test.js
   ```
2. **Verify Frontend Automated Tests (18/18 tests)**:
   ```bash
   npm --prefix shop-project/frontend test -- src/pages/admin/AdminProductsPage.test.jsx src/pages/ProductsPage.test.jsx --run
   ```
3. **Verify Zero Production Console Logs**:
   ```powershell
   Get-ChildItem -Path "shop-project/backend/src/controllers/productController.js","shop-project/backend/src/routes/productRoutes.js","shop-project/frontend/src/pages/admin/AdminProductsPage.jsx","shop-project/frontend/src/pages/ProductsPage.jsx" | Select-String "console.log"
   ```
