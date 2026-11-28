import { httpClient } from '@/lib/http';
import type {
  DashboardCartSummaryResponse,
  DashboardInventorySummaryResponse,
  DashboardLowStockResponse,
  DashboardOverviewResponse,
  DashboardRecentDealersResponse,
  DashboardRecentProductsResponse,
} from './dashboard.types';

/** Admin Dashboard base route (admin-only, read-only). */
const DASHBOARD_BASE = '/admin/dashboard';

/**
 * Admin Dashboard service. One function per endpoint.
 * Reuses the shared `httpClient` (cookie auth, standard error handling). No request body.
 */
export const dashboardService = {
  /** GET /admin/dashboard/overview — main dashboard statistics. */
  async getDashboardOverview(): Promise<DashboardOverviewResponse> {
    return httpClient.get<DashboardOverviewResponse>(`${DASHBOARD_BASE}/overview`);
  },

  /** GET /admin/dashboard/inventory-summary — inventory totals and stock health. */
  async getDashboardInventorySummary(): Promise<DashboardInventorySummaryResponse> {
    return httpClient.get<DashboardInventorySummaryResponse>(`${DASHBOARD_BASE}/inventory-summary`);
  },

  /** GET /admin/dashboard/low-stock?limit=N — products with stock > 0 at/below threshold, lowest first. */
  async getDashboardLowStock(limit = 10): Promise<DashboardLowStockResponse> {
    return httpClient.get<DashboardLowStockResponse>(`${DASHBOARD_BASE}/low-stock`, {
      params: { limit },
    });
  },

  /** GET /admin/dashboard/recent-products?limit=N — recently created products, newest first. */
  async getDashboardRecentProducts(limit = 5): Promise<DashboardRecentProductsResponse> {
    return httpClient.get<DashboardRecentProductsResponse>(`${DASHBOARD_BASE}/recent-products`, {
      params: { limit },
    });
  },

  /** GET /admin/dashboard/recent-dealers?limit=N — recently registered dealers, newest first. */
  async getDashboardRecentDealers(limit = 5): Promise<DashboardRecentDealersResponse> {
    return httpClient.get<DashboardRecentDealersResponse>(`${DASHBOARD_BASE}/recent-dealers`, {
      params: { limit },
    });
  },

  /** GET /admin/dashboard/cart-summary — aggregated dealer cart activity summary. */
  async getDashboardCartSummary(): Promise<DashboardCartSummaryResponse> {
    return httpClient.get<DashboardCartSummaryResponse>(`${DASHBOARD_BASE}/cart-summary`);
  },
};

export default dashboardService;
