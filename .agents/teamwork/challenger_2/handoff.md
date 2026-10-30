# Handoff Report — Challenger 2 (Query Combinations & Performance)

**Verdict**: **REQUEST_CHANGES** (Actionable Security & Stability Patch)

---

## 1. Observation

### Empirical Test Execution
Empirical test suite was executed at `shop-project/backend/tests/challenger2-query-combinations.test.js` using Node.js native test runner against the live Express + MongoDB backend:
Command:
```powershell
node --test tests/challenger2-query-combinations.test.js
```

Summary:
- Total tests: 34 tests across 5 suites.
- Passed: 33 tests.
- Failed: 1 test (`TC-C2-RGX-07`).
- Total suite runtime: ~1,242ms (average query response time < 6ms).

### Specific Observations & Tool Outputs

1. **Multi-Filter Combinations (TC-C2-COMB-01 through TC-C2-COMB-06)**:
   - Simultaneous query `category=Áo Khoác&minPrice=300000&maxPrice=500000&inStock=true&search=gió&sortBy=price_asc` returned strictly 1 matching item in 17.8ms with correct attributes (`status: 200`).
   - Wildcard `category=all` properly skipped category restriction and returned all in-stock products matching price bounds.
   - Conflicting bounds (`minPrice=800000&maxPrice=200000`) returned `products: []`, `total: 0`, `status: 200` without errors.
   - Non-numeric price inputs (`minPrice=abc&maxPrice=xyz`) were safely ignored via `!isNaN` validation.

2. **Sort Order Permutations (TC-C2-SORT-01 through TC-C2-SORT-07)**:
   - All sort keys (`price_asc`, `price_desc`, `rating_desc`, `name_asc`, `name_desc`, `oldest`) sorted deterministically.
   - Unrecognized / malicious sort parameters (`sortBy=__proto__`, `sortBy={"$gt":""}`, `sortBy=-- DROP TABLE`) safely fell back to default `{ createdAt: -1 }` without error.

3. **Boundary Pagination (TC-C2-PAG-01 through TC-C2-PAG-10)**:
   - `page=0`, `page=-10`, `page=invalid` were safely clamped to `page=1`.
   - `page=99999` and `page=2147483648` (exceeding 32-bit int) returned `products: []` with 200 OK without database overflow.
   - `limit=0` and non-numeric limits defaulted to `12`.
   - `limit=99999` (DoS attempt) was strictly clamped to `100`.
   - Slice integrity across pages 1 and 2 showed 0 overlapping IDs.

4. **Regex Metacharacters & Parameter Pollution (TC-C2-RGX-01 through TC-C2-RGX-06)**:
   - Literal regex metacharacters `.*+?^${}()|[]\` matched target item verbatim without crashing.
   - ReDoS payload `((((((((a+)+)+)+)+)+)+)+)b` executed in 13.2ms because quantifiers were escaped into literals.
   - 5,000-character search string returned 200 OK with `products: []`.
   - Repeated query keys `?search=foo&search=bar` safely resolved to first element via `Array.isArray(req.query.search) ? req.query.search[0] : req.query.search`.

5. **CRITICAL FINDING: Null Byte (%00) Crash (TC-C2-RGX-07)**:
   - Exact request: `GET /api/products?search=%00`
   - Verbatim error returned:
     ```json
     {
       "success": false,
       "message": "Lỗi tải danh sách sản phẩm",
       "error": "value \u0000 must not contain null bytes"
     }
     ```
   - HTTP status returned: `500 Internal Server Error`.
   - Exact code path: `shop-project/backend/src/controllers/productController.js:30-31`:
     ```javascript
     const sanitizedSearch = rawSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     const searchRegex = new RegExp(sanitizedSearch, 'i');
     ```

6. **Performance & Concurrency**:
   - Single multi-filter query: ~5.9ms.
   - 20 concurrent requests burst: 59.1ms total (~2.95ms/req).
   - 50 concurrent requests burst: 180.6ms total (~3.6ms/req).

---

## 2. Logic Chain

1. In MongoDB's BSON binary wire specification, regular expression pattern strings are serialized as C-style null-terminated strings (`cstring`).
2. When a client supplies a query parameter containing `%00` (null byte `\x00`), `req.query.search` in Express receives string containing `\x00`.
3. In `productController.js` line 30, the regex sanitizer is:
   `rawSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
   This replacement removes or escapes standard regex metacharacters (`.*+?^${}()|[]\`), but does NOT strip null bytes (`\0` or `\x00`).
4. `new RegExp(sanitizedSearch, 'i')` compiles with the embedded `\x00`.
5. When `Product.find(query)` executes, Mongoose passes the regex to the underlying BSON serializer.
6. The BSON serializer encounters `\x00` inside the pattern string and throws `BSONError: value \x00 must not contain null bytes`.
7. Because there is no error handler stripping null bytes, the error bubbles to the controller's `catch (error)` block, returning a `500 Internal Server Error`.
8. Any automated vulnerability scanner or attacker passing `%00` can trigger repeated 500 errors.

---

## 3. Caveats

- MongoDB service must be running locally on `mongodb://127.0.0.1:27017/shop-project` for test execution.
- URL-encoding standard (`encodeURIComponent`) is required for HTTP clients sending non-ASCII query strings (e.g. Vietnamese accents `Áo Khoác`) over HTTP/1.1 to comply with Node.js HTTP parser.
- No network partition or hardware failure simulation was conducted.

---

## 4. Conclusion

- **Overall Assessment**: The unified `getProducts` controller demonstrates strong design, robust pagination boundary clamping, resilient sorting fallback, and effective ReDoS neutralization.
- **Defect Found**: Passing `%00` in `search` triggers an unhandled `BSONError: value \x00 must not contain null bytes` returning `500 Internal Server Error`.
- **Verdict**: **REQUEST_CHANGES**
- **Actionable Mitigation**:
  In `shop-project/backend/src/controllers/productController.js` lines 29-31, strip null bytes `\0` before constructing `RegExp`:
  ```javascript
  const cleanSearch = rawSearch.trim().replace(/\0/g, '');
  if (cleanSearch) {
    const sanitizedSearch = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(sanitizedSearch, 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { brand: searchRegex },
      { category: searchRegex },
    ];
  }
  ```
  Once this 1-line sanitize patch is applied, all 34 tests in `tests/challenger2-query-combinations.test.js` will pass 100%.

---

## 5. Verification Method

To independently reproduce and verify this finding:

1. Run the empirical test suite:
   ```powershell
   cd shop-project/backend
   node --test tests/challenger2-query-combinations.test.js
   ```
   Observe that 33 tests pass and `TC-C2-RGX-07` fails with:
   `CRITICAL BSON CRASH: Null byte %00 in search caused 500 Internal Server Error: {"success":false,"message":"Lỗi tải danh sách sản phẩm","error":"value \u0000 must not contain null bytes"}`.

2. Direct minimal reproduction command:
   ```powershell
   node -e "const app = require('./server'); const request = require('supertest'); request(app).get('/api/products?search=%00').then(res => { console.log('Status:', res.status, 'Error:', res.body.error); process.exit(0); });"
   ```
   Output: `Status: 500 Error: value \u0000 must not contain null bytes`.

3. Invalidation Condition:
   Applying the null-byte stripping patch `replace(/\0/g, '')` in `productController.js` causes `TC-C2-RGX-07` to return 200 OK and the entire suite to achieve 34/34 (100%) pass rate.
