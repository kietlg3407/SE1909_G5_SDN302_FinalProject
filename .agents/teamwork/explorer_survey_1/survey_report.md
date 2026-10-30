# Comprehensive Backend Architecture Survey Report: Member 2 Product Module

**Investigator**: Backend Architecture Explorer  
**Date**: 2026-10-30  
**Target Path**: `shop-project/backend`  
**Working Directory**: `.agents/teamwork/explorer_survey_1/`

---

## 1. Executive Summary

An in-depth investigation was conducted into the backend codebase of `shop-project/backend`.
Key takeaways:
- **Server Entry & Routing**: Express 5.2.1 is configured in `server.js`. The REST route `/api/products` is already mounted pointing to `./src/routes/productRoutes`.
- **Existing Implementation**: `productModel.js`, `productRoutes.js`, and `productController.js` already exist in the codebase and contain substantial foundational code.
- **RBAC**: Middlewares `protect` and `isStaffOrAdmin` are implemented in `src/middlewares/authMiddleware.js` and properly guard mutating routes (`POST`, `PUT`, `DELETE`).
- **Database Connection**: MongoDB is connected via `src/config/db.js` (`mongodb://127.0.0.1:27017/shop-project` for dev, `mongodb://127.0.0.1:27017/shop_test` for test). Verified active and reachable.
- **Testing Status**:
  - `tests/product.test.js` does **NOT** exist yet.
  - The project has Jest 29.7.0 and Supertest 6.3.4 installed.
  - Blanket `npm test` currently hits an issue due to legacy mock mismatch in `tests/coupon.test.js` and `node:test` files, but the targeted command `npm --prefix shop-project/backend test -- tests/product.test.js` will execute cleanly once `tests/product.test.js` is created.

---

## 2. Server Entry Point & Application Architecture

- **File**: `shop-project/backend/server.js`
- **Framework**: Express `5.2.1` (CommonJS)
- **Key Middleware Stack**:
  - `cors()`: Cross-Origin Resource Sharing enabled
  - `express.json()`: JSON body parsing
  - `express.urlencoded({ extended: true })`: Form data parsing
  - `cookieParser()`: Cookie extraction
- **Route Mounting**:
  ```javascript
  // Line 26: Admin EJS routes
  app.use('/admin', require('./src/routes/adminViewRoutes'));

  // Lines 29-33: REST API routes
  app.use('/api/users', require('./src/routes/userRoutes'));
  app.use('/api/coupons', require('./src/routes/couponRoutes'));
  app.use('/api/products', require('./src/routes/productRoutes')); // Member 2
  app.use('/api/admin', require('./src/routes/adminRoutes'));
  app.use('/api/admin/stats', require('./src/routes/statsRoutes'));
  ```
- **Lifecycle & Test Safety**:
  ```javascript
  // Lines 71-76: Only start listening if not in test environment
  if (process.env.NODE_ENV !== 'test') {
    startServer();
  }
  module.exports = app;
  ```
  This enables `supertest(app)` to run without port conflicts or hanging listeners.

---

## 3. Authentication & RBAC Middleware

- **File**: `shop-project/backend/src/middlewares/authMiddleware.js`
- **Core Guards**:
  1. `protect`: Validates `Authorization: Bearer <JWT_TOKEN>` with `process.env.JWT_SECRET`. Resolves `User.findById(decoded.id).select('-password')`. Returns `401` if missing/invalid/expired.
  2. `isAdmin`: Verifies `req.user.role === 'admin'`. Returns `403` if unauthorized.
  3. `isStaffOrAdmin`: Verifies `req.user.role === 'admin' || req.user.role === 'staff'`. Returns `403` if user is customer or missing.
- **Roles in User Model** (`src/models/userModel.js`):
  - Enum: `['customer', 'staff', 'admin']` (default: `'customer'`)
  - Password hashing: `bcrypt.hash` on `save` hook; verification via `matchPassword(enteredPassword)`.
- **Default Test Accounts** (seeded via `scripts/seed-roles.js`):
  | Role | Email | Password | Allowed on Products |
  |---|---|---|---|
  | **Admin** | `admin@shop.com` | `admin123` | Full CRUD (`POST`, `PUT`, `DELETE`, `GET`) |
  | **Staff** | `staff@shop.com` | `staff123` | Full CRUD (`POST`, `PUT`, `DELETE`, `GET`) |
  | **Customer** | `customer@shop.com` | `password123` | Read-only (`GET`); 403 on `POST`/`PUT`/`DELETE` |
  | **Unauthenticated** | None | None | Read-only (`GET`); 401 on `POST`/`PUT`/`DELETE` |

---

## 4. Product Model & Schema Inspection

- **File**: `shop-project/backend/src/models/productModel.js`
- **Schema Fields**:
  - `name`: String, required, trim, max 150 chars
  - `description`: String, required, trim
  - `price`: Number, required, min 0
  - `originalPrice`: Number, min 0, default null
  - `category`: String, required, trim
  - `brand`: String, default `'CLOSET'`, trim
  - `stock`: Number, required, min 0, default 0
  - `images`: Array of String, default `[]`
  - `rating`: Number, min 0, max 5, default 5
  - `numReviews`: Number, default 0, min 0
  - `isActive`: Boolean, default true
  - `timestamps`: true (`createdAt`, `updatedAt`)
- **Indexes**:
  - Compound text index: `{ name: 'text', description: 'text', brand: 'text' }`
  - Compound query index: `{ category: 1, price: 1, isActive: 1 }`
- **Assessment**: The schema matches all specifications in R1, R2, R3, and `SKILL.md`.

---

## 5. Product Routes & Controller Inspection

### 5.1 Route Definition (`src/routes/productRoutes.js`)
- `optionalAuth` middleware:
  Inspects token if present to populate `req.user`, allowing admin/staff to query inactive products via `isActive=false`, while default public queries enforce `isActive=true`.
- Routes:
  - `GET /api/products` -> `optionalAuth`, `getProducts`
  - `GET /api/products/:id` -> `getProductById`
  - `POST /api/products` -> `protect`, `isStaffOrAdmin`, `createProduct`
  - `PUT /api/products/:id` -> `protect`, `isStaffOrAdmin`, `updateProduct`
  - `DELETE /api/products/:id` -> `protect`, `isStaffOrAdmin`, `deleteProduct`

### 5.2 Unified Controller (`src/controllers/productController.js`)
Handles all search, filter, sort, and pagination within `getProducts`:
- **Pagination**: `page = Math.max(1, parseInt(req.query.page) || 1)`, `limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12))`.
- **Search Query**:
  Regex matching across `name`, `description`, `brand`, and `category`.
  *Observation*: Currently uses `new RegExp(req.query.search.trim(), 'i')` without escaping regex special characters (e.g. `(`, `[`, `*`). A search with `(` could throw a SyntaxError.
  *Recommendation*: Sanitize keyword with `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
- **Category Filter**: `query.category = req.query.category.trim()` (skips `'all'`).
- **Price Range Filter**:
  `query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) }`.
- **Stock Filter**: `inStock === 'true'` -> `{ stock: { $gt: 0 } }`.
- **Sorting**:
  Supports `price_asc` (price: 1), `price_desc` (price: -1), `rating_desc` (rating: -1), `name_asc` (name: 1), `name_desc` (name: -1), `oldest` (createdAt: 1), and default `createdAt: -1`.
- **Output JSON Format**:
  ```json
  {
    "success": true,
    "products": [...],
    "total": 24,
    "totalPages": 2,
    "currentPage": 1,
    "limit": 12
  }
  ```

---

## 6. Test Runners & Testing Environment

- **Dependencies**:
  - `jest`: `^29.7.0`
  - `supertest`: `^6.3.4`
- **Config**: `shop-project/backend/jest.config.js`
  - `testEnvironment: 'node'`
  - `testMatch: ['**/tests/**/*.test.js']`
  - `setupFilesAfterEnv: ['<rootDir>/tests/setup.js']`
- **Setup File** (`tests/setup.js`):
  - Sets `process.env.NODE_ENV = 'test'`
  - Sets `process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/shop_test'`
  - Sets `jest.setTimeout(30000)`
- **Key Test Findings**:
  1. `tests/product.test.js` does not yet exist.
  2. Targeted test command `npm --prefix shop-project/backend test -- tests/product.test.js` will run directly and isolate `product.test.js`.
  3. MongoDB is accessible on `mongodb://127.0.0.1:27017` and tests can safely populate and clear `Product` and `User` collections in `beforeEach`/`afterEach`.

---

## 7. Actionable Guidance for Backend & Tester Sub-Agents

1. **Backend Sub-agent (`backend_dev`)**:
   - Refine regex search in `productController.js` to escape regex characters:
     ```javascript
     const sanitized = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     const searchRegex = new RegExp(sanitized, 'i');
     ```
   - Enhance `getProductById` to validate MongoDB ObjectId format before querying:
     ```javascript
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       return res.status(404).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
     }
     ```
   - Keep code minimal, clean, with zero unused dependencies or debug logs.

2. **Tester Sub-agent (`tester`)**:
   - Create `shop-project/backend/tests/product.test.js` using Jest + Supertest (`request(app)`).
   - Test suites required:
     - **Suite 1: RBAC Security**:
       - Unauthenticated requests to POST/PUT/DELETE return 401.
       - Customer token requests to POST/PUT/DELETE return 403.
       - Staff token requests to POST/PUT/DELETE return 201/200.
       - Admin token requests to POST/PUT/DELETE return 201/200.
     - **Suite 2: Product Management CRUD**:
       - Create product with valid body, verify saved document and default fields.
       - Validation failure when required fields (`name`, `price`, etc.) are missing.
       - Update product fields (`stock`, `price`, `isActive`).
       - Delete product and confirm subsequent GET returns 404.
     - **Suite 3: Product Search (R2)**:
       - Keyword matching by name, brand, description.
       - Case-insensitive search.
       - Search returning empty results.
     - **Suite 4: Filter, Sort & Pagination (R3)**:
       - Category filter.
       - Price range filter (`minPrice`, `maxPrice`).
       - In-stock filter (`inStock=true`).
       - Sorting by price asc/desc, rating desc, newest.
       - Pagination limits and page offsets.
