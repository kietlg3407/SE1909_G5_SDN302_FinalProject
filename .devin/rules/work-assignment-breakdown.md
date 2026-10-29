# Bảng Phân Công Công Việc Chi Tiết - Member 6

## Tổng quan
Bảng này phân chia công việc của Member 6 thành các bước nhỏ, chi tiết để dễ dàng theo dõi và quản lý tiến độ.

---

## MỤC 1: ADMIN MANAGEMENT (Quản trị viên)

### Task 1.1: Get All Users API
**Mức độ:** ⭐ Trung bình
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Backend Steps
- [ ] Review `adminController.js` - check existing `getAllUsers()` function
- [ ] Verify error handling pattern matches project standards
- [ ] Test endpoint with Postman/Thunder Client: `GET /api/admin/users`
- [ ] Verify response format: `{ message, users }`
- [ ] Verify `.select('-password')` is applied
- [ ] Test with authentication (admin token)
- [ ] Test without authentication (should return 401)
- [ ] Test with non-admin role (should return 403)

#### Frontend Steps
- [ ] Review `AdminUsersPage.jsx` - check existing implementation
- [ ] Verify API call uses `api.get('/api/admin/users')`
- [ ] Check loading state implementation
- [ ] Check error handling with toast notifications
- [ ] Verify state update for users array
- [ ] Test UI displays user list correctly
- [ ] Test empty state handling
- [ ] Test responsive design on mobile

#### Testing Steps
- [ ] Start backend server: `cd shop-project/backend && npm start`
- [ ] Start frontend server: `cd shop-project/frontend && npm run dev`
- [ ] Login as admin user
- [ ] Navigate to Admin Users page
- [ ] Verify all users are displayed
- [ ] Check console for errors
- [ ] Test with different screen sizes

---

### Task 1.2: Update User Role API
**Mức độ:** ⭐ Trung bình
**Trạng thái:** ☑ Completed

#### Backend Steps
- [x] Review `adminController.js` - check `updateUserRole()` function
- [x] Verify role validation against `validRoles` array
- [x] Check error handling for invalid roles
- [x] Test endpoint: `PUT /api/admin/users/:id/role`
- [x] Test with valid role (customer, staff, admin)
- [x] Test with invalid role (should return 400)
- [x] Test with non-existent user ID (should return 404)
- [x] Verify response includes updated user object

#### Frontend Steps
- [x] Review role dropdown in `AdminUsersPage.jsx`
- [x] Verify options: customer, staff, admin
- [x] Check `handleRoleChange()` function
- [x] Verify API call: `api.put('/api/admin/users/${userId}/role', { role })`
- [x] Check loading state during update
- [x] Verify user cannot change own role (disabled)
- [x] Check toast notification on success
- [x] Check toast notification on error
- [x] Verify local state updates after success

#### Testing Steps
- [x] Login as admin
- [x] Navigate to Admin Users page
- [x] Try to change another user's role
- [x] Verify role updates in UI
- [x] Refresh page and verify change persists
- [x] Try to change own role (should be disabled)
- [x] Try to set invalid role (should show error)

---

### Task 1.3: Delete User API
**Mức độ:** ⭐ Trung bình
**Trạng thái:** ☑ Completed

#### Backend Steps
- [x] Review `adminController.js` - check `deleteUser()` function
- [x] Verify error handling for non-existent user
- [x] Test endpoint: `DELETE /api/admin/users/:id`
- [x] Test with valid user ID
- [x] Test with non-existent user ID (should return 404)
- [x] Verify response includes deleted user object
- [x] Verify user is actually removed from database

#### Frontend Steps
- [x] Review delete button in `AdminUsersPage.jsx`
- [x] Check confirmation modal implementation
- [x] Verify modal shows user name/email
- [x] Check `confirmDelete()` function
- [x] Verify API call: `api.delete('/api/admin/users/${userId}')`
- [x] Check loading state during deletion
- [x] Verify user cannot delete own account (disabled)
- [x] Check toast notification on success
- [x] Check toast notification on error
- [x] Verify local state updates after deletion
- [x] Check keyboard support (Escape to close modal)

#### Testing Steps
- [x] Login as admin
- [x] Navigate to Admin Users page
- [x] Click delete button on a user
- [x] Verify confirmation modal appears
- [x] Cancel deletion and verify user still exists
- [x] Confirm deletion and verify user is removed
- [x] Refresh page and verify user is gone
- [x] Try to delete own account (should be disabled)
- [x] Test modal closes on Escape key

---

### Task 1.4: Admin Authentication & Authorization
**Mức độ:** ⭐⭐ Quan trọng
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Backend Steps
- [ ] Review `authMiddleware.js` - check `protect()` function
- [ ] Review `authMiddleware.js` - check `isAdmin()` function
- [ ] Verify JWT token validation
- [ ] Verify user role check
- [ ] Test protected route without token (should return 401)
- [ ] Test admin route with non-admin token (should return 403)
- [ ] Test admin route with admin token (should succeed)
- [ ] Check error messages are user-friendly

#### Frontend Steps
- [ ] Review `AdminRoute.jsx` component
- [ ] Verify it checks user role before rendering
- [ ] Test redirect for non-admin users
- [ ] Review `AdminNavbar.jsx` for admin-specific links
- [ ] Review `Sidebar.jsx` for admin navigation
- [ ] Verify admin pages are only accessible to admins
- [ ] Test logout behavior

#### Testing Steps
- [ ] Login as customer (should not see admin pages)
- [ ] Login as staff (should not see admin pages)
- [ ] Login as admin (should see admin pages)
- [ ] Try to access admin routes directly (non-admin)
- [ ] Verify redirect to appropriate page
- [ ] Check browser console for errors

---

## MỤC 2: PROMOTION / COUPON (Mã giảm giá)

### Task 2.1: Get All Coupons API
**Mức độ:** ⭐ Dễ
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Backend Steps
- [ ] Review `couponController.js` - check `getAllCoupons()` function
- [ ] Verify error handling pattern
- [ ] Test endpoint: `GET /api/coupons`
- [ ] Verify response format: `{ message, coupons }`
- [ ] Test with no coupons (should return empty array)
- [ ] Test with multiple coupons

#### Frontend Steps
- [ ] Review `CouponsPage.jsx` - check `fetchCoupons()` function
- [ ] Verify API call: `api.get('/api/coupons')`
- [ ] Check loading state implementation
- [ ] Check error handling with toast
- [ ] Verify state update for coupons array
- [ ] Test UI displays coupon list correctly
- [ ] Test empty state handling
- [ ] Test filtering (all, active, expired)
- [ ] Test search by code

#### Testing Steps
- [ ] Start backend and frontend servers
- [ ] Login as admin
- [ ] Navigate to Coupons page
- [ ] Verify all coupons are displayed
- [ ] Test search functionality
- [ ] Test status filter (all, active, expired)
- [ ] Check responsive design

---

### Task 2.2: Create Coupon API
**Mức độ:** ⭐⭐ Trung bình
**Trạng thái:** ☑ Completed

#### Backend Steps
- [x] Review `couponController.js` - check `createCoupon()` function
- [x] Review `couponModel.js` - check schema validation
- [x] Test endpoint: `POST /api/coupons`
- [x] Test with valid coupon data
- [x] Test with duplicate code (should fail)
- [x] Test with invalid discount type (should fail)
- [x] Test with percentage > 100 (should fail)
- [x] Test with negative discount value (should fail)
- [x] Test with expiry date in past (should fail)
- [x] Verify response includes created coupon

#### Frontend Steps
- [x] Review coupon form in `CouponsPage.jsx`
- [x] Check form fields: code, discountType, discountValue, minOrderValue, expiryDate, usageLimit
- [x] Review `buildPayload()` function for validation
- [x] Check validation rules:
  - [x] Code: required, uppercase, alphanumeric with hyphens/underscores
  - [x] Discount type: percentage or fixed
  - [x] Discount value: non-negative
  - [x] Percentage: 0-100
  - [x] Fixed: positive integer
  - [x] Min order value: non-negative
  - [x] Expiry date: must be in future
  - [x] Usage limit: non-negative integer
- [x] Check `handleSubmit()` function
- [x] Verify API call: `api.post('/api/coupons', payload)`
- [x] Check loading state during submission
- [x] Check form error display
- [x] Check toast notification on success
- [x] Check form reset after success
- [x] Verify local state updates after creation

#### Testing Steps
- [x] Login as admin
- [x] Navigate to Coupons page
- [x] Fill form with valid data
- [x] Submit and verify coupon is created
- [x] Test validation: empty code (should show error)
- [x] Test validation: invalid code format (should show error)
- [x] Test validation: percentage > 100 (should show error)
- [x] Test validation: negative discount (should show error)
- [x] Test validation: past expiry date (should show error)
- [x] Test duplicate code (should show error)
- [x] Verify coupon appears in list after creation

---

### Task 2.3: Update Coupon API
**Mức độ:** ⭐⭐ Trung bình
**Trạng thái:** ☑ Completed

#### Backend Steps
- [x] Review `couponController.js` - check `updateCoupon()` function
- [x] Check `couponFields` array for allowed updates
- [x] Test endpoint: `PUT /api/coupons/:id`
- [x] Test with valid updates
- [x] Test with partial updates (only some fields)
- [x] Test with non-existent coupon ID (should return 404)
- [x] Test updating code to duplicate (should fail)
- [x] Verify response includes updated coupon

#### Frontend Steps
- [x] Review edit functionality in `CouponsPage.jsx`
- [x] Check `handleEdit()` function
- [x] Verify form populates with existing coupon data
- [x] Check date conversion for expiry date input
- [x] Verify edit mode indicator in UI
- [x] Check cancel edit button (X button)
- [x] Check `handleSubmit()` handles both create and update
- [x] Verify API call: `api.put('/api/coupons/${editingId}', payload)`
- [x] Check toast notification on success
- [x] Check form reset after update
- [x] Verify local state updates after update
- [x] Check scroll to top on edit

#### Testing Steps
- [x] Login as admin
- [x] Navigate to Coupons page
- [x] Click edit button on a coupon
- [x] Verify form populates with coupon data
- [x] Modify coupon data
- [x] Submit and verify coupon is updated
- [x] Test cancel edit (form should reset)
- [x] Test partial update (only change one field)
- [x] Refresh page and verify changes persist
- [x] Test updating to duplicate code (should fail)

---

### Task 2.4: Delete Coupon API
**Mức độ:** ⭐ Dễ
**Trạng thái:** ☑ Completed

#### Backend Steps
- [x] Review `couponController.js` - check `deleteCoupon()` function
- [x] Test endpoint: `DELETE /api/coupons/:id`
- [x] Test with valid coupon ID
- [x] Test with non-existent coupon ID (should return 404)
- [x] Verify response includes deleted coupon
- [x] Verify coupon is removed from database

#### Frontend Steps
- [x] Review delete button in `CouponsPage.jsx`
- [x] Check confirmation modal implementation
- [x] Verify modal shows coupon code
- [x] Check `handleDelete()` and `confirmDelete()` functions
- [x] Verify API call: `api.delete('/api/coupons/${couponId}')`
- [x] Check loading state during deletion
- [x] Check toast notification on success
- [x] Check toast notification on error
- [x] Verify local state updates after deletion
- [x] Check if editing same coupon, form resets
- [x] Check keyboard support (Escape to close modal)

#### Testing Steps
- [x] Login as admin
- [x] Navigate to Coupons page
- [x] Click delete button on a coupon
- [x] Verify confirmation modal appears
- [x] Cancel deletion and verify coupon still exists
- [x] Confirm deletion and verify coupon is removed
- [x] Refresh page and verify coupon is gone
- [x] Test modal closes on Escape key
- [x] Test deleting coupon currently being edited

---

### Task 2.5: Copy Coupon Code to Clipboard
**Mức độ:** ⭐ Dễ
**Trạng thái:** ☑ Completed

#### Frontend Steps
- [x] Review `copyCode()` function in `CouponsPage.jsx`
- [x] Check button placement and icon
- [x] Test copy functionality with valid code
- [x] Test toast notification on success
- [x] Test toast notification on error
- [x] Verify clipboard API usage

#### Testing Steps
- [x] Login as admin
- [x] Navigate to Coupons page
- [x] Click copy button on a coupon
- [x] Verify toast shows "Đã sao chép mã"
- [x] Paste to verify code was copied
- [x] Test in different browsers

---

## MỤC 3: DASHBOARD & STATISTICS (Dashboard & Thống kê)

### Task 3.1: Get Statistics API
**Mức độ:** ⭐⭐ Trung bình
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Backend Steps
- [ ] Review `statsController.js` - check `getStats()` function
- [ ] Review MongoDB aggregation queries
- [ ] Test endpoint: `GET /api/admin/stats`
- [ ] Verify response format: `{ message, stats }`
- [ ] Check stats fields:
  - [ ] totalRevenue (from orders, excluding cancelled)
  - [ ] totalOrders (excluding cancelled)
  - [ ] totalProducts (from products collection)
  - [ ] totalUsers (from users collection)
- [ ] Test with no data (should return zeros)
- [ ] Test with sample data
- [ ] Verify aggregation performance

#### Frontend Steps
- [ ] Review `DashboardPage.jsx` - check `fetchStats()` function
- [ ] Verify API call: `api.get('/api/admin/stats')`
- [ ] Check loading state implementation
- [ ] Check error handling with toast
- [ ] Verify state update for stats
- [ ] Check `readTrend()` function for trend data
- [ ] Test UI displays stats correctly

#### Testing Steps
- [ ] Start backend and frontend servers
- [ ] Login as admin
- [ ] Navigate to Dashboard page
- [ ] Verify all KPIs are displayed
- [ ] Verify values are formatted correctly (currency, numbers)
- [ ] Test with no data (should show zeros)
- [ ] Test with sample data
- [ ] Check console for errors

---

### Task 3.2: KPI Cards Display
**Mức độ:** ⭐ Dễ
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Frontend Steps
- [ ] Review KPI array in `DashboardPage.jsx`
- [ ] Check 4 KPI cards:
  - [ ] Total Revenue (Tổng doanh thu)
  - [ ] Total Orders (Tổng đơn hàng)
  - [ ] Total Users (Người dùng hoạt động)
  - [ ] Total Products (Sản phẩm)
- [ ] Verify icons for each KPI
- [ ] Verify color schemes for each KPI
- [ ] Check value formatting (currency for revenue, numbers for others)
- [ ] Check detail text display
- [ ] Verify responsive grid layout

#### Testing Steps
- [ ] Login as admin
- [ ] Navigate to Dashboard page
- [ ] Verify all 4 KPI cards are displayed
- [ ] Check values are formatted correctly
- [ ] Check icons are displayed
- [ ] Check colors match design
- [ ] Test on different screen sizes

---

### Task 3.3: Bar Chart (Overview)
**Mức độ:** ⭐⭐ Trung bình
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Frontend Steps
- [ ] Review `overviewData` in `DashboardPage.jsx`
- [ ] Check Chart.js configuration
- [ ] Verify data mapping to chart
- [ ] Check chart options (responsive, maintainAspectRatio)
- [ ] Verify colors for each bar
- [ ] Check tooltip configuration
- [ ] Test chart renders correctly
- [ ] Test hover effects

#### Testing Steps
- [ ] Login as admin
- [ ] Navigate to Dashboard page
- [ ] Verify bar chart is displayed
- [ ] Check data matches KPI values
- [ ] Hover over bars to see tooltips
- [ ] Test on different screen sizes
- [ ] Check chart is responsive

---

### Task 3.4: Line Chart (Revenue Trend)
**Mức độ:** ⭐⭐⭐ Khó
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Backend Steps
- [ ] Review `statsController.js` - check if trend data is included
- [ ] If not, add `revenueTrend` or `orderTrend` to response
- [ ] Trend data format: array of objects with label and value
- [ ] Test with sample trend data

#### Frontend Steps
- [ ] Review `readTrend()` function in `DashboardPage.jsx`
- [ ] Check trend data parsing logic
- [ ] Review `lineData` configuration
- [ ] Check Line chart setup
- [ ] Verify color and fill configuration
- [ ] Check chart options for line chart
- [ ] Test empty state (no trend data)
- [ ] Verify empty state message is displayed

#### Testing Steps
- [ ] Login as admin
- [ ] Navigate to Dashboard page
- [ ] Check if line chart is displayed (when trend data exists)
- [ ] Verify empty state when no trend data
- [ ] Test with trend data (if available)
- [ ] Check hover effects on data points
- [ ] Test on different screen sizes

---

### Task 3.5: Refresh Functionality
**Mức độ:** ⭐ Dễ
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Frontend Steps
- [ ] Review refresh button in `DashboardPage.jsx`
- [ ] Check `fetchStats()` is called on click
- [ ] Verify loading state during refresh
- [ ] Check spinner animation
- [ ] Verify button is disabled during refresh
- [ ] Test refresh updates data

#### Testing Steps
- [ ] Login as admin
- [ ] Navigate to Dashboard page
- [ ] Click refresh button
- [ ] Verify loading spinner appears
- [ ] Verify button is disabled
- [ ] Wait for refresh to complete
- [ ] Verify data is updated

---

## MỤC 4: INTEGRATION & TESTING

### Task 4.1: End-to-End Admin Flow
**Mức độ:** ⭐⭐⭐ Quan trọng
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Testing Steps
- [ ] Create test users with different roles (customer, staff, admin)
- [ ] Test complete admin workflow:
  - [ ] Login as admin
  - [ ] Navigate to Dashboard
  - [ ] Check statistics
  - [ ] Navigate to User Management
  - [ ] View all users
  - [ ] Change user role from customer to staff
  - [ ] Verify role change
  - [ ] Navigate to Coupons
  - [ ] Create new coupon
  - [ ] Edit coupon
  - [ ] Delete coupon
  - [ ] Logout
- [ ] Test as non-admin:
  - [ ] Login as customer
  - [ ] Try to access admin routes (should be blocked)
  - [ ] Login as staff
  - [ ] Try to access admin routes (should be blocked)

---

### Task 4.2: Cross-Browser Testing
**Mức độ:** ⭐⭐ Trung bình
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Testing Steps
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test in Safari (if available)
- [ ] Check for browser-specific issues
- [ ] Verify functionality works consistently

---

### Task 4.3: Responsive Design Testing
**Mức độ:** ⭐⭐ Trung bình
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Testing Steps
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Check AdminUsersPage responsiveness
- [ ] Check CouponsPage responsiveness
- [ ] Check DashboardPage responsiveness
- [ ] Verify navigation works on mobile
- [ ] Check modals work on mobile

---

### Task 4.4: Performance Testing
**Mức độ:** ⭐⭐ Trung bình
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Testing Steps
- [ ] Test with large user dataset (100+ users)
- [ ] Test with large coupon dataset (50+ coupons)
- [ ] Check page load times
- [ ] Check API response times
- [ ] Verify pagination if needed
- [ ] Check for memory leaks

---

### Task 4.5: Error Handling Testing
**Mức độ:** ⭐⭐ Quan trọng
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Testing Steps
- [ ] Test with network offline
- [ ] Test with slow network
- [ ] Test with invalid JWT token
- [ ] Test with expired JWT token
- [ ] Test with server errors (500)
- [ ] Verify error messages are user-friendly
- [ ] Verify toast notifications work
- [ ] Check recovery after errors

---

## MỤC 5: DOCUMENTATION

### Task 5.1: API Documentation
**Mức độ:** ⭐ Dễ
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Steps
- [ ] Document all admin endpoints
- [ ] Document all coupon endpoints
- [ ] Document all stats endpoints
- [ ] Include request/response examples
- [ ] Include authentication requirements
- [ ] Update README if needed

---

### Task 5.2: Code Comments
**Mức độ:** ⭐ Dễ
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Steps
- [ ] Review controller functions for complex logic
- [ ] Add comments where necessary (only if unclear)
- [ ] Keep comments minimal and concise
- [ ] Follow existing comment style

---

## MỤC 6: DEPLOYMENT PREPARATION

### Task 6.1: Environment Configuration
**Mức độ:** ⭐⭐ Quan trọng
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Steps
- [ ] Review `.env.example` for backend
- [ ] Ensure all required variables are documented
- [ ] Check JWT_SECRET is documented
- [ ] Check MONGODB_URI is documented
- [ ] Review frontend environment variables
- [ ] Update if needed

---

### Task 6.2: Final Verification
**Mức độ:** ⭐⭐⭐ Quan trọng
**Trạng thái:** ☐ Pending / ☐ In Progress / ☑ Completed

#### Steps
- [ ] Run backend: `npm start` - verify no errors
- [ ] Run frontend: `npm run dev` - verify no errors
- [ ] Run backend tests (if available)
- [ ] Run frontend tests (if available)
- [ ] Check for console warnings
- [ ] Verify all features work end-to-end
- [ ] Check for security vulnerabilities
- [ ] Verify no hardcoded secrets
- [ ] Check git status - verify only intended changes

---

## TRẠNG THÁI TỔNG QUÁT

### Hoàn thành
- Tổng tasks: 31
- Đã hoàn thành: 0
- Đang thực hiện: 0
- Chưa bắt đầu: 31

### Tiến độ theo mục
- Mục 1 (Admin Management): 0/4
- Mục 2 (Promotion/Coupon): 0/5
- Mục 3 (Dashboard & Statistics): 0/5
- Mục 4 (Integration & Testing): 0/5
- Mục 5 (Documentation): 0/2
- Mục 6 (Deployment): 0/2

---

## GHI CHÚ

### Dependencies (Tasks phụ thuộc vào task khác)
- Task 2.3 (Update Coupon) phụ thuộc vào Task 2.2 (Create Coupon)
- Task 2.4 (Delete Coupon) phụ thuộc vào Task 2.2 (Create Coupon)
- Task 3.4 (Line Chart) phụ thuộc vào Task 3.1 (Get Statistics API)
- Task 4.1 (End-to-End Flow) phụ thuộc vào tất cả các task trước

### Ưu tiên
- **High Priority**: Task 1.4, 3.1, 4.1, 4.5, 6.2
- **Medium Priority**: Task 1.2, 1.3, 2.2, 2.3, 3.4, 4.3, 4.4
- **Low Priority**: Task 2.5, 5.1, 5.2

### Estimated Time
- Mục 1: 4-6 hours
- Mục 2: 6-8 hours
- Mục 3: 4-6 hours
- Mục 4: 4-6 hours
- Mục 5: 1-2 hours
- Mục 6: 1-2 hours
- **Tổng cộng**: 20-30 hours
