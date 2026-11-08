# Category, Brand & Product Variant API

## Categories and brands

Public clients can list active records:

- `GET /api/categories`
- `GET /api/brands`

Admin and staff can manage records:

- `GET /api/categories/manage`, `GET /api/brands/manage`
- `POST /api/categories`, `POST /api/brands`
- `PUT /api/categories/:id`, `PUT /api/brands/:id`
- `DELETE /api/categories/:id`, `DELETE /api/brands/:id`

Mutations require a Bearer token and the `admin` or `staff` role. Record bodies accept `name`, `description`, `isActive`; brands also accept `logo`. Names are unique without regard to case. Deletion returns `409` while any product uses the record; deactivate it instead.

Products continue storing category and brand names as strings, so existing product records and catalog filters remain compatible. The admin product form uses active managed records and retains legacy values when editing.

## Product variants

Variants are embedded in each product and contain `sku`, `size`, `color`, `price`, `stock`, and `isActive`. Price may be omitted to use the product price; at least one of size or color and a non-negative integer stock are required. SKU values must be unique within a product.

- `POST /api/products/:id/variants`
- `PUT /api/products/:id/variants/:variantId`
- `DELETE /api/products/:id/variants/:variantId`

All variant mutations require a Bearer token and the `admin` or `staff` role. Product detail responses include variants; the storefront lets customers select an active variant and displays its price and stock.
