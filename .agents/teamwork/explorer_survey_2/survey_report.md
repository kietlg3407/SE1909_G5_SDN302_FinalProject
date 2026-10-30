# Frontend UI Architecture Survey Report
**Project**: SE1909 G5 SDN302 Final Project - Shop Quần Áo  
**Module**: Member 2 - Product (Product Management, Search, Filter & Sort)  
**Investigator**: Frontend UI Architecture Explorer (`explorer_survey_2`)  
**Date**: 2026-10-30  

---

## 1. Executive Summary
This survey provides a comprehensive architectural assessment of the frontend application (`shop-project/frontend`) to prepare for implementing Member 2's Product module:
1. **Product Management (CRUD Admin + Catalog Display)**
2. **Product Search (Keywords, 300ms Debounce, Empty State)**
3. **Product Filter & Sort (Multi-attribute filter, URL synchronization, Pagination)**

All findings verify that the environment is modern (React 19, Vite, Vitest, React Router v7) and well-structured, but the product-specific UI pages, routes, sidebar links, and frontend test suites are not yet created. The backend Mongoose schema and unified controller `getProducts` are already compatible with the planned UI features.

---

## 2. React Application & Router Setup

### File Locations & Configuration
- **Application Root**: `shop-project/frontend/src/main.jsx` mounts `<App />` with `StrictMode`.
- **Router Configuration**: `shop-project/frontend/src/App.jsx` uses `react-router-dom` v7.18.4 (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet`, `Link`).
- **Global Toast**: `react-hot-toast` `<Toaster position="top-right" />` with custom dark styling (`#1e293b`).
- **Global Auth Provider**: `<AuthProvider>` encapsulates authentication state at the application root.

### Current Routing Table
| Path | Layout | Component | Access Guard | Status / Observation |
|---|---|---|---|---|
| `/` | `PublicLayout` | `HomePage` | Public | Home landing page |
| `/products` | `PublicLayout` | `HomePage` | Public | ⚠️ Currently placeholders to `HomePage`. Needs replacement with dedicated `ProductsPage`. |
| `/login` | `PublicLayout` | `LoginPage` | `GuestRoute` | Login page |
| `/register` | `PublicLayout` | `RegisterPage` | `GuestRoute` | Register page |
| `/profile` | `PublicLayout` | `ProfilePage` | `ProtectedRoute` | Customer/User profile |
| `/admin` | `AdminLayout` | Redirect `/admin/dashboard` | `AdminRoute` (`['admin', 'staff']`) | Base admin redirect |
| `/admin/dashboard` | `AdminLayout` | `DashboardPage` | Inherited (`['admin', 'staff']`) | Dashboard stats |
| `/admin/coupons` | `AdminLayout` | `CouponsPage` | Inherited (`['admin', 'staff']`) | Coupon management |
| `/admin/users` | `AdminLayout` | `AdminUsersPage` | `AdminRoute` (`['admin']`) | User management (Admin only) |
| `/admin/products` | `AdminLayout` | — | Missing | ⚠️ Not registered yet. Needs `<Route path="products" element={<AdminProductsPage />} />`. |

---

## 3. Admin Layout, Navigation & RBAC

### Layout Structure
- `AdminLayout` in `App.jsx`:
  ```jsx
  const AdminLayout = () => (
    <div className="admin-app-layout">
      <Navbar />
      <div className="admin-app-body">
        <Sidebar />
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
  ```
- **Responsive Sidebar**: `src/components/admin/Sidebar.jsx`
  - Fixed desktop width (272px), backdrop overlay and slide-in drawer on mobile (`<= 768px`).
  - Active route highlighting via `NavLink` with class `.admin-sidebar-link-active`.
  - Role-based item filtering: filters `navigationItems` by `userRole` (`admin` or `staff`).
  - **Current navigationItems**:
    1. Dashboard Statistics (`/admin/dashboard`, icon: `BarChart3`, roles: `['admin', 'staff']`)
    2. User Management (`/admin/users`, icon: `Users`, roles: `['admin']`)
    3. Coupon/Promotion Management (`/admin/coupons`, icon: `Tag`, roles: `['admin', 'staff']`)
  - **Required Addition**:
    ```javascript
    {
      label: 'Quản lý sản phẩm',
      path: '/admin/products',
      icon: Package,
      roles: ['admin', 'staff'],
    }
    ```

### Authentication & Role Guarding
- **Context Hook**: `useAuth()` from `src/contexts/AuthContext.jsx` provides:
  - `user`: `{ _id, name, email, role, avatar, ... }`
  - `token`: JWT token string
  - `isAuthenticated`: `Boolean(token && user)`
  - `isAdmin`: `user?.role === 'admin'`
  - `isStaff`: `user?.role === 'staff'`
- **Role Route**: `src/components/AdminRoute.jsx`
  - Allows specifying `allowedRoles` (defaults to `['admin', 'staff']`).
  - Blocks customers with a clean 403 `UnauthorizedState` UI.
  - Redirects unauthenticated guests to `/login`.

---

## 4. Design Tokens & Styling Architecture (`src/index.css`)

### Color Palette & Design Tokens
```css
:root {
  --primary: #0f172a;        /* Slate 900 - Dark brand header/buttons */
  --primary-hover: #1e293b;  /* Slate 800 */
  --primary-light: #f8fafc;  /* Slate 50 */
  --accent: #475569;         /* Slate 600 */
  --bg-main: #fcfcfd;        /* Clean soft background */
  --card-bg: #ffffff;        /* Pure white cards */
  --card-border: #e2e8f0;    /* Slate 200 */
  --text-main: #0f172a;      /* Primary text */
  --text-muted: #64748b;     /* Slate 500 secondary text */
  --border-light: #e2e8f0;   /* Borders */
  --danger: #ef4444;         /* Red 500 */
  --success: #10b981;        /* Emerald 500 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}
```

### Reusable Utility Classes & Component Patterns
1. **Buttons**:
   - `.btn-primary`: Dark primary button with hover translation and shadow.
   - `.btn-secondary`: Clean bordered white button.
   - `.btn-lg`: Large button for CTAs.
2. **Form Controls**:
   - `.form-group`: Standard label and input column with 6px gap.
   - `.input-with-icon`: Input wrapper with positioned left/right icon.
3. **Modals**:
   - Consistent pattern observed across `CouponsPage` and `AdminUsersPage`:
     - `.modal-backdrop`: Fixed overlay backdrop `rgba(15, 23, 42, 0.6)` with center alignment.
     - `.modal-card.animate-scale-up`: White card container with `border-radius: 16px` and shadow.
     - `.modal-header`: Flexbox header with title and close button `.modal-close-btn`.
     - `.modal-actions`: Action button bar with Cancel (`.btn-secondary`) and Submit (`.btn-primary`).
4. **Table / Data Grid**:
   - Clean responsive wrapper with overflow-x, uppercase sticky header (`th`), hover row effect (`tr:hover`), and custom badge tags for status (`isActive`).

---

## 5. Network & API Service Layer (`src/services/api.js`)

### Instance & Interceptors
- **Base URL Resolution**:
  ```javascript
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  ```
  Note: Requests throughout the frontend explicitly call with `/api/...` prefix (e.g. `api.get('/api/products')`).
- **Request Interceptor**:
  - Automatically retrieves token from `localStorage` or `sessionStorage` (`token`).
  - Sets header: `config.headers.Authorization = 'Bearer ' + token`.
- **Response Interceptor**:
  - `401`: Clears credentials (`token`, `user`) and redirects to `/login?redirect=...`. Dispatches `api:unauthorized`.
  - `403`: Emits `api:forbidden` custom event.
- **Minimal Code Compliance**:
  - Directly invoke `api.get`, `api.post`, `api.put`, `api.delete` inside components/hooks without introducing redundant service abstraction wrappers.

---

## 6. Icons & UI Libraries

- **`lucide-react`**: Version `^1.50.0` is installed.
  - Used widely across all pages (`Navbar`, `Sidebar`, `HomePage`, `AdminUsersPage`, `CouponsPage`).
  - Suitable icons available for Product module:
    - Products: `Package`, `Box`, `ShoppingBag`
    - Actions: `Plus`, `Pencil`, `Trash2`, `Eye`, `EyeOff`, `Check`, `X`, `RefreshCw`
    - Search & Filter: `Search`, `SlidersHorizontal`, `Filter`, `ArrowUpDown`, `ChevronLeft`, `ChevronRight`
    - Badges & Status: `CheckCircle2`, `AlertCircle`, `Star`, `Tag`
- **Charts**: `chart.js` and `react-chartjs-2` are installed (used in Dashboard).
- **Notifications**: `react-hot-toast` is initialized and active.

---

## 7. Dependencies & Testing Infrastructure

### Dependencies in `package.json`
- **Runtime**:
  - `react`: `^19.2.8`
  - `react-dom`: `^19.2.8`
  - `react-router-dom`: `^7.18.4`
  - `axios`: `^1.20.0`
  - `lucide-react`: `^1.50.0`
  - `react-hot-toast`: `^2.6.1`
- **Testing & Tooling**:
  - `vitest`: `^2.1.8`
  - `jsdom`: `^25.0.1`
  - `@testing-library/react`: `^16.1.0`
  - `@testing-library/jest-dom`: `^6.6.3`
  - `@testing-library/user-event`: `^14.5.2`
  - `oxlint`: `^1.81.0`
- **Vitest Configuration (`vitest.config.js`)**:
  - Environment: `jsdom`
  - Setup file: `./src/test/setup.js` (mocks `localStorage`, `sessionStorage`, `matchMedia`, `window.location`).
  - `globals: true`, `css: true`.
- **Target Frontend Test Execution Command**:
  ```bash
  npm --prefix shop-project/frontend test -- src/pages/admin/AdminProductsPage.test.jsx src/pages/ProductsPage.test.jsx --run
  ```

---

## 8. Backend Alignment & Endpoint Mapping

The backend controller `shop-project/backend/src/controllers/productController.js` and model `productModel.js` provide the exact backend API needed:
1. **GET `/api/products`**:
   - Query params: `page`, `limit`, `search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`, `isActive`.
   - Response: `{ success: true, products: [...], total, totalPages, currentPage, limit }`.
2. **GET `/api/products/:id`**:
   - Response: `{ success: true, product }`.
3. **POST `/api/products`** (Admin & Staff):
   - Body: `{ name, description, price, originalPrice, category, brand, stock, images, isActive }`.
   - Response: `{ success: true, message, product }`.
4. **PUT `/api/products/:id`** (Admin & Staff):
   - Body: Partial or full fields.
   - Response: `{ success: true, message, product }`.
5. **DELETE `/api/products/:id`** (Admin & Staff):
   - Response: `{ success: true, message, productId }`.

---

## 9. Implementation Recommendations for Frontend Developer

1. **Admin Product Management (`/admin/products`)**:
   - Create `src/pages/admin/AdminProductsPage.jsx`.
   - Register route in `src/App.jsx` under `/admin`.
   - Add navigation item with `Package` icon in `src/components/admin/Sidebar.jsx`.
   - Table displays: Image thumbnail, Name, Category, Price / Original Price, Stock, Active Status toggle, Action buttons (Edit modal, Delete confirmation dialog).
   - Modal for Add / Edit product reusing standard form controls.

2. **Public Catalog Display & Filter (`/products`)**:
   - Create `src/pages/ProductsPage.jsx`.
   - Connect `/products` route in `src/App.jsx` to `ProductsPage`.
   - Feature search input with **300ms debounce** (`useEffect` or `setTimeout`) and clear button.
   - Filter sidebar / toolbar: Category select, Price range (min/max), Stock toggle (`inStock`), Sort dropdown (`sortBy`).
   - Sync all filters and pagination with URL search params via `useSearchParams()`.
   - Empty state UI when no matching products are returned.
   - Responsive card grid displaying image, name, category, price, discount badge, rating, and stock status.

3. **Automated Testing Suite**:
   - Create `src/pages/admin/AdminProductsPage.test.jsx` (testing rendering, modal CRUD, active toggle, RBAC checks).
   - Create `src/pages/ProductsPage.test.jsx` (testing search debounce, category filter, sorting, URL search params, empty state).
