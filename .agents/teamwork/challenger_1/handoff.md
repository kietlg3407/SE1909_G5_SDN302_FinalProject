# Handoff Report: Challenger 1 (Adversarial Edge-Case Challenger)
**Module**: Member 2 - Product (Management, Search, Filter & Sort)  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### Empirical Test Execution
- **Test File**: `shop-project/backend/tests/challenger-edge-cases.test.js`
- **Execution Command**:
  ```powershell
  node --test shop-project/backend/tests/challenger-edge-cases.test.js
  ```
- **Execution Results**:
  - Total Tests: 30
  - Passed: 27
  - Failed (Confirmed Defects): 3
  - Execution Duration: 1840ms
- **Verbatim Failure Output**:
  ```
  ✖ failing tests:

  test at tests\challenger-edge-cases.test.js:523:5
  ✖ DEFECT-01: Public users must NOT view inactive products via ?isActive=false (10.3056ms)
    Error: expect(received).toBe(expected) // Object.is equality
    
    Expected: false
    Received: true
        at TestContext.<anonymous> (tests\challenger-edge-cases.test.js:543:36)

  test at tests\challenger-edge-cases.test.js:546:5
  ✖ DEFECT-02: Missing/empty string in price must be rejected with 400 instead of coercing to 0 (9.2771ms)
    Error: expect(received).toBe(expected) // Object.is equality
    
    Expected: 400
    Received: 201
        at TestContext.<anonymous> (tests\challenger-edge-cases.test.js:562:26)

  test at tests\challenger-edge-cases.test.js:565:5
  ✖ DEFECT-03: Missing/empty string in stock must be rejected with 400 instead of coercing to 0 (7.9095ms)
    Error: expect(received).toBe(expected) // Object.is equality
    
    Expected: 400
    Received: 201
        at TestContext.<anonymous> (tests\challenger-edge-cases.test.js:581:26)
  ```

---

## 2. Logic Chain & Defect Analysis

### Defect 1 (CRITICAL/HIGH): Public Catalog Information Leak via `?isActive=false`
1. **Source Code**: `shop-project/backend/src/controllers/productController.js` lines 18–25:
   ```javascript
   const isStaffOrAdminReq = req.user && ['admin', 'staff'].includes(req.user.role);
   if (!isStaffOrAdminReq || req.query.isActive !== undefined) {
     if (req.query.isActive !== undefined) {
       query.isActive = req.query.isActive === 'true';
     } else {
       query.isActive = true;
     }
   }
   ```
2. **Logic Failure**:
   - For an unauthenticated visitor or customer account, `isStaffOrAdminReq` is `false`.
   - The expression `!isStaffOrAdminReq || req.query.isActive !== undefined` evaluates to `true`.
   - If the request includes `?isActive=false`, `req.query.isActive !== undefined` is `true`, setting `query.isActive = ('false' === 'true')` -> `query.isActive = false`.
   - This directly exposes unpublished, draft, discontinued, or internal hidden products to any unauthenticated client on the Internet.
3. **Contract Violation**:
   - `PROJECT.md` line 46: *"Visibility: Public users see only `isActive: true`; Admin/Staff see all if requested."*
4. **Mitigation**:
   Enforce `query.isActive = true` unconditionally whenever `!isStaffOrAdminReq`. Only allow `isActive` filtering when `isStaffOrAdminReq` is true:
   ```javascript
   const isStaffOrAdminReq = req.user && ['admin', 'staff'].includes(req.user.role);
   if (isStaffOrAdminReq && req.query.isActive !== undefined) {
     if (req.query.isActive !== 'all') {
       query.isActive = req.query.isActive === 'true';
     }
   } else {
     query.isActive = true;
   }
   ```

### Defect 2 & 3 (MEDIUM): Empty String / Null in Numerical Fields Silently Coerced to 0
1. **Source Code**: `shop-project/backend/src/controllers/productController.js` lines 142–156:
   ```javascript
   const { name, description, price, originalPrice, category, brand, stock, images, isActive } = req.body;

   if (!name || !description || price === undefined || !category || stock === undefined) {
     return res.status(400).json({ ... });
   }

   const product = new Product({
     ...
     price: Number(price),
     ...
     stock: Number(stock),
   });
   ```
2. **Logic Failure**:
   - When a client sends empty strings (`price: ""` or `stock: ""`) or `null` (`price: null` or `stock: null`), the checks `price === undefined` and `stock === undefined` evaluate to `false`.
   - In JavaScript, `Number("") === 0` and `Number(null) === 0`.
   - The controller silently saves the product with `price = 0` (accidental free giveaway) and `stock = 0`, returning `201 Created` instead of rejecting invalid form submissions with `400 Bad Request`.
   - In `updateProduct` (lines 188–189), sending `{ price: "" }` also silently coerces `product.price` to `0`.
3. **Contract / Robustness Breach**:
   - Task requirements mandate rejecting missing or empty strings in required fields.
4. **Mitigation**:
   Harden numerical validation in `createProduct` and `updateProduct`:
   ```javascript
   const isInvalidNumber = (v) => v === undefined || v === null || v === '' || isNaN(Number(v));
   if (!name || !description || isInvalidNumber(price) || !category || isInvalidNumber(stock)) {
     return res.status(400).json({
       success: false,
       message: 'Vui lòng cung cấp đầy đủ: Tên, Mô tả, Giá hợp lệ, Danh mục và Số lượng kho hợp lệ',
     });
   }
   ```

---

## 3. Stress Test Results Summary

| # | Attack Scenario | Input / Vector | Expected Behavior | Actual Behavior | Result |
|---|-----------------|----------------|-------------------|-----------------|--------|
| 1.1 | Zero price | `price: 0` | 201 Created | 201 Created (`price: 0`) | **PASS** |
| 1.2 | Negative price on create | `price: -50000` | 400 Bad Request | 400 Bad Request | **PASS** |
| 1.3 | Negative price on update | `price: -1000` | 400 Bad Request | 400 Bad Request | **PASS** |
| 1.4 | Floating point price | `price: 199999.5`, `orig: 250000.75` | 201 Created | 201 Created (floats intact) | **PASS** |
| 1.5 | Huge price (trillion VND) | `price: 999999999999` | 201 Created | 201 Created | **PASS** |
| 1.6 | Negative originalPrice | `originalPrice: -10000` | 400 Bad Request | 400 Bad Request | **PASS** |
| 1.7 | Non-numeric price string | `price: "not_a_number"` | 400 Bad Request | 400 Bad Request | **PASS** |
| 1.8 | Negative stock | `stock: -10` | 400 Bad Request | 400 Bad Request | **PASS** |
| 1.9 | Out of stock | `stock: 0` | 201 Created | 201 Created (`stock: 0`) | **PASS** |
| 2.1 | Missing name | Omitted `name` | 400 Bad Request | 400 Bad Request | **PASS** |
| 2.2 | Whitespace-only name | `name: "   "` | 400 Bad Request | 400 Bad Request | **PASS** |
| 2.3 | Whitespace-only description | `description: "   "` | 400 Bad Request | 400 Bad Request | **PASS** |
| 2.4 | Whitespace-only category | `category: "   "` | 400 Bad Request | 400 Bad Request | **PASS** |
| 2.5 | Empty name on PUT update | `name: "   "` | 400 Bad Request | 400 Bad Request | **PASS** |
| 2.6 | Exceeding maxlength (151 chars) | `name.length === 151` | 400 Bad Request | 400 Bad Request | **PASS** |
| 2.7 | Max boundary length (150 chars) | `name.length === 150` | 201 Created | 201 Created | **PASS** |
| 3.1 | Short non-hex ID | `GET /api/products/123` | 404 Not Found | 404 Not Found | **PASS** |
| 3.2 | Arbitrary string ID | `GET /api/products/undefined` | 404 Not Found | 404 Not Found | **PASS** |
| 3.3 | 12-char non-hex string ID | `GET /api/products/123456789012` | 404 Not Found | 404 Not Found (zero 500 crash) | **PASS** |
| 3.4 | Non-existent 24-hex ID | `GET /api/products/507f1f...` | 404 Not Found | 404 Not Found | **PASS** |
| 3.5 | Malformed ID in PUT | `PUT /api/products/invalid-id` | 404 Not Found | 404 Not Found | **PASS** |
| 3.6 | Malformed ID in DELETE | `DELETE /api/products/invalid-id` | 404 Not Found | 404 Not Found | **PASS** |
| 4.1 | Unicode, diacritics & emojis | `"Áo Thun... 🔥👕 ⭐ 10/10"` | 201 Created & read | 201 Created, stored perfectly | **PASS** |
| 4.2 | HTML/XSS injection payload | `"<script>alert(1)</script>"` | Stored as text | Stored safely, no execution | **PASS** |
| 4.3 | Regex control characters | `.*+?^${}()|[]\` | 200 OK (zero crash) | 200 OK (zero 500 crash) | **PASS** |
| 4.4 | Diacritics search | `search=Kháng Nước` | 200 OK (matched) | 200 OK (accurate match) | **PASS** |
| 4.5 | Boundary pagination values | `page=-5`, `limit=0`, `limit=9999` | Clamped safely | Clamped to `page=1`, `limit=100` | **PASS** |
| **5.1** | **Public inactive visibility** | `GET /api/products?isActive=false` | **403 or filtered out** | **EXPOSED: public sees inactive** | **FAIL (DEFECT-01)** |
| **5.2** | **Empty string in price** | `POST /api/products` with `price: ""` | **400 Bad Request** | **201 Created (`price: 0`)** | **FAIL (DEFECT-02)** |
| **5.3** | **Empty string in stock** | `POST /api/products` with `stock: ""` | **400 Bad Request** | **201 Created (`stock: 0`)** | **FAIL (DEFECT-03)** |

---

## 4. Caveats
- Concurrency race conditions under high volume traffic (e.g. 1000 simultaneous orders on low stock) were not benchmarked as the current scope focuses on Product module REST endpoints and data contracts.
- Frontend components were independently verified against mock APIs with 18/18 passing tests; no UI blockers were identified.

---

## 5. Conclusion & Actionable Next Steps

### Verdict: **REQUEST_CHANGES**

The backend implementation exhibits high resilience against malformed ObjectIds, regex metacharacters, and string boundary constraints. However, **changes must be requested from Backend Developer** to address:
1. **Catalog Visibility Leak**: Block public and customer queries from viewing `isActive: false` products via `req.query.isActive`.
2. **Empty String Coercion**: Reject `""` and `null` for numerical fields (`price`, `stock`) with HTTP 400 Bad Request instead of coercing them to `0`.

---

## 6. Verification Method

To independently execute and verify the empirical challenge suite:
```powershell
node --test shop-project/backend/tests/challenger-edge-cases.test.js
```
Invalidation condition: When the Backend Worker resolves the 2 defects, all 30 tests in `challenger-edge-cases.test.js` will pass with 0 failures.
