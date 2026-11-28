import { httpClient, type ApiResponse } from '@/lib/http';
import type {
  BackendProduct,
  CreateProductPayload,
  ProductQueryParams,
  UpdateProductPayload,
} from './product.types';

export const productService = {
  /**
   * Get all products with filters & pagination (Admin/Public).
   */
  async getAll(params?: ProductQueryParams): Promise<ApiResponse<BackendProduct[]>> {
    return httpClient.get<ApiResponse<BackendProduct[]>>('/products', {
      params: params as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /**
   * Get single product by ID.
   */
  async getById(id: string): Promise<ApiResponse<BackendProduct>> {
    return httpClient.get<ApiResponse<BackendProduct>>(`/products/${id}`);
  },

  /**
   * Create a new tile product (Admin only).
   */
  async create(payload: CreateProductPayload): Promise<ApiResponse<BackendProduct>> {
    return httpClient.post<ApiResponse<BackendProduct>>('/products', payload);
  },

  /**
   * Update product details (Admin only).
   */
  async update(id: string, payload: UpdateProductPayload): Promise<ApiResponse<BackendProduct>> {
    return httpClient.patch<ApiResponse<BackendProduct>>(`/products/${id}`, payload);
  },

  /**
   * Toggle product active status (Admin only).
   */
  async updateStatus(id: string, isActive: boolean): Promise<ApiResponse<{ _id: string; isActive: boolean }>> {
    return httpClient.patch<ApiResponse<{ _id: string; isActive: boolean }>>(`/products/${id}/status`, { isActive });
  },

  /**
   * Toggle product visibility on public catalogue (Admin only).
   */
  async updateVisibility(id: string, isVisible: boolean): Promise<ApiResponse<{ _id: string; isVisible: boolean }>> {
    return httpClient.patch<ApiResponse<{ _id: string; isVisible: boolean }>>(`/products/${id}/visibility`, { isVisible });
  },

  /**
   * Toggle featured product status (Admin only).
   */
  async updateFeatured(id: string, isFeatured: boolean): Promise<ApiResponse<{ _id: string; isFeatured: boolean }>> {
    return httpClient.patch<ApiResponse<{ _id: string; isFeatured: boolean }>>(`/products/${id}/featured`, { isFeatured });
  },

  /**
   * Safely delete product (soft-deactivates if in cart, hard-deletes otherwise).
   */
  async delete(id: string): Promise<ApiResponse<any>> {
    return httpClient.delete<ApiResponse<any>>(`/products/${id}`);
  },
};

export default productService;
