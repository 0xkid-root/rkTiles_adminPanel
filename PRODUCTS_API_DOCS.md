# RK Tiles — Products API Integration Documentation

A comprehensive guide for integrating the Products module into the Admin Panel and Public Website.

---

## 📌 Base Configuration

- **Base URL**: `http://localhost:5000/api/v1`
- **Prefix**: `/products`
- **Full Base Route**: `http://localhost:5000/api/v1/products`

### Headers Requirement
For all **Admin** requests (`POST`, `PATCH`, `DELETE`):
```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```
*(Public `GET` requests do not require headers. When an admin token is passed, public GET endpoints also include inactive and unpublished products).*

---

## 🚀 Quick Reference Table

| # | Action | HTTP Method | Endpoint | Access |
|---|---|:---:|---|:---:|
| 1 | **Create Product** | `POST` | `/api/v1/products` | Admin Only |
| 2 | **Get All Products (Filters & Pagination)** | `GET` | `/api/v1/products` | Public / Admin |
| 3 | **Get Featured Products** | `GET` | `/api/v1/products/featured` | Public / Admin |
| 4 | **Get Product by Slug** | `GET` | `/api/v1/products/slug/:slug` | Public / Admin |
| 5 | **Get Products by Category ID** | `GET` | `/api/v1/products/category/:categoryId` | Public / Admin |
| 6 | **Get Product by ID** | `GET` | `/api/v1/products/:id` | Public / Admin |
| 7 | **Update Product Details** | `PATCH` | `/api/v1/products/:id` | Admin Only |
| 8 | **Toggle Active Status** | `PATCH` | `/api/v1/products/:id/status` | Admin Only |
| 9 | **Toggle Visibility** | `PATCH` | `/api/v1/products/:id/visibility` | Admin Only |
| 10 | **Toggle Featured Status** | `PATCH` | `/api/v1/products/:id/featured` | Admin Only |
| 11 | **Delete / Archive Product** | `DELETE`| `/api/v1/products/:id` | Admin Only |

---

## 1. Create Product
Creates a new tile product. The backend verifies category existence, enforces unique SKU, generates a unique URL `slug`, and sets initial stock.

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/v1/products`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Payload**:
```json
{
  "name": "Royal Statuario Marble Tile",
  "SKU": "RSM-60120",
  "category": "674686abc1234567890def01",
  "description": "Premium Statuario glazed vitrified floor tile with high-definition Italian marble veining.",
  "images": [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a"
  ],
  "size": "600x1200",
  "finish": "Glossy",
  "surface": "Polished",
  "color": "White",
  "price": 1450,
  "stockQuantity": 150,
  "lowStockThreshold": 20,
  "isFeatured": true,
  "isActive": true,
  "isVisible": true
}
```

> **Field Specifications:**
> - `name` *(String, Required)*: Product title.
> - `SKU` *(String, Required, Unique)*: Unique SKU code (auto-uppercased).
> - `category` *(ObjectId, Required)*: Valid MongoDB `_id` of the Category.
> - `description` *(String, Optional)*
> - `images` *(Array of URL Strings, Optional)*
> - `size` *(String, Optional)*: e.g., `"600x1200"`, `"800x1600"`, `"300x600"`.
> - `finish` *(String, Optional)*: e.g., `"Glossy"`, `"Matt"`, `"Satin"`, `"Carving"`.
> - `surface` *(String, Optional)*: e.g., `"Polished"`, `"Rustic"`, `"Sugar"`.
> - `color` *(String, Optional)*: e.g., `"White"`, `"Beige"`, `"Grey"`, `"Black"`.
> - `price` *(Number, Optional)*: Unit / Box price (min: 0).
> - `stockQuantity` *(Integer, Default: 0)*: Initial available physical stock.
> - `lowStockThreshold` *(Integer, Default: 10)*: Quantity below which low-stock alerts trigger.
> - `isFeatured` *(Boolean, Default: false)*
> - `isActive` *(Boolean, Default: true)*
> - `isVisible` *(Boolean, Default: true)*

- **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "674691abc1234567890aaa01",
    "name": "Royal Statuario Marble Tile",
    "slug": "royal-statuario-marble-tile",
    "SKU": "RSM-60120",
    "category": {
      "_id": "674686abc1234567890def01",
      "name": "Vitrified Floor Tiles",
      "slug": "vitrified-floor-tiles",
      "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
    },
    "description": "Premium Statuario glazed vitrified floor tile with high-definition Italian marble veining.",
    "images": [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a"
    ],
    "size": "600x1200",
    "finish": "Glossy",
    "surface": "Polished",
    "color": "White",
    "price": 1450,
    "stockQuantity": 150,
    "lowStockThreshold": 20,
    "isFeatured": true,
    "isActive": true,
    "isVisible": true,
    "createdBy": "6746811234567890abcdef12",
    "updatedBy": "6746811234567890abcdef12",
    "createdAt": "2026-11-27T08:00:00.000Z",
    "updatedAt": "2026-11-27T08:00:00.000Z"
  }
}
```

---

## 2. Get All Products (Catalogue Listing with Filters & Pagination)
The primary catalogue endpoint supporting search, multiple filters, limit control, and sorting.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/products`
- **Supported Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `12`)
  - `search`: Keyword search matching Name, SKU, or Description (e.g. `?search=statuario`)
  - `category`: Category ID or Category Slug (e.g. `?category=vitrified-floor-tiles` or `?category=674686abc...`)
  - `size`: Tile dimensions (e.g. `?size=600x1200`)
  - `finish`: Finish type (e.g. `?finish=Glossy`)
  - `surface`: Surface texture (e.g. `?surface=Polished`)
  - `color`: Color shade (e.g. `?color=White`)
  - `isFeatured`: Filter featured tiles (`?isFeatured=true`)
  - `minPrice` & `maxPrice`: Price range (`?minPrice=1000&maxPrice=2000`)
  - `sort`: Sorting options:
    - `price_asc` (Lowest price first)
    - `price_desc` (Highest price first)
    - `name_asc` (A to Z)
    - `name_desc` (Z to A)
    - `oldest` (Oldest first)
    - default (Latest added first)

- **Example Query**:
  `GET /api/v1/products?page=1&limit=12&search=marble&finish=Glossy&size=600x1200&sort=price_asc`

- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": [
    {
      "_id": "674691abc1234567890aaa01",
      "name": "Royal Statuario Marble Tile",
      "slug": "royal-statuario-marble-tile",
      "SKU": "RSM-60120",
      "category": {
        "_id": "674686abc1234567890def01",
        "name": "Vitrified Floor Tiles",
        "slug": "vitrified-floor-tiles",
        "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        "isActive": true,
        "isVisible": true
      },
      "images": ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
      "size": "600x1200",
      "finish": "Glossy",
      "surface": "Polished",
      "color": "White",
      "price": 1450,
      "stockQuantity": 150,
      "lowStockThreshold": 20,
      "isFeatured": true,
      "isActive": true,
      "isVisible": true,
      "createdAt": "2026-11-27T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  }
}
```

---

## 3. Get Featured Products
Returns published products marked with `isFeatured: true` for the homepage or showcase sections.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/products/featured`
- **Optional Query Params**:
  - `?limit=8` (default: 8)
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Featured products fetched successfully",
  "data": [
    {
      "_id": "674691abc1234567890aaa01",
      "name": "Royal Statuario Marble Tile",
      "slug": "royal-statuario-marble-tile",
      "SKU": "RSM-60120",
      "category": {
        "_id": "674686abc1234567890def01",
        "name": "Vitrified Floor Tiles",
        "slug": "vitrified-floor-tiles"
      },
      "images": ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
      "size": "600x1200",
      "finish": "Glossy",
      "surface": "Polished",
      "price": 1450,
      "isFeatured": true
    }
  ]
}
```

---

## 4. Get Product by Slug
Best for public product detail pages (e.g. `/product/royal-statuario-marble-tile`).

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/products/slug/:slug`
  - *Example*: `http://localhost:5000/api/v1/products/slug/royal-statuario-marble-tile`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {
    "_id": "674691abc1234567890aaa01",
    "name": "Royal Statuario Marble Tile",
    "slug": "royal-statuario-marble-tile",
    "SKU": "RSM-60120",
    "category": {
      "_id": "674686abc1234567890def01",
      "name": "Vitrified Floor Tiles",
      "slug": "vitrified-floor-tiles"
    },
    "description": "Premium Statuario glazed vitrified floor tile with high-definition Italian marble veining.",
    "images": [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a"
    ],
    "size": "600x1200",
    "finish": "Glossy",
    "surface": "Polished",
    "color": "White",
    "price": 1450,
    "stockQuantity": 150,
    "lowStockThreshold": 20,
    "isFeatured": true,
    "isActive": true,
    "isVisible": true
  }
}
```

---

## 5. Get Products by Category ID
Fetches products belonging to a specific Category ID with optional filters and pagination.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/products/category/:categoryId`
  - *Example*: `http://localhost:5000/api/v1/products/category/674686abc1234567890def01?page=1&limit=12`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Products by category fetched successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 18,
    "totalPages": 2
  }
}
```

---

## 6. Get Product by ID
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/products/:id`
  - *Example*: `http://localhost:5000/api/v1/products/674691abc1234567890def01`
- **Response (`200 OK`)**: Returns full product data.

---

## 7. Update Product Details
Allows modifying fields in the product edit form. Only send the fields that need updating.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/products/:id`
  - *Example*: `http://localhost:5000/api/v1/products/674691abc1234567890aaa01`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Payload**:
```json
{
  "name": "Royal Statuario Polished Marble Tile",
  "price": 1550,
  "lowStockThreshold": 25,
  "finish": "High Gloss",
  "images": [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "https://images.unsplash.com/photo-new.jpg"
  ]
}
```
- **Response (`200 OK`)**: Returns updated product object.

---

## 8. Toggle Product Active Status (`isActive`)
Activates or deactivates a product across the system.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/products/:id/status`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Payload**:
```json
{
  "isActive": false
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product status updated successfully",
  "data": {
    "_id": "674691abc1234567890aaa01",
    "isActive": false
  }
}
```

---

## 9. Toggle Product Visibility (`isVisible`)
Hides or displays a product from the public website catalogue without deactivating it.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/products/:id/visibility`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Payload**:
```json
{
  "isVisible": true
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product visibility updated successfully",
  "data": {
    "_id": "674691abc1234567890aaa01",
    "isVisible": true
  }
}
```

---

## 10. Toggle Featured Status (`isFeatured`)
Toggle the featured badge for showcase displays.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/products/:id/featured`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Payload**:
```json
{
  "isFeatured": true
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Product featured status updated successfully",
  "data": {
    "_id": "674691abc1234567890aaa01",
    "isFeatured": true
  }
}
```

---

## 11. Delete / Archive Product (Safe Deletion)
Safely deletes a product.

> **Important Business Rule**: If any dealer has added this product to their cart, deleting it directly would corrupt their cart items. Therefore, the backend **soft-deactivates** the product (`isActive: false, isVisible: false`) rather than hard-deleting it, and informs you in the response. If the product is not in any cart, it is permanently deleted.

- **Method**: `DELETE`
- **URL**: `http://localhost:5000/api/v1/products/:id`
  - *Example*: `http://localhost:5000/api/v1/products/674691abc1234567890aaa01`
- **Headers**:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  ```

- **Response when product is present in dealer carts (Soft-deactivated)**:
```json
{
  "success": true,
  "message": "Product is present in dealer carts, so it was deactivated instead of deleted.",
  "data": {
    "softDeleted": true,
    "message": "Product is present in dealer carts, so it was deactivated instead of deleted."
  }
}
```

- **Response when product has no cart references (Permanently Deleted)**:
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "softDeleted": false,
    "message": "Product deleted successfully"
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

// Attach Admin Token if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ProductApi = {
  // Public & Admin Listings
  getAll: (params = {}) => API.get('/products', { params }),
  getFeatured: (limit = 8) => API.get(`/products/featured?limit=${limit}`),
  getBySlug: (slug) => API.get(`/products/slug/${slug}`),
  getByCategory: (categoryId, params = {}) => API.get(`/products/category/${categoryId}`, { params }),
  getById: (id) => API.get(`/products/${id}`),

  // Admin Mutations
  create: (data) => API.post('/products', data),
  update: (id, data) => API.patch(`/products/${id}`, data),
  updateStatus: (id, isActive) => API.patch(`/products/${id}/status`, { isActive }),
  updateVisibility: (id, isVisible) => API.patch(`/products/${id}/visibility`, { isVisible }),
  updateFeatured: (id, isFeatured) => API.patch(`/products/${id}/featured`, { isFeatured }),
  delete: (id) => API.delete(`/products/${id}`),
};
```
