Yes, now RK Tiles frontend is ready, and you’re moving to the **Backend using Node.js + Express + MongoDB**. Before writing code, the best approach is to finalize the backend architecture, authentication, database models, API routes, and role-based access.

Because your admin panel and dealer portal already exist in the frontend, we should design APIs to connect directly to those pages rather than change the frontend.

## **1. Backend architecture**

## **RK Tiles Backend**

Node.js · Express · MongoDB · JWT

**Public Website**

Products · Categories · Product Details · Cart Entry

**Dealer Portal**

Signup · Login · Dashboard · My Cart · My Profile

**Admin Panel**

Products · Categories · Stock · Dealers · Cart Monitoring · Website Content

**Node.js + Express REST API**

Routes · Controllers · Services · Middleware · Validation

**MongoDB + Mongoose**

Admins · Dealers · Categories · Products · Carts · Stock History · Website Settings

## **2. Authentication — how we should handle it**

I recommend **two authentication systems using the same backend**, not two different backends.

|                  | Admin                             | Dealer                        |
| ---------------- | --------------------------------- | ----------------------------- |
| Login            | Admin email + password            | Dealer email + password       |
| Account creation | Created by setup/authorized admin | Dealer signup                 |
| Authentication   | JWT access token                  | JWT access token              |
| Role             | `admin`                           | `dealer`                      |
| Account approval | Admin account active              | Dealer approval required      |
| Permissions      | Full admin permissions            | Own profile and own cart only |
| Token            | Same JWT system                   | Same JWT system               |

### **Admin creation (your preferred approach)**

Don't allow public admin signup.

Create a protected admin creation mechanism, ideally a **one-time seed script** to create the first admin. Then admins can create other admin accounts from the admin panel, if you decide to support that.

Admin creation payload:

```
{
  "name": "RK Tiles Admin",
  "email": "admin@rktiles.com",
  "password": "StrongPassword",
  "role": "admin"
}
```

Important: `role` must never be trusted from a public request body. The backend must assign roles and enforce permissions itself.

# **3. Complete API route structure**

Base URL:

```
/api/v1
```

We should divide the backend into modules. This makes it easy to maintain and prevents one huge `routes.js` file.

## **Module 1 — Authentication**

Public + protected authentication APIs

Base route: `/auth`

| Method | Endpoint                | Access        | Purpose                     |
| ------ | ----------------------- | ------------- | --------------------------- |
| POST   | `/auth/dealer/signup`   | Public        | Dealer registration         |
| POST   | `/auth/dealer/login`    | Public        | Dealer login                |
| POST   | `/auth/admin/login`     | Public        | Admin login                 |
| GET    | `/auth/me`              | Authenticated | Get logged-in user          |
| POST   | `/auth/logout`          | Authenticated | Logout / invalidate session |
| POST   | `/auth/change-password` | Authenticated | Change own password         |

### **Dealer signup**

`POST /api/v1/auth/dealer/signup`

```
{
  "businessName": "Sharma Tiles & Marble",
  "ownerName": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "Password123!",
  "mobile": "9876543210",
  "gstNumber": "09ABCDE1234F1Z5",
  "businessType": "retailer",
  "address": {
    "street": "Main Market",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "pincode": "226001",
    "country": "India"
  }
}
```

Backend automatically sets:

```
{
  "role": "dealer",
  "approvalStatus": "pending",
  "accountStatus": "active",
  "isVerified": false
}
```

Dealer should not get approval by sending `"approvalStatus": "approved"` in the request.

### **Admin login**

`POST /api/v1/auth/admin/login`

```
{
  "email": "admin@rktiles.com",
  "password": "StrongPassword"
}
```

### **Login response**

Both admin and dealer authentication can return the same response structure:

```
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "role": "dealer",
      "approvalStatus": "approved"
    },
    "accessToken": "jwt_token"
  }
}
```

Your frontend will use `role` to determine the correct dashboard and routes.

# **4. Admin creation and management**

Base route: `/admins`

This is separate from normal dealer signup.

| Method | Endpoint             | Purpose                   |
| ------ | -------------------- | ------------------------- |
| POST   | `/admins`            | Create another admin      |
| GET    | `/admins`            | List all admins           |
| GET    | `/admins/:id`        | View admin details        |
| PATCH  | `/admins/:id`        | Update admin information  |
| PATCH  | `/admins/:id/status` | Activate/deactivate admin |
| DELETE | `/admins/:id`        | Remove admin              |

Admin only

### **Create admin payload**

`POST /api/v1/admins`

```
{
  "name": "Store Manager",
  "email": "manager@rktiles.com",
  "password": "StrongPassword123"
}
```

The backend sets role automatically:

```
{
  "role": "admin"
}
```

Only an authenticated admin with permission to manage admins can create another admin. You can later restrict this to the primary/super admin.

For your first admin, use a seed script or secure one-time setup, not a public API.

# **5. Admin Dashboard APIs**

Base route: `/admin/dashboard`

| Method | Endpoint                             | Purpose                     |
| ------ | ------------------------------------ | --------------------------- |
| GET    | `/admin/dashboard/overview`          | All dashboard summary cards |
| GET    | `/admin/dashboard/inventory-summary` | Stock summary               |
| GET    | `/admin/dashboard/low-stock`         | Low-stock products          |
| GET    | `/admin/dashboard/recent-products`   | Recently added products     |
| GET    | `/admin/dashboard/recent-dealers`    | Recent dealer registrations |
| GET    | `/admin/dashboard/cart-summary`      | Dealer cart overview        |

Example overview response:

```
{
  "success": true,
  "data": {
    "totalProducts": 125,
    "totalCategories": 12,
    "totalStockQuantity": 8450,
    "totalDealers": 240,
    "approvedDealers": 215,
    "pendingDealers": 25,
    "lowStockProducts": 8,
    "outOfStockProducts": 3
  }
}
```

These should be calculated from MongoDB, not hardcoded.

# **6. Category APIs**

Base route: `/categories`

| Method | Endpoint                     | Access | Purpose                 |
| ------ | ---------------------------- | ------ | ----------------------- |
| GET    | `/categories`                | Public | Get visible categories  |
| GET    | `/categories/:id`            | Public | Category detail         |
| GET    | `/categories/slug/:slug`     | Public | Find by slug            |
| POST   | `/categories`                | Admin  | Create category         |
| PATCH  | `/categories/:id`            | Admin  | Update category         |
| DELETE | `/categories/:id`            | Admin  | Delete category         |
| PATCH  | `/categories/:id/status`     | Admin  | Enable/disable          |
| PATCH  | `/categories/:id/visibility` | Admin  | Publish/hide on website |
| PATCH  | `/categories/reorder`        | Admin  | Update display order    |

### **Create category payload**

```
{
  "name": "Wooden Tiles",
  "slug": "wooden-tiles",
  "description": "Premium wood-look tiles",
  "image": "https://example.com/wood.jpg",
  "displayOrder": 1,
  "isActive": true,
  "isVisible": true
}
```

Categories are controlled entirely by admin. Dealers cannot create categories.

# **7. Product APIs**

Base route: `/products`

These APIs will serve the public website and the admin panel.

| Method | Endpoint                         | Access | Purpose                  |
| ------ | -------------------------------- | ------ | ------------------------ |
| GET    | `/products`                      | Public | Product listing          |
| GET    | `/products/:id`                  | Public | Product detail           |
| GET    | `/products/slug/:slug`           | Public | Product by slug          |
| GET    | `/products/featured`             | Public | Featured products        |
| GET    | `/products/category/:categoryId` | Public | Products by category     |
| POST   | `/products`                      | Admin  | Create product           |
| PATCH  | `/products/:id`                  | Admin  | Update product           |
| DELETE | `/products/:id`                  | Admin  | Delete product           |
| PATCH  | `/products/:id/status`           | Admin  | Activate/deactivate      |
| PATCH  | `/products/:id/visibility`       | Admin  | Publish/unpublish        |
| PATCH  | `/products/:id/featured`         | Admin  | Mark featured/unfeatured |

### **Product listing filters**

Your frontend product listing will use query parameters instead of creating different APIs for every filter.

Example:

```
GET /api/v1/products?page=1&limit=12&category=wooden-tiles&search=beige&size=600x1200&finish=matte&sort=latest
```

Supported filters:

- `page`
- `limit`
- `search`
- `category`
- `size`
- `finish`
- `surface`
- `color`
- `featured`
- `sort`
- `minPrice`
- `maxPrice` (only if pricing is part of your catalogue)

Example product payload:

```
{
  "name": "Travertine Beige",
  "slug": "travertine-beige",
  "sku": "RK-TRV-001",
  "category": "category_id",
  "description": "Premium beige travertine-look tile",
  "images": [
    "image1_url",
    "image2_url"
  ],
  "size": "600x1200",
  "finish": "Matt",
  "surface": "Stone",
  "color": "Beige",
  "price": 0,
  "stockQuantity": 500,
  "lowStockThreshold": 50,
  "isFeatured": true,
  "isVisible": true,
  "isActive": true
}
```

Product pricing can be optional/hidden if RK Tiles catalogue doesn't publicly show pricing.

# **8. Inventory / Stock APIs**

Base route: `/admin/inventory`

| Method | Endpoint                              | Purpose                     |
| ------ | ------------------------------------- | --------------------------- |
| GET    | `/admin/inventory`                    | Inventory listing           |
| GET    | `/admin/inventory/summary`            | Stock summary               |
| GET    | `/admin/inventory/low-stock`          | Low-stock list              |
| GET    | `/admin/inventory/out-of-stock`       | Out-of-stock list           |
| GET    | `/admin/inventory/:productId/history` | Stock adjustment history    |
| PATCH  | `/admin/inventory/:productId/adjust`  | Increase/decrease stock     |
| PATCH  | `/admin/inventory/:productId/set`     | Set stock to exact quantity |

### **Adjust stock**

`PATCH /api/v1/admin/inventory/:productId/adjust`

```
{
  "adjustmentType": "increase",
  "quantity": 100,
  "reason": "New stock received"
}
```

Or decrease:

```
{
  "adjustmentType": "decrease",
  "quantity": 20,
  "reason": "Damaged tiles"
}
```

The backend should save stock history for every adjustment.

Important RK Tiles rule: Adding a product to a dealer cart does not decrease inventory. Stock changes only when an admin performs an inventory adjustment in this phase.

# **9. Dealer management APIs (Admin)**

Base route: `/admin/dealers`

This is where your admin panel manages dealer accounts.

| Method | Endpoint                          | Purpose                    |
| ------ | --------------------------------- | -------------------------- |
| GET    | `/admin/dealers`                  | List all dealers           |
| GET    | `/admin/dealers/:id`              | Dealer detail              |
| PATCH  | `/admin/dealers/:id`              | Update dealer information  |
| PATCH  | `/admin/dealers/:id/approval`     | Approve or reject dealer   |
| PATCH  | `/admin/dealers/:id/status`       | Activate/suspend dealer    |
| PATCH  | `/admin/dealers/:id/verification` | Update verification status |
| DELETE | `/admin/dealers/:id`              | Delete dealer if permitted |

### **Dealer list filtering**

```
GET /api/v1/admin/dealers?status=approved&city=Lucknow&search=Rahul&page=1&limit=20
```

Possible dealer approval statuses:

```
pending
approved
rejected
```

Account status:

```
active
suspended
```

Verification status:

```
unverified
pending
verified
rejected
```

### **Approve dealer**

`PATCH /api/v1/admin/dealers/:id/approval`

```
{
  "status": "approved",
  "remarks": "Documents reviewed and approved"
}
```

The backend should record who approved the dealer and when.

# **10. Dealer Dashboard APIs**

Base route: `/dealer/dashboard`

| Method | Endpoint                              | Purpose                  |
| ------ | ------------------------------------- | ------------------------ |
| GET    | `/dealer/dashboard/overview`          | Dealer dashboard summary |
| GET    | `/dealer/dashboard/recent-cart-items` | Recent cart products     |

Example:

```
{
  "success": true,
  "data": {
    "totalUniqueProducts": 8,
    "totalQuantity": 140,
    "totalCategories": 3,
    "recentItems": []
  }
}
```

All dealer APIs must get the dealer ID from the authenticated token, not accept an arbitrary dealer ID from the frontend.

For example, dealer A must not be able to change the request URL to access dealer B's cart.

# **11. Dealer Cart APIs**

Base route: `/dealer/cart`

This is one of the most important parts of RK Tiles.

Dealer selects products from the **public website**. The backend saves those selections into that dealer's personal cart.

| Method | Endpoint                        | Purpose                 |
| ------ | ------------------------------- | ----------------------- |
| GET    | `/dealer/cart`                  | Get current dealer cart |
| POST   | `/dealer/cart/items`            | Add product to cart     |
| PATCH  | `/dealer/cart/items/:productId` | Update quantity         |
| DELETE | `/dealer/cart/items/:productId` | Remove product          |
| DELETE | `/dealer/cart`                  | Clear entire cart       |

### **Add product to cart**

`POST /api/v1/dealer/cart/items`

```
{
  "productId": "product_mongodb_id",
  "quantity": 20
}
```

### **Update quantity**

`PATCH /api/v1/dealer/cart/items/:productId`

```
{
  "quantity": 35
}
```

### **Cart response**

```
{
  "success": true,
  "data": {
    "items": [
      {
        "product": {
          "_id": "product_id",
          "name": "Travertine Beige",
          "sku": "RK-TRV-001",
          "image": "image_url",
          "category": "Stone Tiles",
          "size": "600x1200"
        },
        "quantity": 35,
        "addedAt": "date"
      }
    ],
    "summary": {
      "totalUniqueProducts": 1,
      "totalQuantity": 35,
      "totalCategories": 1
    }
  }
}
```

### **Cart business rules**

- One cart per dealer for the current phase.
- Adding the same product again increases/updates its quantity.
- No duplicate cart line for the same product.
- Quantity must be greater than zero.
- Dealer can only edit their own cart.
- Inactive or unpublished products cannot be added.
- Admin can view cart activity but should not silently modify dealer carts.
- Cart does not reserve stock.
- Cart does not decrease inventory.
- Cart does not create an order.

# **12. Admin — Dealer Cart Activity APIs**

Base route: `/admin/dealer-cart-activity`

These are read-only monitoring APIs.

| Method | Endpoint                                | Purpose                         |
| ------ | --------------------------------------- | ------------------------------- |
| GET    | `/admin/dealer-cart-activity`           | List dealer carts               |
| GET    | `/admin/dealer-cart-activity/:dealerId` | View one dealer's cart activity |

### **List API filtering**

```
GET /api/v1/admin/dealer-cart-activity?search=Sharma&sort=recent&page=1&limit=20
```

Example data:

```
{
  "dealer": {
    "_id": "dealer_id",
    "businessName": "Sharma Tiles",
    "dealerId": "RKD-0001",
    "approvalStatus": "approved"
  },
  "cartSummary": {
    "totalUniqueProducts": 6,
    "totalQuantity": 85,
    "totalCategories": 3
  },
  "lastUpdated": "date"
}
```

### **Detailed cart activity**

`GET /api/v1/admin/dealer-cart-activity/:dealerId`

The admin should see:

- Dealer details
- Product image
- Product name and SKU
- Category
- Size
- Quantity
- Cart last updated
- Unique product count
- Total cart quantity
- Category summary

These are cart statistics, **not sales reports**.

# **13. Dealer Profile APIs**

Base route: `/dealer/profile`

| Method | Endpoint          | Purpose                       |
| ------ | ----------------- | ----------------------------- |
| GET    | `/dealer/profile` | Get own profile               |
| PATCH  | `/dealer/profile` | Update allowed profile fields |

### **Editable dealer profile fields**

```
{
  "ownerName": "Rahul Sharma",
  "mobile": "9876543210",
  "alternateMobile": "9123456780",
  "address": {
    "street": "Main Market",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "pincode": "226001",
    "country": "India"
  }
}
```

### **Read-only fields**

Dealer cannot modify:

- Dealer ID
- Business approval status
- Verification status
- Registration date
- GST number (unless admin explicitly allows corrections)
- Admin remarks

Profile API will return the dealer's cart activity summary too, or the frontend can call the cart and dashboard APIs separately. I'd prefer separate APIs for cleaner responsibilities.

# **14. Admin Profile APIs**

Base route: `/admin/profile`

| Method | Endpoint         | Purpose                   |
| ------ | ---------------- | ------------------------- |
| GET    | `/admin/profile` | Get current admin profile |
| PATCH  | `/admin/profile` | Update own profile        |

Admin can update name, phone, avatar, etc., but shouldn't update their own role or privilege level through this endpoint.

# **15. Website Content Management APIs**

Base route: `/admin/website-content`

For the homepage, featured collections and website configuration.

| Method | Endpoint                                     | Purpose                              |
| ------ | -------------------------------------------- | ------------------------------------ |
| GET    | `/website-content`                           | Public website content               |
| GET    | `/admin/website-content`                     | Admin gets complete content settings |
| PATCH  | `/admin/website-content`                     | Update website settings              |
| PATCH  | `/admin/website-content/sections`            | Toggle homepage sections             |
| PATCH  | `/admin/website-content/featured-products`   | Manage featured products             |
| PATCH  | `/admin/website-content/featured-categories` | Manage featured categories           |
| PATCH  | `/admin/website-content/gallery`             | Update inspiration gallery           |

Example website settings:

```
{
  "hero": {
    "title": "Designed for Beautiful Spaces",
    "subtitle": "Premium surfaces for modern interiors",
    "image": "hero_image_url"
  },
  "sections": {
    "collections": true,
    "featuredProducts": true,
    "inspirationGallery": true,
    "aboutSection": true
  },
  "featuredProducts": ["product_id_1", "product_id_2"],
  "featuredCategories": ["category_id_1", "category_id_2"]
}
```

The public website uses these APIs to determine what content is visible.

# **16. Public Website APIs**

These APIs are available without login.

| Method | Endpoint                         | Purpose                       |
| ------ | -------------------------------- | ----------------------------- |
| GET    | `/categories`                    | Website category listing      |
| GET    | `/categories/:id`                | Category details              |
| GET    | `/categories/slug/:slug`         | Category lookup               |
| GET    | `/products`                      | Product listing with filters  |
| GET    | `/products/:id`                  | Product detail                |
| GET    | `/products/slug/:slug`           | Product by slug               |
| GET    | `/products/featured`             | Featured products             |
| GET    | `/products/category/:categoryId` | Products in category          |
| GET    | `/website-content`               | Homepage settings             |
| POST   | `/enquiries`                     | Submit contact/dealer enquiry |

### **Contact/dealer enquiry API**

`POST /api/v1/enquiries`

```
{
  "name": "Amit Kumar",
  "email": "amit@example.com",
  "phone": "9876543210",
  "subject": "Dealer enquiry",
  "message": "I am interested in becoming a dealer."
}
```

Admin can view these enquiry submissions in a future admin enquiries module. If you want it in the current admin panel, we should add Enquiries as a sidebar item and its APIs too.

# **17. API route summary**

Here is the complete planned API inventory grouped by module.

## **RK Tiles API inventory**

# **6**

**Authentication**

Signup, login, session, password

# **6**

**Admin management**

Create, list, manage admins

# **6**

**Dashboard**

Overview and summaries

# **9**

**Categories**

Public read + admin management

# **11**

**Products**

Public browsing + admin CRUD

# **7**

**Inventory**

Stock and adjustment history

# **7**

**Dealers**

Approval and account control

# **2**

**Dealer dashboard**

Summary and recent cart items

# **5**

**Dealer Cart**

Add, update, remove, clear

# **2**

**Admin cart activity**

Dealer cart monitoring

# **2**

**Dealer profile**

Read/update own profile

# **2**

**Admin profile**

Read/update own profile

# **7**

**Website content**

Homepage and featured content

# **1**

**Enquiries**

Public enquiry submission

Approximately 73 planned endpoint actions including the optional admin enquiries module. Several can be combined or simplified during implementation. This is a full initial backend scope, not a requirement to implement all in one go.

# **18. Authentication & security middleware**

Your backend must not rely on the frontend to protect admin or dealer pages. Every protected API must verify the user on the backend.

**Middleware flow**

Request arrives

JWT authentication — `protect`

Account status verification

Role check — `adminOnly` / `dealerOnly`

Controller → Service → MongoDB

### **Middleware to create**

| Middleware              | Responsibility                                         |
| ----------------------- | ------------------------------------------------------ |
| `protect`               | Validate JWT and identify user                         |
| `adminOnly`             | Allow only admin role                                  |
| `dealerOnly`            | Allow only dealer role                                 |
| `requireApprovedDealer` | Dealer must be approved                                |
| `validateRequest`       | Validate incoming request data                         |
| `errorHandler`          | Centralized error handling                             |
| `notFoundHandler`       | Handle invalid routes                                  |
| `rateLimiter`           | Limit repeated requests                                |
| `uploadMiddleware`      | Handle product/category image uploads, when configured |

### **Example route protection**

```
router.post(
  "/products",
  protect,
  adminOnly,
  createProduct
);
```

Dealer cart:

```
router.post(
  "/dealer/cart/items",
  protect,
  dealerOnly,
  requireApprovedDealer,
  addToCart
);
```

Dealer profile:

```
router.patch(
  "/dealer/profile",
  protect,
  dealerOnly,
  updateOwnProfile
);
```

# **19. MongoDB collections (models)**

I would initially build these models:

| Model              | Purpose                      |
| ------------------ | ---------------------------- |
| `User`             | Admin + dealer accounts      |
| `Category`         | Tile categories              |
| `Product`          | Product catalogue            |
| `Cart`             | Dealer-specific cart         |
| `InventoryHistory` | Stock adjustment history     |
| `WebsiteSettings`  | Homepage and website content |
| `Enquiry`          | Website enquiries            |

### **User model**

Instead of creating separate Admin and Dealer collections, I recommend one `User` model with a role field.

```
{
  name: String,
  email: String,
  password: String,
  role: "admin" | "dealer",

  businessName: String,
  dealerId: String,
  ownerName: String,
  mobile: String,
  alternateMobile: String,
  gstNumber: String,
  businessType: String,

  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },

  approvalStatus: String,
  accountStatus: String,
  verificationStatus: String,

  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Use role-specific validation so admin accounts don't have dealer fields and vice versa. Passwords should be hashed with bcrypt before storing.

# **20. Project folder structure**

I recommend a feature/module-based backend structure.

```
rk-tiles-backend/
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── InventoryHistory.js
│   │   ├── WebsiteSettings.js
│   │   └── Enquiry.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.service.js
│   │   │
│   │   ├── admins/
│   │   ├── dashboard/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── dealers/
│   │   ├── dealer-dashboard/
│   │   ├── dealer-cart/
│   │   ├── dealer-profile/
│   │   ├── cart-activity/
│   │   ├── admin-profile/
│   │   ├── website-content/
│   │   └── enquiries/
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── dealer-status.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   │
│   ├── utils/
│   │   ├── ApiResponse.js
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   └── generateToken.js
│   │
│   ├── validators/
│   ├── routes/
│   │   └── index.js
│   ├── app.js
│   └── server.js
│
├── scripts/
│   └── createAdmin.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Each module should follow the same pattern where appropriate:

```
products/
├── product.routes.js
├── product.controller.js
├── product.service.js
└── product.validation.js
```

- **Routes** → URL and middleware mapping
- **Controller** → Request/response handling
- **Service** → Business logic
- **Model** → MongoDB data structure
- **Validation** → Validate request inputs

You don't need to create all files empty at the beginning. Build module by module.

# **21. Recommended packages**

```
npm install express mongoose dotenv bcryptjs jsonwebtoken cors helmet express-rate-limit cookie-parser morgan
```

For development:

```
npm install -D nodemon
```

For validation, I'd also add:

```
npm install zod
```

| Package            | Use                               |
| ------------------ | --------------------------------- |
| express            | REST API                          |
| mongoose           | MongoDB models                    |
| dotenv             | Environment variables             |
| bcryptjs           | Password hashing                  |
| jsonwebtoken       | JWT authentication                |
| cors               | Frontend/backend connection       |
| helmet             | Security headers                  |
| express-rate-limit | Request rate limiting             |
| cookie-parser      | Cookie handling, if using cookies |
| morgan             | API request logs                  |
| zod                | Request validation                |
| nodemon            | Development server                |

# **22. API response standard**

Every API should follow one consistent response format.

Success response

```
{
  "success": true,
  "message": "Product created successfully",
  "data": {}
}
```

Error response

```
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

Pagination:

```
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

HTTP status codes should also be correct: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `422`, `500`.

# **23. Authentication strategy I recommend**

For your RK Tiles frontend, I would implement:

- Password hashing using `bcryptjs`
- JWT authentication
- Role-based access control
- Admin protected routes
- Dealer protected routes
- Pending dealers cannot use protected dealer cart APIs
- Suspended accounts cannot access protected APIs
- Dealer cannot read or modify another dealer's data
- Admin-created admins only
- First admin created through a secure script
- Validation for all incoming payloads
- Rate limiting on login/signup
- Unique email and dealer ID
- MongoDB indexes for common queries
- Never return hashed password
- Never trust role, approval status, stock or user ID supplied by frontend

For production, I would prefer the JWT stored in a **secure, HttpOnly cookie** if your frontend/backend deployment setup supports it correctly. If you use Bearer tokens, plan the token storage and refresh strategy carefully rather than placing long-lived tokens in localStorage.

# **24. What we should build first**

Don't implement all 73 endpoints together. Build in this order so the frontend can gradually connect to a real backend.

### **Backend implementation roadmap**

Phase 1

**Foundation + Authentication**

Express setup, MongoDB connection, User model, JWT, admin seed, dealer signup/login, middleware

Phase 2

**Categories + Products**

Admin CRUD, public catalogue APIs, filters, product details, publish/visibility

Phase 3

**Inventory**

Stock update, low stock, stock history, validation

Phase 4

**Dealer system**

Approval, profile, dashboard, account status

Phase 5

**Dealer Cart**

Public website add-to-cart integration, own cart, quantity, remove and clear

Phase 6

**Admin Monitoring**

Dashboard, dealer cart activity, overview, dealer details

Phase 7

**Website + Remaining APIs**

Homepage content, featured products, enquiries, profiles, full integration testing

## **My recommendation for RK Tiles**

Start with **Phase 1 — Backend Foundation & Authentication**. First create the project, connect MongoDB, implement the User model, seed your first admin, and complete admin/dealer login and authorization. Then the remaining APIs will have a secure foundation.

I can next prepare your **complete Phase 1 backend specification with the exact folder files, User schema, admin seed script, JWT flow, auth middleware, and all auth API request/response examples**, ready to start coding without confusion.