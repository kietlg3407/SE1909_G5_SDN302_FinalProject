## 2026-10-30T10:52:11Z
You are Backend Remediation Worker (Iteration 2) for Member 2: Product module.

Working Directory: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\backend_developer_2
Original Request: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ORIGINAL_REQUEST.md
Project Document: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\PROJECT.md
Project Guidelines: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\AGENTS.md
Skill Reference: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\skills\product-management\SKILL.md
Challenger 1 Report: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\challenger_1\handoff.md
Challenger 2 Report: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\challenger_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You have exclusive write access to:
- `shop-project/backend/src/controllers/productController.js`

Tasks:
Apply the 3 specific fixes identified by Challenger 1 and Challenger 2 in `shop-project/backend/src/controllers/productController.js`:
1. Catalog Visibility Leak (Challenger 1 Defect 1):
   In `getProducts`:
   ```javascript
   const isStaffOrAdminReq = req.user && ['admin', 'staff'].includes(req.user.role);
   if (isStaffOrAdminReq) {
     if (req.query.isActive !== undefined && req.query.isActive !== 'all') {
       query.isActive = req.query.isActive === 'true';
     }
   } else {
     query.isActive = true;
   }
   ```
   Ensure public and customer requests CANNOT see inactive products even if querying `?isActive=false`.
2. Numerical Empty String / Null Coercion (Challenger 1 Defect 2 & 3):
   In `createProduct` and `updateProduct`:
   Define helper `const isInvalidNumber = (v) => v === undefined || v === null || v === '' || isNaN(Number(v)) || Number(v) < 0;`
   In `createProduct`: Reject with 400 Bad Request if `isInvalidNumber(price)` or `isInvalidNumber(stock)`.
   In `updateProduct`: If `price` is provided, ensure `!isInvalidNumber(price)`; if `stock` is provided, ensure `!isInvalidNumber(stock)`. Otherwise return 400 Bad Request.
3. Null Byte in Search Query (Challenger 2 Vulnerability):
   In `getProducts`:
   Strip null bytes from `req.query.search`: `req.query.search.replace(/\0/g, '')` before regex escaping and construction so `\x00` does not trigger BSONError 500.

Verification:
Run all backend test suites to verify 100% pass:
- `node --test tests/challenger-edge-cases.test.js` (Must pass 30/30)
- `node --test tests/challenger2-query-combinations.test.js` (Must pass 34/34)
- `node --test tests/product.test.js` (Must pass 30/30)
- `npm run test:node` (Must pass 44/44 regression tests)

Write your report in `handoff.md` and transition to Idle.
