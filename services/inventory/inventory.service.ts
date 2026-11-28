import { httpClient } from '@/lib/http';
import type {
  AdjustStockPayload,
  InventoryListResponse,
  InventoryQueryParams,
  InventorySummaryResponse,
  SetStockPayload,
  StockHistoryResponse,
  StockMutationResponse,
} from './inventory.types';

export const inventoryService = {
  /** Paginated products with stock counts and status tags. */
  async getInventory(params?: InventoryQueryParams): Promise<InventoryListResponse> {
    return httpClient.get<InventoryListResponse>('/admin/inventory', {
      params: params as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /** Aggregate counts for dashboard and inventory KPI cards. */
  async getSummary(): Promise<InventorySummaryResponse> {
    return httpClient.get<InventorySummaryResponse>('/admin/inventory/summary');
  },

  /** Products with stock above zero and at or below their threshold. */
  async getLowStock(params?: Pick<InventoryQueryParams, 'page' | 'limit'>): Promise<InventoryListResponse> {
    return httpClient.get<InventoryListResponse>('/admin/inventory/low-stock', { params });
  },

  /** Products with no remaining stock. */
  async getOutOfStock(params?: Pick<InventoryQueryParams, 'page' | 'limit'>): Promise<InventoryListResponse> {
    return httpClient.get<InventoryListResponse>('/admin/inventory/out-of-stock', { params });
  },

  /** Audit trail of stock changes for one product. */
  async getHistory(
    productId: string,
    params?: Pick<InventoryQueryParams, 'page' | 'limit'>
  ): Promise<StockHistoryResponse> {
    return httpClient.get<StockHistoryResponse>(`/admin/inventory/${productId}/history`, { params });
  },

  /** Increase or decrease stock. Stock cannot go below zero. */
  async adjustStock(productId: string, payload: AdjustStockPayload): Promise<StockMutationResponse> {
    return httpClient.patch<StockMutationResponse>(`/admin/inventory/${productId}/adjust`, payload);
  },

  /** Set stock to an exact physical count. */
  async setStock(productId: string, payload: SetStockPayload): Promise<StockMutationResponse> {
    return httpClient.patch<StockMutationResponse>(`/admin/inventory/${productId}/set`, payload);
  },
};

export default inventoryService;
