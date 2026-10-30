## 2026-10-30T09:41:21Z
You are the Sub-agent Frontend for Member 2: Product module.

Working Directory: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\frontend_developer_1
Original Request: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ORIGINAL_REQUEST.md
Project Document: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\PROJECT.md
Project Guidelines: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\AGENTS.md
Skill Reference: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\skills\product-management\SKILL.md
UI/UX Specs: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ui_ux_designer_1\ui_ux_specs.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You have exclusive write access to:
- `shop-project/frontend/src/App.jsx`
- `shop-project/frontend/src/components/admin/Sidebar.jsx`
- `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx`
- `shop-project/frontend/src/pages/ProductsPage.jsx`
DO NOT edit backend files or test files.

Mission:
1. Minimal Code Principle:
   - Zero boilerplate, no extra wrapper service classes.
   - Use Axios instance directly from `src/services/api.js` (`api.get('/api/products'...)`, `api.post(...)`, `api.put(...)`, `api.delete(...)`).
   - Use existing styles from `src/index.css` (`.modal-backdrop`, `.modal-card`, `.modal-header`, `.modal-close-btn`, `.modal-form`, `.modal-actions`, `.btn-primary`, `.btn-secondary`, `.empty-state-box`, `.admin-table`, etc.).
   - Use icons from `lucide-react` (Package, Plus, Edit, Trash2, Search, Filter, X, Check, AlertCircle, Eye, EyeOff, etc.).
2. Implement `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx`:
   - Header with title, count, and "Thêm sản phẩm" button.
   - Table displaying: Thumbnail image, Product name & brand, Category, Price & Original price (discount badge), Stock count, 1-click `isActive` toggle button, Edit and Delete action buttons.
   - Add/Edit Product Modal: form fields for name, category, brand, price, originalPrice, stock, images (comma-separated or string), description, isActive. Proper form validation, submit and cancel actions.
   - Delete confirmation dialog.
   - Feedback via `react-hot-toast`.
3. Update `shop-project/frontend/src/components/admin/Sidebar.jsx`:
   - Add `{ label: 'Quản lý sản phẩm', path: '/admin/products', icon: Package, roles: ['admin', 'staff'] }` into `navigationItems`.
4. Implement `shop-project/frontend/src/pages/ProductsPage.jsx`:
   - Public product catalog with responsive product grid.
   - Product Card: Image, title, category, formatted VND price, discount tag, stock indicator.
   - 300ms debounced search bar with clear "X" button.
   - Multi-filter sidebar: Category, Price range (minPrice, maxPrice), In-stock checkbox.
   - Sort dropdown: newest, price-asc, price-desc, rating.
   - Pagination controls.
   - URL search parameters sync via React Router's `useSearchParams`.
   - Empty state UI when no products match.
5. Update `shop-project/frontend/src/App.jsx`:
   - Route `/products` -> `<ProductsPage />`.
   - Route `/admin/products` -> `<AdminProductsPage />` inside `AdminRoute`.
6. Run `npm --prefix shop-project/frontend run build` to verify clean build without syntax or import errors.
7. Write your report in `handoff.md` and transition to Idle.
