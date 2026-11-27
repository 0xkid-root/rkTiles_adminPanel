import { httpClient, type ApiResponse } from '@/lib/http';
import type {
  AdminLoginResponseData,
  AdminUser,
  ChangePasswordPayload,
  LoginCredentials,
  MeResponseData,
} from './auth.types';

export const authService = {
  /**
   * Admin login with email & password.
   * On success, backend sets an HttpOnly cookie 'token'.
   */
  async adminLogin(credentials: LoginCredentials): Promise<ApiResponse<AdminLoginResponseData>> {
    return httpClient.post<ApiResponse<AdminLoginResponseData>>('/auth/admin/login', credentials);
  },

  /**
   * Retrieves current authenticated user session via cookie.
   */
  async getCurrentUser(): Promise<ApiResponse<MeResponseData>> {
    return httpClient.get<ApiResponse<MeResponseData>>('/auth/me');
  },

  /**
   * Logs out the user and clears cookie on the server.
   */
  async logout(): Promise<ApiResponse<null>> {
    return httpClient.post<ApiResponse<null>>('/auth/logout');
  },

  /**
   * Changes admin password.
   */
  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<null>> {
    return httpClient.post<ApiResponse<null>>('/auth/change-password', payload);
  },

  /**
   * Updates admin profile (name, mobile, alternateMobile).
   */
  async updateAdminProfile(payload: { name?: string; mobile?: string; alternateMobile?: string }): Promise<ApiResponse<AdminUser>> {
    return httpClient.patch<ApiResponse<AdminUser>>('/admin/profile', payload);
  },
};

export default authService;
