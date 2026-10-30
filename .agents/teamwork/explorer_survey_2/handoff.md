# Handoff Report: Frontend UI Architecture Survey

**Investigator**: Frontend UI Architecture Explorer (`explorer_survey_2`)  
**Parent Agent**: Orchestrator (`24b5d4d8-e9a1-4e4f-9341-e3b448a1c5b0`)  
**Date**: 2026-10-30  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation
1. **Routing Setup in `shop-project/frontend/src/App.jsx`**:
   - Lines 73: `<Route path="/products" element={<HomePage />} />`
   - Lines 100–116: The `/admin` route is guarded by `<AdminRoute allowedRoles={['admin', 'staff']} />`. Registered sub-routes are `dashboard`, `coupons`, and `users`.
   - The route `/admin/products` is currently missing.
2. **Navigation Items in `shop-project/frontend/src/components/admin/Sidebar.jsx`**:
   - Lines 6–25: `navigationItems` contains only `Dashboard Statistics`, `User Management`, and `Coupon/Promotion Management`.
   - Product Management item (`/admin/products`) is not present in `navigationItems`.
3. **API Client in `shop-project/frontend/src/services/api.js`**:
   - Lines 8–10: `const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');`
   - Lines 34–44: Request interceptor automatically reads `token` from `localStorage` or `sessionStorage` and attaches `Authorization: Bearer ${token}`.
   - Lines 46–80: Response interceptor handles 401 (clears credentials and redirects to `/login`) and 403 (dispatches `api:forbidden`).
   - All API endpoints in existing admin pages are called via `api.get('/api/...')`, `api.post('/api/...')`, etc. No extra wrapper service classes are used.
4. **Design Tokens & Styling in `shop-project/frontend/src/index.css`**:
   - Lines 3–25: CSS variables define `--primary: #0f172a`, `--primary-hover: #1e293b`, `--accent: #475569`, `--bg-main: #fcfcfd`, `--card-bg: #ffffff`, `--card-border: #e2e8f0`, `--text-main: #0f172a`, `--text-muted: #64748b`, `--danger: #ef4444`, `--success: #10b981`, shadows `--shadow-sm` through `--shadow-xl`, and radii `--radius-sm` through `--radius-full`.
   - Lines 218–263: Utility button classes `.btn-primary`, `.btn-secondary`, `.btn-lg`.
   - Modals in existing pages (`CouponsPage.jsx:736-744`, `AdminUsersPage.jsx:543-550`) use `.modal-backdrop`, `.modal-card`, `.modal-header`, `.modal-close-btn`, and animation `@keyframes modal-scale-up`.
5. **Dependencies & Test Framework in `shop-project/frontend/package.json`**:
   - Dependencies: `react` (^19.2.8), `react-dom` (^19.2.8), `react-router-dom` (^7.18.4), `axios` (^1.20.0), `lucide-react` (^1.50.0), `react-hot-toast` (^2.6.1).
   - Test framework: `vitest` (^2.1.8), `jsdom` (^25.0.1), `@testing-library/react` (^16.1.0), `@testing-library/jest-dom` (^6.6.3).
   - Test config `vitest.config.js`: `globals: true`, `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.js']`.
6. **Target Product Pages and Tests**:
   - `src/pages/admin/AdminProductsPage.jsx`: Does NOT exist yet.
   - `src/pages/ProductsPage.jsx`: Does NOT exist yet.
   - Target automated test command in `ORIGINAL_REQUEST.md:48`:
     `npm --prefix shop-project/frontend test -- src/pages/admin/AdminProductsPage.test.jsx src/pages/ProductsPage.test.jsx --run`
     Neither test file exists yet.

---

## 2. Logic Chain
1. Based on Observation 1, the public `/products` URL is currently an alias to `HomePage`, and `/admin/products` does not exist in `App.jsx`. Therefore, the frontend implementation must introduce `ProductsPage.jsx` and `AdminProductsPage.jsx`, and register both routes in `App.jsx`.
2. Based on Observation 2, `Sidebar.jsx` filters items by `userRole`. Since Product Management must be accessible to both Admin and Staff (per R1 and SKILL.md), adding `{ label: 'Quản lý sản phẩm', path: '/admin/products', icon: Package, roles: ['admin', 'staff'] }` will render the navigation link for both roles while hiding it for unauthorized users.
3. Based on Observation 3 and the Minimal Code Principle (AGENTS.md Section 1), creating separate product service files or complex store abstractions would violate guidelines. Directly calling `api.get('/api/products')`, `api.post('/api/products')`, `api.put('/api/products/:id')`, and `api.delete('/api/products/:id')` within the pages is consistent with the existing codebase (`AdminUsersPage`, `CouponsPage`).
4. Based on Observation 4, the existing design tokens and modal classes (`.modal-backdrop`, `.modal-card`, `.modal-header`, `.btn-primary`, `.btn-secondary`) should be reused for the Admin Product Create/Edit modal and confirmation dialogs to ensure consistent UI and zero stylesheet bloat.
5. Based on Observation 5 and 6, Vitest and `@testing-library/react` are fully configured with `jsdom` and setup mocks. The frontend test suite can be executed independently using the project test command.

---

## 3. Caveats
- No caveats regarding frontend library availability or compatibility; all required dependencies (`lucide-react`, `react-hot-toast`, `axios`, `react-router-dom`) are installed and functional.
- The backend `productController.js` and `productModel.js` already implement all needed query filters (`search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `isActive`), so the frontend query parameter naming must strictly match those backend parameters.

---

## 4. Conclusion
The frontend codebase is clean, modern, and ready for Product module implementation. The UI architecture plan should:
1. Create `src/pages/admin/AdminProductsPage.jsx` with table, search/filter, status toggle, and modal CRUD.
2. Register `/admin/products` in `src/App.jsx` and add the item with `Package` icon into `src/components/admin/Sidebar.jsx`.
3. Create `src/pages/ProductsPage.jsx` with 300ms debounced search, multi-attribute filter sidebar, sorting dropdown, URL search param synchronization (`useSearchParams`), pagination, and empty state.
4. Update `/products` route in `src/App.jsx` to render `ProductsPage`.
5. Implement unit & integration test suites in `src/pages/admin/AdminProductsPage.test.jsx` and `src/pages/ProductsPage.test.jsx`.

---

## 5. Verification Method
1. **Inspect Survey Report**:
   - View file: `C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\explorer_survey_2\survey_report.md`
2. **Inspect Existing Frontend Configurations**:
   - View `shop-project/frontend/src/App.jsx` lines 70–118.
   - View `shop-project/frontend/src/components/admin/Sidebar.jsx` lines 6–26.
   - View `shop-project/frontend/src/services/api.js` lines 1–82.
3. **Run Target Test Suite Verification (when implemented)**:
   ```powershell
   npm --prefix shop-project/frontend test -- src/pages/admin/AdminProductsPage.test.jsx src/pages/ProductsPage.test.jsx --run
   ```
4. **Invalidation Conditions**:
   - If `/admin/products` route fails to load inside `AdminLayout` for admin or staff.
   - If search or filter state fails to synchronize with URL query params.
