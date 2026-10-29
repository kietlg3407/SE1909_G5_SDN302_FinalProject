# Member 6 - Admin Management Skill

## Description
This skill assists Member 6 with Admin Management, Promotion/Coupon, and Dashboard & Statistics features for the e-commerce project.

## Triggers
- Admin management tasks
- User role management
- Coupon creation/update/deletion
- Dashboard statistics
- Admin authentication and authorization
- Promotion and discount codes

## Actions

### 1. Admin User Management
When working with admin user management:

1. **Get all users**
   - Endpoint: `GET /api/admin/users`
   - Requires: Admin authentication
   - Backend: `backend/src/controllers/adminController.js` - `getAllUsers()`
   - Frontend: `frontend/src/pages/admin/AdminUsersPage.jsx`

2. **Update user role**
   - Endpoint: `PUT /api/admin/users/:id/role`
   - Body: `{ role: 'customer' | 'staff' | 'admin' }`
   - Requires: Admin authentication
   - Backend: `backend/src/controllers/adminController.js` - `updateUserRole()`
   - Frontend: Role dropdown in AdminUsersPage

3. **Delete user**
   - Endpoint: `DELETE /api/admin/users/:id`
   - Requires: Admin authentication
   - Backend: `backend/src/controllers/adminController.js` - `deleteUser()`
   - Frontend: Delete button with confirmation modal in AdminUsersPage

### 2. Coupon Management
When working with coupons:

1. **Get all coupons**
   - Endpoint: `GET /api/coupons`
   - Backend: `backend/src/controllers/couponController.js` - `getAllCoupons()`
   - Frontend: `frontend/src/pages/admin/CouponsPage.jsx`

2. **Create coupon**
   - Endpoint: `POST /api/coupons`
   - Body:
     ```json
     {
       "code": "SUMMER2026",
       "discountType": "percentage" | "fixed",
       "discountValue": 10,
       "minOrderValue": 100000,
       "expiryDate": "2026-12-31T23:59:59.000Z",
       "usageLimit": 100
     }
     ```
   - Backend: `backend/src/controllers/couponController.js` - `createCoupon()`
   - Frontend: Coupon form in CouponsPage

3. **Update coupon**
   - Endpoint: `PUT /api/coupons/:id`
   - Body: Same as create (all fields optional)
   - Backend: `backend/src/controllers/couponController.js` - `updateCoupon()`
   - Frontend: Edit mode in CouponsPage

4. **Delete coupon**
   - Endpoint: `DELETE /api/coupons/:id`
   - Backend: `backend/src/controllers/couponController.js` - `deleteCoupon()`
   - Frontend: Delete button with confirmation in CouponsPage

### 3. Dashboard Statistics
When working with dashboard:

1. **Get statistics**
   - Endpoint: `GET /api/admin/stats`
   - Requires: Admin authentication
   - Response:
     ```json
     {
       "stats": {
         "totalRevenue": 0,
         "totalOrders": 0,
         "totalProducts": 0,
         "totalUsers": 0
       }
     }
     ```
   - Backend: `backend/src/controllers/statsController.js` - `getStats()`
   - Frontend: `frontend/src/pages/admin/DashboardPage.jsx`

## Code Patterns

### Backend Controller Pattern
```javascript
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    return res.status(200).json({
      message: 'Users retrieved successfully',
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve users',
      error: getErrorMessage(error),
    });
  }
};
```

### Frontend API Call Pattern
```javascript
const fetchUsers = useCallback(async () => {
  try {
    setLoading(true);
    const response = await api.get('/api/admin/users');
    const receivedUsers = response.data?.users;
    setUsers(Array.isArray(receivedUsers) ? receivedUsers : []);
  } catch (error) {
    toast.error(getErrorMessage(error, 'Unable to load users'));
  } finally {
    setLoading(false);
  }
}, []);
```

### Error Handling
```javascript
const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.response?.data?.error || fallback;
```

## File Locations

### Backend
- Controllers: `shop-project/backend/src/controllers/`
  - `adminController.js` - User management
  - `couponController.js` - Coupon management
  - `statsController.js` - Statistics
- Routes: `shop-project/backend/src/routes/`
  - `adminRoutes.js` - Admin endpoints
  - `couponRoutes.js` - Coupon endpoints
  - `statsRoutes.js` - Stats endpoints
- Models: `shop-project/backend/src/models/`
  - `userModel.js` - User schema
  - `couponModel.js` - Coupon schema
- Middlewares: `shop-project/backend/src/middlewares/`
  - `authMiddleware.js` - Authentication & authorization

### Frontend
- Pages: `shop-project/frontend/src/pages/admin/`
  - `AdminUsersPage.jsx` - User management UI
  - `CouponsPage.jsx` - Coupon management UI
  - `DashboardPage.jsx` - Dashboard UI
- Components: `shop-project/frontend/src/components/`
  - `AdminRoute.jsx` - Admin route protection
  - `admin/AdminNavbar.jsx` - Admin navigation
  - `admin/Sidebar.jsx` - Admin sidebar

## Validation Rules

### User Role Validation
- Valid roles: `['customer', 'staff', 'admin']`
- Users cannot change their own role
- Users cannot delete their own account

### Coupon Validation
- Code: Required, unique, uppercase, alphanumeric with hyphens/underscores
- Discount type: Must be 'percentage' or 'fixed'
- Discount value: Non-negative number
  - Percentage: 0-100
  - Fixed: Positive integer
- Min order value: Non-negative number
- Expiry date: Must be in the future (if set)
- Usage limit: Non-negative integer

## Testing Checklist

Before completing any task:
- [ ] Backend compiles without errors
- [ ] Frontend builds without errors
- [ ] API endpoints return correct responses
- [ ] Admin authentication works correctly
- [ ] UI displays data properly
- [ ] Loading states work correctly
- [ ] Error handling works correctly
- [ ] Form validation works as expected
- [ ] Responsive design is maintained

## Common Tasks

### Add new admin endpoint
1. Add controller function in appropriate controller file
2. Add route in appropriate routes file with `protect` and `isAdmin` middleware
3. Update frontend to call the new endpoint
4. Add error handling and loading states

### Add new coupon field
1. Update `couponModel.js` schema
2. Update `couponController.js` to handle the new field
3. Update frontend form in `CouponsPage.jsx`
4. Add validation for the new field

### Add new dashboard metric
1. Update `statsController.js` to calculate the new metric
2. Add metric to response object
3. Update `DashboardPage.jsx` to display the new metric
4. Add appropriate icon and styling

## Notes
- Always use `select('-password')` when querying users
- Apply `protect` and `isAdmin` middleware to all admin routes
- Use Vietnamese/English bilingual UI where appropriate
- Maintain consistent error response format
- Follow existing code style and patterns
- Test with different user roles (customer, staff, admin)
