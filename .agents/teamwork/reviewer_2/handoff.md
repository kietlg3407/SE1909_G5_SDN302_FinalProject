# Handoff Report: Security & RBAC Review (Member 2: Product Module)

**Reviewer**: Reviewer 2 (Security & RBAC Reviewer / Adversarial Critic)  
**Date**: 2026-10-30  
**Target Module**: Member 2 - Product (Management, Search, Filter & Sort)  
**Verdict**: **APPROVE**

---

## 1. Observation

Direct observations from source inspection, database probing, and test execution:

1. **Route RBAC Protection**:
   - File: `shop-project/backend/src/routes/productRoutes.js`
     * Line 33: `router.post('/', protect, isStaffOrAdmin, createProduct);`
     * Line 34: `router.put('/:id', protect, isStaffOrAdmin, updateProduct);`
     * Line 35: `router.delete('/:id', protect, isStaffOrAdmin, deleteProduct);`
     * Line 29: `router.get('/', optionalAuth, getProducts);`
     * Line 30: `router.get('/:id', getProductById);`
   - All mutating endpoints (`POST`, `PUT`, `DELETE`) are guarded sequentially by `protect` and `isStaffOrAdmin`.

2. **Middleware Implementation**:
   - File: `shop-project/backend/src/middlewares/authMiddleware.js`
     * Lines 4-24 (`protect`): Validates `Authorization: Bearer <token>`, decodes JWT via `jwt.verify`, queries database for user omitting password, and yields `401 Unauthorized` for missing, malformed, or expired tokens.
     * Lines 34-42 (`isStaffOrAdmin`): Checks `req.user.role === 'admin' || req.user.role === 'staff'`. If not matched (e.g. role `'customer'`), returns `403 Forbidden` with message `'Bạn không có quyền truy cập. Chỉ quản trị viên hoặc nhân viên mới được phép.'`.

3. **Input Sanitization & Injection Defense**:
   - File: `shop-project/backend/src/controllers/productController.js`
     * **Visibility (`isActive`) Enforcement** (Lines 18-25):
       ```javascript
       const isStaffOrAdminReq = req.user && ['admin', 'staff'].includes(req.user.role);
       if (isStaffOrAdminReq) {
         if (req.query.isActive !== undefined) {
           query.isActive = req.query.isActive === 'true';
         }
       } else {
         query.isActive = true;
       }
       ```
       Non-admin/non-staff users are strictly constrained to `query.isActive = true`. Live testing confirmed that requesting `GET /api/products?isActive=false` as a public user returns only active items (ignoring `?isActive=false`).
     * **Keyword Regex Escaping** (Lines 28-38):
       Parameter is checked for string type and special characters are escaped with `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before constructing `new RegExp(sanitizedSearch, 'i')`.
     * **Numeric Sanitization & Query Pollution Protection** (Lines 40-72):
       `rawSearch`, `rawCategory`, and `rawBrand` safely unpack array queries (`Array.isArray(x) ? x[0] : x`) and verify `typeof === 'string'`. `minPrice` and `maxPrice` are converted using `Number()` and guarded with `!isNaN()`. Non-numeric or object inputs (e.g., `minPrice[$gt]=0`) evaluate to `NaN` and are discarded.
     * **Pagination Bounds** (Lines 11-12):
       `page = Math.max(1, parseInt(req.query.page) || 1)`
       `limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12))` prevents pagination DoS/memory exhaustion attacks.
     * **ObjectId Validation** (Lines 127, 198, 242):
       `!mongoose.Types.ObjectId.isValid(id)` guards `getProductById`, `updateProduct`, and `deleteProduct`, returning HTTP `404` instead of throwing unhandled `CastError` exceptions.
     * **Mass Assignment Protection** (Lines 171-181, 214-226):
       Mutation handlers whitelist explicitly defined product attributes (`name`, `description`, `price`, `originalPrice`, `category`, `brand`, `stock`, `images`, `isActive`). Critical metadata (`rating`, `numReviews`, `__v`) cannot be spoofed by callers.

4. **Default Test Accounts Compliance**:
   - Standard credentials defined in `PROJECT.md` and `AGENTS.md`:
     * Admin: `admin@shop.com` / `admin123`
     * Staff: `staff@shop.com` / `staff123`
     * Customer: `customer@shop.com` / `password123`
   - Verified in `tests/product.test.js`: All 3 standard accounts are seeded and authenticated to obtain valid JWTs for RBAC verification.

5. **Test Suite Verification Execution**:
   - Backend automated tests:
     Command: `node --test tests/product.test.js`
     Result: **30 passed, 0 failed** across all 3 gates in 2.16s:
     * Gate 1 (CRUD & RBAC): 17/17 passed (TC-GATE1-01 to TC-GATE1-17)
     * Gate 2 (Search & Regex Sanitization): 5/5 passed (TC-GATE2-01 to TC-GATE2-05)
     * Gate 3 (Filter, Sort, Pagination): 8/8 passed (TC-GATE3-01 to TC-GATE3-08)
   - Frontend Product test suites:
     Command: `npm --prefix shop-project/frontend test -- src/pages/ProductsPage.test.jsx src/pages/admin/AdminProductsPage.test.jsx --run`
     Result: **18 passed, 0 failed** (2 test suites, 100% green).

6. **Integrity Audit**:
   - Inspected source code for facade patterns, fake mock returns, or hardcoded test expectations: NONE found. Real MongoDB collections, Mongoose models, and Express middleware are engaged throughout.

---

## 2. Logic Chain

1. **RBAC Boundaries**:
   From Observation 1 and 2, every mutating endpoint (`POST`, `PUT`, `DELETE`) requires `protect` and `isStaffOrAdmin`. A caller without token receives `401`. A customer token passes `protect` but fails `isStaffOrAdmin`, receiving `403`. Admin and Staff tokens pass both middlewares, allowing execution. This adheres to `PROJECT.md` Interface Contracts.

2. **Access Control & Catalog Isolation**:
   From Observation 3, public users cannot inspect deactivated products even by appending `?isActive=false` to queries. The backend enforces `query.isActive = true` whenever the requester is not an authenticated Admin or Staff user.

3. **Sanitization & Attack Surface Defense**:
   From Observation 3, regex special characters (`.*+?^${}()|[]\\`) are escaped prior to regex instantiation, preventing Regular Expression Denial of Service (ReDoS) or regex-based data extraction. Array-polluted query parameters are normalized. Price boundaries cannot be polluted with NoSQL operator objects. Malformed ObjectIds return `404`, avoiding error disclosure.

4. **Test Verification**:
   From Observation 5, all 30 backend tests pass against the real MongoDB database, covering every RBAC permutation, parameter validation, search, filter, and pagination rule. The frontend tests similarly confirm proper client-side integration.

---

## 3. Caveats

1. **Single Item Public Lookup (`GET /api/products/:id`)**:
   Currently, `getProductById` does not filter out `isActive: false` products, nor does it require authentication. While standard for direct URL links in some e-commerce systems, if future requirements dictate that deactivated products must be completely hidden from public access on direct ID lookups, an `isActive: true` check (or `optionalAuth` check) can be considered. This does not violate current Member 2 specifications.
2. **Jest Test Runner Note**:
   In `shop-project/backend`, running `npm test` invokes Jest which hangs due to open database handles/console interception in `tests/setup.js`. However, running `node --test tests/product.test.js` executes the entire suite in ~2 seconds with 100% pass rate.

---

## 4. Conclusion

The Product module implementation demonstrates rigorous Role-Based Access Control, robust input sanitization, and solid defensive engineering against common web vulnerabilities (ReDoS, NoSQL injection, parameter pollution, mass assignment). All requirements for Member 2 (Gates 1, 2, and 3) are fully met with high quality.

**Final Verdict**: **APPROVE**

---

## 5. Verification Method

To independently verify these conclusions:

1. **Run Backend Test Suite**:
   ```bash
   cd c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\shop-project\backend
   node --test tests/product.test.js
   ```
   *Expected*: 30 passed, 0 failed (duration ~2s).

2. **Run Frontend Product Test Suites**:
   ```bash
   npm --prefix shop-project/frontend test -- src/pages/ProductsPage.test.jsx src/pages/admin/AdminProductsPage.test.jsx --run
   ```
   *Expected*: 18 passed, 0 failed.

3. **Inspect Key Source Files**:
   - Routes: `shop-project/backend/src/routes/productRoutes.js` (lines 28-36)
   - Controller: `shop-project/backend/src/controllers/productController.js` (lines 18-26 for `isActive`, 28-38 for `search`, 40-70 for filters, 127/198/242 for ObjectId validation)
   - Middleware: `shop-project/backend/src/middlewares/authMiddleware.js` (lines 4-24 for `protect`, 34-42 for `isStaffOrAdmin`)
