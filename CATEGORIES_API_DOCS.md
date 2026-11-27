# RK Tiles — Categories API Integration Documentation

A quick-reference guide for integrating the Categories module into the Admin Panel and Public Website.

---

## 📌 Base Configuration

- **Base URL**: `http://localhost:5000/api/v1`
- **Prefix**: `/categories`
- **Full Base Route**: `http://localhost:5000/api/v1/categories`

### Required Headers
For all **Admin** requests (`POST`, `PATCH`, `DELETE`):
```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```
*(Public `GET` requests do not require headers, but if an admin token is passed, the API also returns inactive/hidden categories with accurate product counts).*

---

## 🚀 Quick Reference Table

| # | Action | HTTP Method | Endpoint | Access |
|---|---|:---:|---|:---:|
| 1 | **Create Category** | `POST` | `/api/v1/categories` | Admin Only |
| 2 | **Get All Categories** | `GET` | `/api/v1/categories` | Public / Admin |
| 3 | **Get Category by ID** | `GET` | `/api/v1/categories/:id` | Public / Admin |
| 4 | **Get Category by Slug** | `GET` | `/api/v1/categories/slug/:slug` | Public / Admin |
| 5 | **Update Category Details** | `PATCH` | `/api/v1/categories/:id` | Admin Only |
| 6 | **Toggle Active Status** | `PATCH` | `/api/v1/categories/:id/status` | Admin Only |
| 7 | **Toggle Visibility** | `PATCH` | `/api/v1/categories/:id/visibility` | Admin Only |
| 8 | **Reorder Categories** | `PATCH` | `/api/v1/categories/reorder` | Admin Only |
| 9 | **Delete / Deactivate Category** | `DELETE`| `/api/v1/categories/:id` | Admin Only |

---

## 1. Create Category
Add a new category. The backend automatically creates a unique URL-friendly `slug`.

- **Method**: `POST`
- **URL**: `http://localhost:5000/api/v1/categories`
- **Payload**:
```json
{
  "name": "Vitrified Floor Tiles",
  "description": "High durability and polished glazed vitrified tiles for living rooms and bedrooms.",
  "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
  "displayOrder": 1,
  "isActive": true,
  "isVisible": true
}
```
> **Fields:**
> - `name` *(String, Required)*: Minimum 2 characters.
> - `description` *(String, Optional)*
> - `image` *(String / URL, Optional)*
> - `displayOrder` *(Number, Optional, Default: 0)*
> - `isActive` *(Boolean, Optional, Default: true)*
> - `isVisible` *(Boolean, Optional, Default: true)*

- **Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "674686abc1234567890def01",
    "name": "Vitrified Floor Tiles",
    "slug": "vitrified-floor-tiles",
    "description": "High durability and polished glazed vitrified tiles for living rooms and bedrooms.",
    "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "displayOrder": 1,
    "isActive": true,
    "isVisible": true,
    "createdBy": "6746811234567890abcdef12",
    "updatedBy": "6746811234567890abcdef12",
    "createdAt": "2026-11-27T07:30:00.000Z",
    "updatedAt": "2026-11-27T07:30:00.000Z"
  }
}
```

---

## 2. Get All Categories
Fetches all categories with calculated `productCount`.

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/categories`
- **Optional Query Params**:
  - `?search=marble` (searches category name)
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": [
    {
      "_id": "674686abc1234567890def01",
      "name": "Vitrified Floor Tiles",
      "slug": "vitrified-floor-tiles",
      "description": "High durability and polished glazed vitrified tiles.",
      "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      "displayOrder": 1,
      "isActive": true,
      "isVisible": true,
      "productCount": 18,
      "createdAt": "2026-11-27T07:30:00.000Z"
    },
    {
      "_id": "674686abc1234567890def02",
      "name": "Ceramic Wall Tiles",
      "slug": "ceramic-wall-tiles",
      "description": "Designer wall tiles for bathroom and kitchen.",
      "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
      "displayOrder": 2,
      "isActive": true,
      "isVisible": true,
      "productCount": 12,
      "createdAt": "2026-11-27T07:35:00.000Z"
    }
  ]
}
```

---

## 3. Get Category by ID
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/categories/:id`
  - *Example*: `http://localhost:5000/api/v1/categories/674686abc1234567890def01`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category fetched successfully",
  "data": {
    "_id": "674686abc1234567890def01",
    "name": "Vitrified Floor Tiles",
    "slug": "vitrified-floor-tiles",
    "description": "High durability and polished glazed vitrified tiles.",
    "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "displayOrder": 1,
    "isActive": true,
    "isVisible": true,
    "productCount": 18
  }
}
```

---

## 4. Get Category by Slug
Ideal for clean URL routing in your frontend (e.g. `website.com/categories/vitrified-floor-tiles`).

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/v1/categories/slug/:slug`
  - *Example*: `http://localhost:5000/api/v1/categories/slug/vitrified-floor-tiles`
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category fetched successfully",
  "data": {
    "_id": "674686abc1234567890def01",
    "name": "Vitrified Floor Tiles",
    "slug": "vitrified-floor-tiles",
    "productCount": 18
  }
}
```

---

## 5. Update Category Details
Used in category edit modals/forms. (Only pass fields you want to update).

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/categories/:id`
  - *Example*: `http://localhost:5000/api/v1/categories/674686abc1234567890def01`
- **Payload**:
```json
{
  "name": "Glazed Vitrified Floor Tiles",
  "description": "Updated description with latest finishes.",
  "image": "https://example.com/updated-tile.jpg",
  "displayOrder": 3
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "674686abc1234567890def01",
    "name": "Glazed Vitrified Floor Tiles",
    "slug": "glazed-vitrified-floor-tiles",
    "description": "Updated description with latest finishes.",
    "image": "https://example.com/updated-tile.jpg",
    "displayOrder": 3,
    "isActive": true,
    "isVisible": true
  }
}
```

---

## 6. Update Category Active Status
Quick toggle to enable or disable a category.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/categories/:id/status`
- **Payload**:
```json
{
  "isActive": false
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category status updated successfully",
  "data": {
    "_id": "674686abc1234567890def01",
    "isActive": false
  }
}
```

---

## 7. Update Category Visibility
Toggle whether the category is shown on the public website.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/categories/:id/visibility`
- **Payload**:
```json
{
  "isVisible": true
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Category visibility updated successfully",
  "data": {
    "_id": "674686abc1234567890def01",
    "isVisible": true
  }
}
```

---

## 8. Reorder Categories
Update display orders for drag-and-drop category tables/grids.

- **Method**: `PATCH`
- **URL**: `http://localhost:5000/api/v1/categories/reorder`
- **Payload**:
```json
{
  "orderList": [
    { "id": "674686abc1234567890def01", "displayOrder": 1 },
    { "id": "674686abc1234567890def02", "displayOrder": 2 },
    { "id": "674686abc1234567890def03", "displayOrder": 3 }
  ]
}
```
- **Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Categories reordered successfully",
  "data": null
}
```

---

## 9. Delete Category
Safely removes or archives a category.

- **Method**: `DELETE`
- **URL**: `http://localhost:5000/api/v1/categories/:id`
  - *Example*: `http://localhost:5000/api/v1/categories/674686abc1234567890def01`

### Case A: Category has products linked to it
*(Backend safely deactivates it to protect product references)*
```json
{
  "success": true,
  "message": "Category has associated products, so it was deactivated instead of deleted.",
  "data": {
    "softDeleted": true,
    "message": "Category has associated products, so it was deactivated instead of deleted."
  }
}
```

### Case B: Category has NO products (0 products)
*(Permanently deleted from MongoDB)*
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {
    "softDeleted": false,
    "message": "Category deleted successfully"
  }
}
```

---

## 💡 Frontend Integration Example (Axios / Fetch)

### Axios Example
```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// Attach Admin Token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Category API service
export const CategoryApi = {
  getAll: (search = '') => API.get(`/categories${search ? `?search=${search}` : ''}`),
  getById: (id) => API.get(`/categories/${id}`),
  getBySlug: (slug) => API.get(`/categories/slug/${slug}`),
  create: (data) => API.post('/categories', data),
  update: (id, data) => API.patch(`/categories/${id}`, data),
  updateStatus: (id, isActive) => API.patch(`/categories/${id}/status`, { isActive }),
  updateVisibility: (id, isVisible) => API.patch(`/categories/${id}/visibility`, { isVisible }),
  reorder: (orderList) => API.patch('/categories/reorder', { orderList }),
  delete: (id) => API.delete(`/categories/${id}`),
};
```
