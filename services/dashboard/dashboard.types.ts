/**
 * RK Tiles — Admin Dashboard API types (Phase 6).
 * Base: /api/v1/admin/dashboard · Admin auth · read-only.
 */
import type { BackendProduct } from '@/services/products';
import type { Dealer } from '@/services/dealers';

/** GET /overview */
export interface DashboardOverview {
  products: {
    /** Total products in database. */
    total: number;
    /** isActive === true AND isVisible === true. */
    active: number;
    /** stockQuantity > 0 && stockQuantity <= lowStockThreshold. */
    lowStock: number;
    /** stockQuantity <= 0. */
    outOfStock: number;
    /** Sum of stockQuantity across all products. */
    totalStockQuantity: number;
  };
  categories: {
    /** Active categories. */
    total: number;
  };
  dealers: {
    /** Total dealer accounts. */
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    /** Dealers whose carts contain at least one item. */
    dealersWithCarts: number;
  };
  cartActivity: {
    /** Total cart item entries across all dealer carts. */
    totalCartProducts: number;
    /** Sum of quantities of all cart items. */
    totalCartQuantities: number;
  };
}

/** GET /inventory-summary */
export interface DashboardInventorySummary {
  /** Total units available across all products. */
  totalStockQuantity: number;
  /** Rounded average stock per product. */
  averageStockPerProduct: number;
  /** stockQuantity > 0 && stockQuantity <= lowStockThreshold. */
  lowStockProducts: number;
  /** stockQuantity <= 0. */
  outOfStockProducts: number;
}

/** GET /cart-summary */
export interface DashboardCartSummary {
  /** Number of carts containing items. */
  dealersWithActiveCarts: number;
  /**
   * Backend field name; currently counts cart item entries,
   * not globally deduplicated product IDs.
   */
  totalUniqueProductsInAllCarts: number;
  /** Total combined quantities across all carts. */
  totalQuantityInAllCarts: number;
}

/** Product returned by /low-stock and /recent-products (Product schema, category populated). */
export type DashboardProduct = BackendProduct;

/** Dealer returned by /recent-dealers (role 'dealer', newest first, not populated). */
export type DashboardRecentDealer = Dealer;

/** Standard success envelope. */
export interface DashboardApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type DashboardOverviewResponse = DashboardApiResponse<DashboardOverview>;
export type DashboardInventorySummaryResponse = DashboardApiResponse<DashboardInventorySummary>;
export type DashboardLowStockResponse = DashboardApiResponse<DashboardProduct[]>;
export type DashboardRecentProductsResponse = DashboardApiResponse<DashboardProduct[]>;
export type DashboardRecentDealersResponse = DashboardApiResponse<DashboardRecentDealer[]>;
export type DashboardCartSummaryResponse = DashboardApiResponse<DashboardCartSummary>;
