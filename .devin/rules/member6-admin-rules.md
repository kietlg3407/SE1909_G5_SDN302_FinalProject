# Member 6 - Admin Management Rules

## Overview
Member 6，、/。

## Responsibilities

### 1. Admin Management (Quản trị viên)
- **Backend Files:**
  - `shop-project/backend/src/controllers/adminController.js`
  - `shop-project/backend/src/routes/adminRoutes.js`
  - `shop-project/backend/src/models/userModel.js`
  - `shop-project/backend/src/middlewares/authMiddleware.js`

- **Frontend Files:**
  - `shop-project/frontend/src/pages/admin/AdminUsersPage.jsx`
  - `shop-project/frontend/src/components/AdminRoute.jsx`
  - `shop-project/frontend/src/components/admin/AdminNavbar.jsx`
  - `shop-project/frontend/src/components/admin/Sidebar.jsx`

- **Functions:**
  - Get all users (view and filter users)
  - Update user role (customer, staff, admin)
  - Delete user account
  - Admin authentication and authorization

### 2. Promotion / Coupon (Mã giảm giá/Khuyến mãi)
- **Backend Files:**
  - `shop-project/backend/src/controllers/couponController.js`
  - `shop-project/backend/src/routes/couponRoutes.js`
  - `shop-project/backend/src/models/couponModel.js`

- **Frontend Files:**
  - `shop-project/frontend/src/pages/admin/CouponsPage.jsx`

- **Functions:**
  - Create new coupon (code, discount type, discount value, min order value, expiry date, usage limit)
  - Update existing coupon
  - Delete coupon
  - View all coupons with filtering (active/expired)
  - Copy coupon code to clipboard

### 3. Dashboard & Statistics (Dashboard & Thống kê)
- **Backend Files:**
  - `shop-project/backend/src/controllers/statsController.js`
  - `shop-project/backend/src/routes/statsRoutes.js`

- **Frontend Files:**
  - `shop-project/frontend/src/pages/admin/DashboardPage.jsx`

- **Functions:**
  - Display key performance indicators (KPIs):
    - Total revenue (tổng doanh thu)
    - Total orders (tổng đơn hàng)
    - Total users (tổng người dùng)
    - Total products (tổng sản phẩm)
  - Visualize data with charts (Bar chart, Line chart)
  - Real-time data refresh

## Code Conventions

### Backend (Node.js/Express)
- Use async/await for database operations
- Follow existing error handling pattern with `getErrorMessage()` helper
- Use `select('-password')` to exclude password from user queries
- Validate role against `validRoles` array: `['customer', 'staff', 'admin']`
- Apply `protect` and `isAdmin` middleware for admin-only routes
- Return consistent response format: `{ message, data/error }`

### Frontend (React)
- Use functional components with hooks (useState, useEffect, useCallback, useMemo)
- Use lucide-react for icons
- Use react-hot-toast for notifications
- Inline styles with scoped class names (e.g., `admin-users-*`, `coupon-*`, `dashboard-*`)
- Follow Vietnamese/English bilingual UI where appropriate
- Implement loading states and error handling
- Use API service from `src/services/api.js`

### User Model Fields
- `_id`, `name`, `email`, `password`, `avatar`, `role`, `addresses`, `createdAt`, `updatedAt`
- Role enum: `customer`, `staff`, `admin`

### Coupon Model Fields
- `_id`, `code`, `discountType` (percentage/fixed), `discountValue`, `minOrderValue`, `expiryDate`, `usageLimit`, `createdAt`, `updatedAt`

## API Endpoints

### Admin Routes
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/:id/role` - Update user role (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

### Coupon Routes
- `GET /api/coupons` - Get all coupons
- `POST /api/coupons` - Create new coupon
- `PUT /api/coupons/:id` - Update coupon
- `DELETE /api/coupons/:id` - Delete coupon

### Stats Routes
- `GET /api/admin/stats` - Get dashboard statistics (admin only)

## Development Workflow

### When making changes:
1. Always read the existing file first before editing
2. Follow the existing code patterns and style
3. Test the API endpoints with proper authentication
4. Verify UI changes in the browser
5. Ensure admin-only routes are properly protected

### When adding new features:
1. Update backend controller with proper error handling
2. Add corresponding route with middleware protection
3. Update model schema if needed
4. Create/update frontend components
5. Add proper loading and error states
6. Test with different user roles

## Testing Commands

### Backend
```bash
cd shop-project/backend
npm start
```

### Frontend
```bash
cd shop-project/frontend
npm run dev
```

## Common Issues & Solutions

### Admin authentication issues
- Ensure JWT token is valid and included in Authorization header
- Check that user role is 'admin' in database
- Verify middleware is applied correctly to routes

### Coupon validation
- Code must be unique (case-insensitive)
- Discount type must be 'percentage' or 'fixed'
- Percentage discount must be between 0-100
- Fixed discount must be a positive integer
- Expiry date must be in the future (if set)

### Dashboard data
- Ensure MongoDB collections exist (orders, products, users)
- Check that aggregate queries are working correctly
- Verify response format matches frontend expectations

## Security Notes
- Never expose user passwords in API responses
- Always validate user roles before admin operations
- Use parameterized queries to prevent injection
- Apply rate limiting to sensitive operations
- Log admin actions for audit trail
