export interface InventoryCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  SKU: string;
  category: InventoryCategory | string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  price?: number;
  size?: string;
  updatedAt?: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface InventoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InventoryListResponse {
  success: boolean;
  message?: string;
  data: InventoryItem[];
  pagination?: InventoryPagination;
}

export interface InventorySummaryResponse {
  success: boolean;
  message?: string;
  data: InventorySummary;
}

export type StockAdjustmentType = 'increase' | 'decrease' | 'set';

export interface StockHistoryActor {
  _id: string;
  name: string;
  email: string;
}

export interface StockHistoryRecord {
  _id: string;
  product: string;
  adjustmentType: StockAdjustmentType;
  previousQuantity: number;
  adjustmentQuantity: number;
  newQuantity: number;
  reason: string;
  adjustedBy: StockHistoryActor | string;
  createdAt: string;
}

export interface StockHistoryResponse {
  success: boolean;
  message?: string;
  data: StockHistoryRecord[];
  pagination?: InventoryPagination;
}

export interface AdjustStockPayload {
  adjustmentType: 'increase' | 'decrease';
  quantity: number;
  reason: string;
}

export interface SetStockPayload {
  quantity: number;
  reason: string;
}

export interface StockMutationResult {
  product: {
    _id: string;
    name: string;
    SKU: string;
    stockQuantity: number;
  };
  historyRecord: StockHistoryRecord;
}

export interface StockMutationResponse {
  success: boolean;
  message?: string;
  data: StockMutationResult;
}

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'low_stock' | 'out_of_stock';
}
