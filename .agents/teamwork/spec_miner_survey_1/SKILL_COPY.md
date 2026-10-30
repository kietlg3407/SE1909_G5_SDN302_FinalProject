---
name: product-management
description: Hướng dẫn quy chuẩn triển khai các tính năng Product (CRUD, Search, Filter, Sort) với code tối giản, an toàn RBAC và đồng bộ URL query.
---

# Product Management Skill

## 1. Backend Standards
- **Model Product**: Schema tối giản với các trường thiết yếu (`name`, `description`, `price`, `originalPrice`, `category`, `brand`, `stock`, `images`, `rating`, `numReviews`, `isActive`).
- **Unified Controller**: Gom toàn bộ logic vào `getProducts`:
  ```javascript
  const { search, category, minPrice, maxPrice, inStock, sortBy, page = 1, limit = 12 } = req.query;
  ```
- **RBAC**: Sử dụng middleware `protect` và `isStaffOrAdmin` cho các thao tác POST/PUT/DELETE.

## 2. Frontend Standards
- **Admin Management**: Bảng quản lý tinh gọn, Modal Thêm/Sửa dùng chung hoặc đơn giản, chuyển đổi trạng thái `isActive` bằng 1 click.
- **Client Catalog**: Grid responsive hiển thị thẻ sản phẩm tinh tế, đồng bộ trạng thái tìm kiếm và bộ lọc qua URL search params.
- **Tối ưu hóa Code**: Sử dụng native hooks (`useState`, `useEffect`, `useMemo`), không lạm dụng external packages.

## 3. Testing Accounts & Standards
- Sử dụng tài khoản mặc định chuẩn:
  - Admin: `admin@shop.com` / `admin123`
  - Staff: `staff@shop.com` / `staff123`
  - Customer: `customer@shop.com` / `password123`
- Test Backend với Supertest/Jest/Node: Đảm bảo kiểm tra quyền (Admin/Staff được phép, Customer bị cấm 403), kiểm tra validation dữ liệu.
- Test Frontend với Vitest & Testing Library: Kiểm tra render, toggle modal, submit form, cập nhật UI.
