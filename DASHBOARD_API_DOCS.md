# RK Tiles — Admin Dashboard API (Phase 6)

Frontend integration for the **existing Admin Dashboard UI** (no redesign). All endpoints require **Admin Authentication**; reuse the shared API client with cookie credentials. **Read-only. No request body.** No new HTTP client / auth.

**Base URL:** `http://localhost:5000/api/v1/admin/dashboard`

Service: `services/dashboard/dashboard.service.ts` → `dashboardService`. Types: `services/dashboard/dashboard.types.ts`. UI: `components/admin/dashboard/dashboard-view.tsx`. React Query key `['dashboard', …]`; Refresh invalidates `['dashboard']`.

## Endpoints (one service function each)

| # | Method | Endpoint | Service fn | Purpose |
| - | ------ | -------- | ---------- | ------- |
| 1 | GET | `/overview`            | `getDashboardOverview()`            | Main dashboard statistics |
| 2 | GET | `/inventory-summary`   | `getDashboardInventorySummary()`    | Inventory totals and stock health |
| 3 | GET | `/low-stock?limit=10`  | `getDashboardLowStock(limit=10)`    | Low-stock products (stock>0 && ≤ threshold, lowest first; category `name`+`slug`; `limit` controls size) |
| 4 | GET | `/recent-products?limit=5` | `getDashboardRecentProducts(limit=5)` | Recently created products (`createdAt` desc; category `name`+`slug`; **no** active/visible filter) |
| 5 | GET | `/recent-dealers?limit=5`  | `getDashboardRecentDealers(limit=5)`  | Recently registered `role:'dealer'` (`createdAt` desc; not populated; default `limit` 5) |
| 6 | GET | `/cart-summary`        | `getDashboardCartSummary()`         | Aggregated dealer cart summary (not detailed monitoring) |

## Response envelope

`{ success: true, message, data }`. Errors via shared `ApiError` (backend error middleware not assumed). Empty DB → zero values + empty arrays.

### `GET /overview`
```json
{ "success": true, "message": "Admin dashboard overview fetched successfully",
  "data": {
    "products": { "total": 0, "active": 0, "lowStock": 0, "outOfStock": 0, "totalStockQuantity": 0 },
    "categories": { "total": 0 },
    "dealers": { "total": 0, "approved": 0, "pending": 0, "rejected": 0, "dealersWithCarts": 0 },
    "cartActivity": { "totalCartProducts": 0, "totalCartQuantities": 0 }
  } }
```
- `products.total` total; `active` `isActive && isVisible`; `lowStock` `stock>0 && stock<=lowStockThreshold`; `outOfStock` `stock<=0`; `totalStockQuantity` Σ stock. `categories.total` active. `dealers.*`; `dealersWithCarts` carts with ≥1 item. `cartActivity.totalCartProducts` total cart item entries; `totalCartQuantities` Σ quantities.

### `GET /inventory-summary`
`{ "totalStockQuantity": 0, "averageStockPerProduct": 0, "lowStockProducts": 0, "outOfStockProducts": 0 }`. `averageStockPerProduct` rounded; low/out rules as above. (`message`: "Dashboard inventory summary fetched successfully".)

### `GET /low-stock` · `GET /recent-products`
`data: Product[]`. Product schema (confirmed `Product.js`): `_id, name, slug, SKU, category{_id,name,slug,isActive?,isVisible?,image?}|string, description?, images[], size?, finish?, surface?, color?, price?, stockQuantity, lowStockThreshold, isFeatured?, isVisible, isActive, createdBy?, updatedBy?, createdAt?, updatedAt?`. Category (`Category.js`): `_id,name,slug,description?,image?,displayOrder,isActive,isVisible,…`. Handle missing fields. Sample values in docs are illustrative.

### `GET /recent-dealers`
`data: Dealer[]`. `_id,name,email,role:'dealer',businessName?,dealerId?,ownerName?,mobile?,alternateMobile?,gstNumber?,businessType?,address{street,city,state,pincode,country},approvalStatus('pending'|'approved'|'rejected'),accountStatus('active'|'suspended'),verificationStatus('unverified'|'pending'|'verified'|'rejected'),isActive,createdAt,updatedAt,…`. No `password`; no populated relations. Handle nulls.

### `GET /cart-summary`
`{ "dealersWithActiveCarts": 0, "totalUniqueProductsInAllCarts": 0, "totalQuantityInAllCarts": 0 }`. `totalUniqueProductsInAllCarts` counts cart item entries (not globally deduplicated product IDs). Summary only; **not** Dealer Cart Monitoring (separate phase).

## Frontend mapping (existing dashboard)

- Total Products `overview.products.total`; Active `products.active`; Categories `categories.total`; Total Stock `products.totalStockQuantity`/`inventory-summary.totalStockQuantity`; Total/Approved/Pending/Rejected Dealers `overview.dealers.*`; `dealersWithCarts`; `cartActivity`.
- Inventory panel `/inventory-summary` (+`overview`); Low Stock table `/low-stock`; Recent Products `/recent-products`; Recent Dealers `/recent-dealers`; Cart Activity `/cart-summary` (+`overview.cartActivity`, `overview.dealers.dealersWithCarts`).

## Integration rules

Admin auth + role; admin-only; read-only; preserve layout; **real backend values, remove dummy stats**; **loading** states; **error** + empty lists handled; **refresh** (`invalidateQueries(['dashboard'])`); separate service fn per endpoint; shared API client; **no Dealer Cart Monitoring in this phase**. Real per-dealer cart list lives on the separate `/admin/dealer-cart-activity` phase.

## Authentication
Existing admin cookie + shared `httpClient` `credentials:'include'`. Not logged in → auth error; non-admin → access denied. No body, no new login.
