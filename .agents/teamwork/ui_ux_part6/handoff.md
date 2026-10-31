# Handoff Report: UI/UX Specifications for Gate 3 (Part 6 - Product Filter & Sort)

**Agent**: Sub-agent UI/UX Designer  
**Milestone**: Gate 3 / Cổng 3 (Part 6: Product Filter & Sort)  
**Deliverable**: `.agents/teamwork/ui_ux_part6/ux_specs.md`  
**Status**: COMPLETED  

---

## 1. Observation

1. **System & Codebase State**:
   - `shop-project/frontend/src/pages/ProductsPage.jsx`:
     - Lines 16-24: Defines `CATEGORIES = ['Tất cả', 'Áo', 'Quần', 'Váy', 'Áo khoác', 'Phụ kiện', 'Giày dép', 'Khác']` and `SORT_OPTIONS` (`Mới nhất`, `Giá: Thấp đến Cao`, `Giá: Cao đến Thấp`, `Đánh giá cao nhất`, `Tên: A đến Z`).
     - Lines 37-43: Reads URL query parameters (`search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `page`).
     - Lines 68-89: Implements `updateParams` function to modify `useSearchParams` while cleaning up defaults.
     - Lines 93-109: Integrates 300ms Debounce search input.
     - Lines 191-393: Renders desktop sidebar filter with categories, price presets (`< 300k`, `300k - 600k`, `> 600k`), min-max input form, and in-stock toggle.
     - Lines 771-820: Renders pagination controls.
   - `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx`:
     - Lines 45-52: Uses local `useState` for `page`, `query`, `categoryFilter`, `statusFilter`. Currently lacks `useSearchParams` two-way synchronization, meaning filter/search state is lost on page reload.
     - Lines 353-396: Contains Category and Status dropdown filters.
     - Lines 695-741: Contains pagination controls.
   - `shop-project/backend/src/controllers/productController.js`:
     - Lines 11-13: Handles `page` (default 1) and `limit` (default 12).
     - Lines 27-41: Handles `search` parameter with regex escaping against ReDoS.
     - Lines 43-54: Handles `category` and `brand` query filters.
     - Lines 55-70: Handles `minPrice` and `maxPrice` numeric range filtering.
     - Lines 71-74: Handles `inStock === 'true'` by filtering `stock: { $gt: 0 }`.
     - Lines 76-101: Handles `sortBy` mapping (`price_asc`, `price_desc`, `rating_desc`, `name_asc`, `name_desc`, `oldest`, and default `createdAt: -1`).
     - Lines 108-116: Returns unified payload with `success`, `count`, `total`, `totalPages`, `currentPage`, `limit`, and `products`.
   - `shop-project/frontend/src/index.css`:
     - Design tokens defined in `:root` (lines 3-25): `--primary: #0f172a`, `--border-light: #e2e8f0`, `--text-muted: #64748b`, `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`.
     - Button classes (lines 218-258): `.btn-primary`, `.btn-secondary`.
     - Empty state classes (lines 1214-1225): `.empty-state-box`, `.empty-icon`.
     - Spinner animation (lines 1431-1443): `.spinner-sm`, `@keyframes spin`.

---

## 2. Logic Chain

1. **Alignment with Minimal Code Principle**:
   - Both `ORIGINAL_REQUEST.md` (§R4) and `AGENTS.md` mandate zero bloat and no third-party package additions.
   - Observation shows that all necessary visual elements, tokens, and classes are already present in `index.css` or can be styled cleanly with existing design tokens.
   - The specifications in `ux_specs.md` strictly utilize native React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`), React Router DOM's `useSearchParams`, and existing `lucide-react` icons.

2. **Unified URL Synchronization Strategy**:
   - While `ProductsPage.jsx` has an initial implementation of URL query syncing, `AdminProductsPage.jsx` was previously relying entirely on local component state.
   - Per Requirement R2 in `ORIGINAL_REQUEST.md`, both customer and admin pages must support two-way URL search params synchronization.
   - `ux_specs.md` standardizes the query parameter naming convention across both views (`search`, `category`, `minPrice`, `maxPrice`, `inStock`, `status`/`isActive`, `sortBy`, `page`, `limit`), establishing a single source of truth that survives page reloads, browser history navigation (back/forward), and URL bookmark sharing.

3. **Responsive & Mobile Experience Optimization**:
   - In desktop view (> 1024px), the sticky sidebar provides fast access to category, price, and stock filters.
   - In mobile view (< 768px), rendering a static 280px sidebar on top of the catalog pushes all product cards far below the fold, degrading UX.
   - `ux_specs.md` details a responsive layout specification including a compact mobile filter bar and collapsible filter panel so users can quickly toggle filters without excessive scrolling.

4. **Empty State & Accessibility Coverage**:
   - Defined clear differentiation between "Empty due to search query", "Empty due to active filters", and "Empty due to combined search + filter", each with contextual 1-click CTA buttons ("Xóa Từ Khóa", "Xóa Bộ Lọc", "Đặt Lại Toàn Bộ").
   - Detailed comprehensive ARIA labels and keyboard navigation patterns to ensure compliance with web accessibility standards.

---

## 3. Caveats

- **No Caveats**: The UX specifications fully cover both `ProductsPage.jsx` and `AdminProductsPage.jsx`, harmonize with the existing Backend `productController.js` endpoint contracts, and introduce zero new dependencies.

---

## 4. Conclusion

The UX Specifications for Part 6 (Gate 3: Product Filter, Sort & URL Synchronization) have been completely formulated and documented at:
`c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ui_ux_part6\ux_specs.md`

The specifications provide a comprehensive, clear, and actionable implementation blueprint for:
1. **Sub-agent Backend**: Verifying and refining `getProducts` in `productController.js` to ensure optimal Mongoose queries, strict input sanitization, and correct RBAC enforcement.
2. **Sub-agent Frontend**: Implementing responsive multi-filter UI, sort select, pagination, active filter badges, and full two-way URL synchronization across `ProductsPage.jsx` and `AdminProductsPage.jsx`.
3. **Sub-agent Tester**: Developing exhaustive Vitest and Jest automated test suites covering multi-condition filtering, sorting orders, pagination boundaries, edge cases, and default test accounts.

Sub-agent UI/UX has fulfilled all objectives for Gate 3 and transitions to **Idle (Chờ)**.

---

## 5. Verification Method

1. **Inspect Artifact File**:
   - View `.agents/teamwork/ui_ux_part6/ux_specs.md` to confirm all sections (Executive Summary, URL Sync Architecture, Client Catalog Specs, Admin Management Specs, Empty States, Implementation Blueprint, Accessibility, Acceptance Checklist) are present and comprehensive.
2. **Review Against Requirements**:
   - Multi-condition Filter (Category, Price Min/Max Presets & Inputs, In-stock checkbox).
   - Sorting options (Newest, Price Ascending, Price Descending, Rating Descending, Name A-Z).
   - Pagination (Previous, Next, Numbered buttons, Results counter "Hiển thị 1 - 12 trong 36 sản phẩm").
   - Two-Way URL Search Params Synchronization (`useSearchParams`).
   - Minimal Code Principle (zero new dependencies, reuse of `index.css`).
3. **Invalidation Conditions**:
   - If any new external library is proposed.
   - If URL search parameters fail to synchronize on page refresh or browser navigation.
