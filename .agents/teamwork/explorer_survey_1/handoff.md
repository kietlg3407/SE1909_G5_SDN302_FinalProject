# Handoff Report: Backend Architecture Survey for Product Module

**Agent**: Backend Architecture Explorer (`explorer_survey_1`)  
**Parent / Recipient**: Project Orchestrator (`24b5d4d8-e9a1-4e4f-9341-e3b448a1c5b0`)  
**Date**: 2026-10-30  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

1. **Server Entry Point & Route Mount**:
   - In `shop-project/backend/server.js`, line 31:
     ```javascript
     app.use('/api/products', require('./src/routes/productRoutes'));
     ```
   - In lines 71-76:
     ```javascript
     if (process.env.NODE_ENV !== 'test') {
       startServer();
     }
     module.exports = app;
     ```
     The Express `app` instance is exported directly and does not start an HTTP listener when `NODE_ENV === 'test'`, allowing clean supertest integration.

2. **Auth Middleware & RBAC**:
   - In `shop-project/backend/src/middlewares/authMiddleware.js`, lines 34-42:
     ```javascript
     const isStaffOrAdmin = (req, res, next) => {
       if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
         return next();
       }
       return res.status(403).json({
         message: 'Bạn không có quyền truy cập. Chỉ quản trị viên hoặc nhân viên mới được phép.',
       });
     };
     ```
   - In `shop-project/backend/src/models/userModel.js`, line 18:
     ```javascript
     role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' }
     ```

3. **Product Model & Schema**:
   - In `shop-project/backend/src/models/productModel.js`, lines 3-63:
     Fields defined include `name`, `description`, `price`, `originalPrice`, `category`, `brand`, `stock`, `images`, `rating`, `numReviews`, `isActive`, and `timestamps`.
   - Lines 66-67 define compound indexes:
     ```javascript
     productSchema.index({ name: 'text', description: 'text', brand: 'text' });
     productSchema.index({ category: 1, price: 1, isActive: 1 });
     ```

4. **Product Routes & Controller**:
   - In `shop-project/backend/src/routes/productRoutes.js`:
     ```javascript
     router.get('/', optionalAuth, getProducts);
     router.get('/:id', getProductById);
     router.post('/', protect, isStaffOrAdmin, createProduct);
     router.put('/:id', protect, isStaffOrAdmin, updateProduct);
     router.delete('/:id', protect, isStaffOrAdmin, deleteProduct);
     ```
   - In `shop-project/backend/src/controllers/productController.js`:
     - `getProducts`: handles `page`, `limit`, `search`, `category`, `minPrice`, `maxPrice`, `inStock`, and `sortBy`.
     - `createProduct`: validates mandatory fields (`name`, `description`, `price`, `category`, `stock`), saves to DB, returns 201.
     - `updateProduct`: allows partial updates, saves to DB, returns 200.
     - `deleteProduct`: calls `findByIdAndDelete`, returns 200.

5. **Test Runners & Test Files**:
   - In `shop-project/backend/package.json`:
     `"test": "jest"`
   - In `shop-project/backend/jest.config.js`:
     `testEnvironment: 'node'`, `setupFilesAfterEnv: ['<rootDir>/tests/setup.js']`.
   - File `shop-project/backend/tests/product.test.js` is **missing** (does not exist).
   - In `shop-project/backend/tests/staff-coupon-rbac.test.js`, running `node --test tests/staff-coupon-rbac.test.js` exited code 0 (13/13 passing tests) against `mongodb://127.0.0.1:27017/shop_test`.
   - MongoDB connection command `node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://127.0.0.1:27017/shop-project').then(() => console.log('MONGO_CONNECTED'))"` returned `MONGO_CONNECTED` with exit code 0.

---

## 2. Logic Chain

1. From **Observation 1**, `server.js` mounts `/api/products` and exports `app` while skipping server start when `NODE_ENV === 'test'`. Therefore, supertest can import `app` directly for test suites without port clashes.
2. From **Observation 2 & 4**, `productRoutes.js` guards `POST`, `PUT`, and `DELETE` endpoints with `protect` and `isStaffOrAdmin`. Any requests from customers or unauthenticated users will be rejected with HTTP 403 or 401 respectively, fulfilling requirement R1 RBAC specifications.
3. From **Observation 3 & 4**, `productModel.js` and `productController.js` already contain full definitions matching R1, R2, and R3 (Unified `getProducts` handling search, category/price/stock filtering, sorting, and pagination).
4. From **Observation 4**, `productController.js` creates a `new RegExp(req.query.search.trim(), 'i')` without escaping regex characters. If a search string contains characters like `(` or `[`, a `SyntaxError` will be caught and return 500. Sanitizing the keyword with `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` will prevent this edge-case failure.
5. From **Observation 5**, `tests/product.test.js` does not exist. However, the testing infrastructure (Jest 29, Supertest 6, active MongoDB test database) is operational. Therefore, the Tester agent can create `tests/product.test.js` targeting `npm --prefix shop-project/backend test -- tests/product.test.js` to verify all R1-R3 functionality.

---

## 3. Caveats

- **Frontend Scope**: This survey focused strictly on the backend architecture. Frontend components (`ProductsPage.jsx`, `AdminProductsPage.jsx`) were observed to be missing in `shop-project/frontend/src/pages/`, but detailed UI layout analysis belongs to the frontend explorer/developer agents.
- **Legacy Test File Issue**: Blanket `npm test` without path argument fails on unrelated legacy test files (`tests/coupon.test.js` mock bug and `node:test` runner files). Running the specific test command `npm --prefix shop-project/backend test -- tests/product.test.js` avoids this completely.

---

## 4. Conclusion

The backend architecture is in a highly advanced state:
1. Core models (`productModel.js`), routes (`productRoutes.js`), and controllers (`productController.js`) are already implemented and conform to the Minimal Code Principle and `SKILL.md`.
2. Role-based access control with `admin`, `staff`, and `customer` accounts is functional and secured via `isStaffOrAdmin`.
3. The only necessary backend refinements are minor input sanitizations in `productController.js` (regex character escaping for search and ObjectId validation for detail/update/delete).
4. The backend automated test suite `tests/product.test.js` must be created by the Tester agent to cover RBAC, CRUD, Search, Filter/Sort, and error cases.

---

## 5. Verification Method

To verify these findings:
1. **Verify MongoDB Connection**:
   ```powershell
   node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://127.0.0.1:27017/shop-project').then(() => { console.log('OK'); process.exit(0); })"
   ```
2. **Verify Server App Import in Test Mode**:
   ```powershell
   node -e "process.env.NODE_ENV='test'; const app = require('./server'); console.log('APP_LOADED'); process.exit(0);"
   ```
3. **Verify Auth Middleware Exports**:
   ```powershell
   node -e "const { protect, isStaffOrAdmin } = require('./src/middlewares/authMiddleware'); console.log(typeof protect, typeof isStaffOrAdmin);"
   ```
4. **Verify Product Route & Controller Files Exist**:
   Inspect `shop-project/backend/src/routes/productRoutes.js` and `shop-project/backend/src/controllers/productController.js`.
