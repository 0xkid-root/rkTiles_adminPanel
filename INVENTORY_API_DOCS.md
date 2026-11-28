# RK Tiles — Inventory & Stock Management API Integration Documentation

A comprehensive guide for integrating the Inventory & Stock Management module into the Admin Panel.

---

## 📌 Base Configuration

- **Base URL**: `http://localhost:5000/api/v1`
- **Prefix**: `/admin/inventory`
- **Full Base Route**: `http://localhost:5000/api/v1/admin/inventory`

### Headers Requirement (Admin Authentication Required)
All inventory endpoints are protected and require the Admin JWT token:
```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

---

## 🚀 Quick Reference Table

| # | Action | HTTP Method | Endpoint | Description |
|---|---|:---:|---|---|
| 1 | **Get Inventory List** | `GET` | `/api/v1/admin/inventory` | View all products with stock counts & status tags |
| 2 | **Get Inventory Summary** | `GET` | `/api/v1/admin/inventory/summary` | Aggregate metrics (total units, low stock, out of stock) |
| 3 | **Get Low Stock Products** | `GET` | `/api/v1/admin/inventory/low-stock` | Products where stock ≤ lowStockThreshold |
| 4 | **Get Out of Stock Products**| `GET` | `/api/v1/admin/inventory/out-of-stock` | Products where stock = 0 |
| 5 | **Get Product Stock History** | `GET` | `/api/v1/admin/inventory/:productId/history`| Full audit log of adjustments for a specific product |
| 6 | **Adjust Stock (Increase / Decrease)** | `PATCH` | `/api/v1/admin/inventory/:productId/adjust` | Increment or decrement stock with audit reason |
| 7 | **Set Exact Stock** | `PATCH` | `/api/v1/admin/inventory/:productId/set` | Physical warehouse count override with audit reason |

---

## 1. Get Inventory List
Returns a paginated list of products with calculated indicators (`isLowStock` and `isOutOfStock`), product SKU, category, and current stock quantity.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/admin/inventory`
- **Supported Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `20`)
  - `search`: Keyword search matching Name or SKU (e.g. `?search=RSM-60120`)
  - `status`: Filter by status (`low_stock` or `out_of_stock`)
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  ```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Inventory fetched successfully",
  "data": [
    {
      "_id": "674691abc1234567890aaa01",
      "name": "Royal Statuario Marble Tile",
      "SKU": "RSM-60120",
      "category": {
        "_id": "674686abc1234567890def01",
        "name": "Vitrified Floor Tiles",
        "slug": "vitrified-floor-tiles"
      },
      "stockQuantity": 8,
      "lowStockThreshold": 15,
      "isLowStock": true,
      "isOutOfStock": false,
      "price": 1450,
      "size": "600x1200",
      "updatedAt": "2026-11-27T10:00:00.000Z"
    },
    {
      "_id": "674691abc1234567890aaa02",
      "name": "Matt Black Slate Tile",
      "SKU": "MBS-6060",
      "category": {
        "_id": "674686abc1234567890def01",
        "name": "Vitrified Floor Tiles",
        "slug": "vitrified-floor-tiles"
      },
      "stockQuantity": 0,
      "lowStockThreshold": 10,
      "isLowStock": false,
      "isOutOfStock": true,
      "price": 950,
      "size": "600x600",
      "updatedAt": "2026-11-27T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## 2. Get Inventory Summary
Returns aggregate statistics used for top dashboard KPI cards and inventory analytics.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/admin/inventory/summary`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  ```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Inventory summary fetched successfully",
  "data": {
    "totalProducts": 45,
    "totalStockUnits": 12450,
    "lowStockProducts": 6,
    "outOfStockProducts": 2
  }
}
```

---

## 3. Get Low Stock Products
Returns all products whose `stockQuantity` is greater than 0 but less than or equal to their `lowStockThreshold`.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/admin/inventory/low-stock`
- **Optional Query Params**:
  - `?page=1&limit=20`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  ```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Low stock products fetched successfully",
  "data": [
    {
      "_id": "674691abc1234567890aaa01",
      "name": "Royal Statuario Marble Tile",
      "SKU": "RSM-60120",
      "category": {
        "_id": "674686abc1234567890def01",
        "name": "Vitrified Floor Tiles",
        "slug": "vitrified-floor-tiles"
      },
      "stockQuantity": 8,
      "lowStockThreshold": 15
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 6,
    "totalPages": 1
  }
}
```

---

## 4. Get Out of Stock Products
Returns products with `stockQuantity` equal to or less than 0.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/admin/inventory/out-of-stock`
- **Optional Query Params**:
  - `?page=1&limit=20`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  ```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Out of stock products fetched successfully",
  "data": [
    {
      "_id": "674691abc1234567890aaa02",
      "name": "Matt Black Slate Tile",
      "SKU": "MBS-6060",
      "category": {
        "_id": "674686abc1234567890def01",
        "name": "Vitrified Floor Tiles",
        "slug": "vitrified-floor-tiles"
      },
      "stockQuantity": 0,
      "lowStockThreshold": 10
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 5. Get Product Stock History (Audit Trail)
Returns the complete adjustment audit trail for a specific tile product, showing which admin made the change, previous quantity, change amount, new quantity, and reason.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/admin/inventory/:productId/history`
  - *Example*: `http://localhost:5000/api/v1/admin/inventory/674691abc1234567890aaa01/history?page=1&limit=10`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  ```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Stock history fetched successfully",
  "data": [
    {
      "_id": "674698abc1234567890zzz01",
      "product": "674691abc1234567890aaa01",
      "adjustmentType": "increase",
      "previousQuantity": 50,
      "adjustmentQuantity": 30,
      "newQuantity": 80,
      "reason": "Shipment received from Morbi plant",
      "adjustedBy": {
        "_id": "6746811234567890abcdef12",
        "name": "Super Admin",
        "email": "admin@rktiles.com"
      },
      "createdAt": "2026-11-27T11:00:00.000Z"
    },
    {
      "_id": "674698abc1234567890zzz02",
      "product": "674691abc1234567890aaa01",
      "adjustmentType": "decrease",
      "previousQuantity": 80,
      "adjustmentQuantity": 10,
      "newQuantity": 70,
      "reason": "Transit breakage during unloading",
      "adjustedBy": {
        "_id": "6746811234567890abcdef12",
        "name": "Super Admin",
        "email": "admin@rktiles.com"
      },
      "createdAt": "2026-11-27T11:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 6. Adjust Stock (Increase or Decrease)
Increases or decreases product stock quantity.
> **Critical Rule**: Stock cannot become negative. Attempting to decrease more stock than is currently available is rejected with `400 Bad Request`. Every call records an `InventoryHistory` audit entry.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/admin/inventory/:productId/adjust`
  - *Example*: `http://localhost:5000/api/v1/admin/inventory/674691abc1234567890aaa01/adjust`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json
  ```

### A. Increase Stock Example
- **Payload**:
```json
{
  "adjustmentType": "increase",
  "quantity": 50,
  "reason": "New production batch received"
}
```
> **Fields:**
> - `adjustmentType` *(String, Required)*: Must be `"increase"` or `"decrease"`.
> - `quantity` *(Integer, Required)*: Positive integer.
> - `reason` *(String, Required)*: Mandatory explanation for stock adjustment.

- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "product": {
      "_id": "674691abc1234567890aaa01",
      "name": "Royal Statuario Marble Tile",
      "SKU": "RSM-60120",
      "stockQuantity": 130
    },
    "historyRecord": {
      "_id": "674699abc1234567890yyy01",
      "product": "674691abc1234567890aaa01",
      "adjustmentType": "increase",
      "previousQuantity": 80,
      "adjustmentQuantity": 50,
      "newQuantity": 130,
      "reason": "New production batch received",
      "adjustedBy": "6746811234567890abcdef12",
      "createdAt": "2026-11-27T12:00:00.000Z"
    }
  }
}
```

### B. Decrease Stock Example
- **Payload**:
```json
{
  "adjustmentType": "decrease",
  "quantity": 15,
  "reason": "Damaged tiles removed from warehouse"
}
```

### C. Over-decrease Error Response (`400 Bad Request`)
If you try to decrease by 200 when current stock is only 80:
```json
{
  "success": false,
  "message": "Cannot decrease stock by 200. Current stock is only 80. Stock cannot be negative."
}
```

---

## 7. Set Exact Stock (Physical Inventory Audit)
Overrides the product stock to an exact number after a physical warehouse count. The backend calculates the difference and saves an audit record of type `"set"`.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/admin/inventory/:productId/set`
  - *Example*: `http://localhost:5000/api/v1/admin/inventory/674691abc1234567890aaa01/set`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Payload**:
```json
{
  "quantity": 250,
  "reason": "Quarterly physical warehouse inventory audit"
}
```
> **Fields:**
> - `quantity` *(Integer, Required)*: Minimum `0`.
> - `reason` *(String, Required)*: Mandatory audit reason.

- **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Stock set successfully",
  "data": {
    "product": {
      "_id": "674691abc1234567890aaa01",
      "name": "Royal Statuario Marble Tile",
      "SKU": "RSM-60120",
      "stockQuantity": 250
    },
    "historyRecord": {
      "_id": "674699abc1234567890yyy02",
      "product": "674691abc1234567890aaa01",
      "adjustmentType": "set",
      "previousQuantity": 130,
      "adjustmentQuantity": 120,
      "newQuantity": 250,
      "reason": "Quarterly physical warehouse inventory audit",
      "adjustedBy": "6746811234567890abcdef12",
      "createdAt": "2026-11-27T12:15:00.000Z"
    }
  }
}
```

---

## 💡 Frontend Integration Example (Axios Service)

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// Interceptor to attach Admin JWT Token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const InventoryApi = {
  // Get general inventory list with filters and search
  getInventory: (params = {}) => API.get('/admin/inventory', { params }),

  // Summary counts for dashboard metrics cards
  getSummary: () => API.get('/admin/inventory/summary'),

  // Filtered queries
  getLowStock: (params = {}) => API.get('/admin/inventory/low-stock', { params }),
  getOutOfStock: (params = {}) => API.get('/admin/inventory/out-of-stock', { params }),

  // Stock history for a product
  getProductHistory: (productId, params = {}) => 
    API.get(`/admin/inventory/${productId}/history`, { params }),

  // Adjust stock (increase or decrease)
  adjustStock: (productId, { adjustmentType, quantity, reason }) =>
    API.patch(`/admin/inventory/${productId}/adjust`, { adjustmentType, quantity, reason }),

  // Set stock to exact count
  setStock: (productId, { quantity, reason }) =>
    API.patch(`/admin/inventory/${productId}/set`, { quantity, reason }),
};
```
