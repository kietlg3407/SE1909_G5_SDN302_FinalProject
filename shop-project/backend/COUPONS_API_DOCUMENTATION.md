# Get All Coupons API Documentation

## Overview
The Get All Coupons API has been enhanced with filtering, sorting, pagination, input validation, request logging, and detailed response metadata.

## Endpoint
```
GET /api/coupons
```

## Query Parameters

### Pagination Parameters
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | number | 1 | - | Page number (must be positive integer) |
| `limit` | number | 20 | 100 | Number of items per page (1-100) |

### Sorting Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | createdAt:desc | Sort field and order in format `field:order` |

**Valid Sort Fields:**
- `expiryDate` - Sort by coupon expiration date
- `createdAt` - Sort by coupon creation date (default)
- `discountValue` - Sort by discount value
- `code` - Sort by coupon code

**Valid Sort Orders:**
- `asc` or `1` - Ascending order
- `desc` or `-1` - Descending order

### Filter Parameters
| Parameter | Type | Valid Values | Description |
|-----------|------|--------------|-------------|
| `status` | string | active, expired | Filter coupons by status |
| `discountType` | string | percentage, fixed | Filter coupons by discount type |

## Request Examples

### Basic Request (with defaults)
```bash
GET /api/coupons
```
Returns first 20 coupons, sorted by createdAt descending.

### Pagination
```bash
GET /api/coupons?page=2&limit=10
```
Returns page 2 with 10 items per page.

### Sorting
```bash
GET /api/coupons?sortBy=expiryDate:asc
```
Returns coupons sorted by expiryDate in ascending order.

```bash
GET /api/coupons?sortBy=discountValue:desc
```
Returns coupons sorted by discountValue in descending order.

### Filtering by Status
```bash
GET /api/coupons?status=active
```
Returns only active coupons (expiryDate >= current date).

```bash
GET /api/coupons?status=expired
```
Returns only expired coupons (expiryDate < current date).

### Filtering by Discount Type
```bash
GET /api/coupons?discountType=percentage
```
Returns only percentage-based discount coupons.

```bash
GET /api/coupons?discountType=fixed
```
Returns only fixed amount discount coupons.

### Combined Filters and Sorting
```bash
GET /api/coupons?page=1&limit=15&sortBy=discountValue:desc&status=active&discountType=percentage
```
Returns active percentage coupons, sorted by discount value descending, 15 items per page.

## Response Format

### Success Response (200 OK)
```json
{
  "message": "Coupons retrieved successfully",
  "data": {
    "coupons": [
      {
        "_id": "...",
        "code": "SAVE20",
        "discountType": "percentage",
        "discountValue": 20,
        "minOrderValue": 100,
        "expiryDate": "2024-12-31T23:59:59.000Z",
        "usageLimit": 100,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "__v": 0
      }
    ],
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 20,
      "totalItems": 50,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "status": "all",
      "discountType": "all"
    },
    "sorting": {
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "message": "Invalid pagination parameters",
  "error": "Page must be a positive integer"
}
```

```json
{
  "message": "Invalid sort parameter",
  "error": "Invalid sort field. Valid fields are: expiryDate, createdAt, discountValue, code"
}
```

```json
{
  "message": "Invalid filter parameters",
  "error": "Invalid status. Valid values are: active, expired"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "message": "Failed to retrieve coupons",
  "error": "Database connection error"
}
```

## Features Implemented

### 1. Input Validation
- Pagination parameters validated to ensure positive integers
- Limit parameter capped at 100 to prevent excessive data retrieval
- Sort field and order validated against allowed values
- Filter parameters validated against allowed values
- Specific error messages for each validation failure

### 2. Filtering
- **Status Filtering**: Filter coupons by active/expired status based on expiryDate
- **Discount Type Filtering**: Filter by percentage or fixed discount types
- Filters can be combined for refined results

### 3. Sorting
- Sort by multiple fields: expiryDate, createdAt, discountValue, code
- Support for ascending and descending order
- Default sorting by createdAt descending
- Flexible format: `field:order` or just `field` (defaults to desc)

### 4. Pagination
- Default page size of 20 items
- Configurable page size (1-100)
- Pagination metadata in response:
  - Current page number
  - Items per page
  - Total items matching filter
  - Total pages
  - Has next page indicator
  - Has previous page indicator

### 5. Request Logging
- All requests logged with timestamp, method, path, query parameters, and IP
- Success responses logged with result count and pagination info
- Errors logged with detailed error messages
- Log format: `[Coupon API Request]` followed by JSON data

### 6. Response Metadata
- Coupons array with filtered and paginated results
- Pagination object with navigation information
- Filters object showing active filters
- Sorting object showing current sort configuration

### 7. Security Best Practices
- Input validation prevents injection attacks
- Limit on page size prevents resource exhaustion
- Error messages are specific but don't expose sensitive information
- Logging helps with debugging and security monitoring

## Helper Functions

### validatePaginationParams(page, limit)
Validates pagination parameters and returns parsed values or error.

### validateSortParam(sortBy)
Validates sort parameter and returns parsed field/order or error.

### validateFilterParams(status, discountType)
Validates filter parameters and returns validation result.

### buildFilterQuery(status, discountType)
Builds MongoDB query object based on filter parameters.

### logRequest(req, additionalInfo)
Logs request details with optional additional information.

## Performance Considerations

- Database queries use indexes on sort fields for optimal performance
- Pagination reduces memory usage and response size
- CountDocuments query executed before data retrieval for accurate metadata
- Filtering applied at database level for efficiency

## Future Enhancements

Potential improvements for future iterations:
- Add search functionality for coupon codes
- Add date range filtering for expiryDate
- Add support for multiple sort fields
- Add caching for frequently accessed queries
- Add rate limiting to prevent abuse
