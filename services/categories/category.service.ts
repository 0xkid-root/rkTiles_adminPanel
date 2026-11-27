import { httpClient, type ApiResponse } from '@/lib/http';
import type {
  BackendCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from './category.types';

export const categoryService = {
  /**
   * Get all categories (Public / Admin).
   */
  async getAll(params?: { search?: string }): Promise<ApiResponse<BackendCategory[]>> {
    return httpClient.get<ApiResponse<BackendCategory[]>>('/categories', { params });
  },

  /**
   * Get category by ID.
   */
  async getById(id: string): Promise<ApiResponse<BackendCategory>> {
    return httpClient.get<ApiResponse<BackendCategory>>(`/categories/${id}`);
  },

  /**
   * Create a new category.
   */
  async create(payload: CreateCategoryPayload): Promise<ApiResponse<BackendCategory>> {
    return httpClient.post<ApiResponse<BackendCategory>>('/categories', payload);
  },

  /**
   * Update category details.
   */
  async update(id: string, payload: UpdateCategoryPayload): Promise<ApiResponse<BackendCategory>> {
    return httpClient.patch<ApiResponse<BackendCategory>>(`/categories/${id}`, payload);
  },

  /**
   * Toggle active status.
   */
  async updateStatus(id: string, isActive: boolean): Promise<ApiResponse<BackendCategory>> {
    return httpClient.patch<ApiResponse<BackendCategory>>(`/categories/${id}/status`, { isActive });
  },

  /**
   * Toggle visibility on public website.
   */
  async updateVisibility(id: string, isVisible: boolean): Promise<ApiResponse<BackendCategory>> {
    return httpClient.patch<ApiResponse<BackendCategory>>(`/categories/${id}/visibility`, { isVisible });
  },

  /**
   * Reorder display order.
   */
  async reorder(orderList: { id: string; displayOrder: number }[]): Promise<ApiResponse<null>> {
    return httpClient.patch<ApiResponse<null>>('/categories/reorder', { orderList });
  },

  /**
   * Delete or archive category.
   */
  async delete(id: string): Promise<ApiResponse<any>> {
    return httpClient.delete<ApiResponse<any>>(`/categories/${id}`);
  },
};

export default categoryService;
