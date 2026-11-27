import { API_CONFIG } from '@/lib/config/api';
import { ApiError } from './http-error';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  statusCode?: number;
}

/**
 * Reusable HTTP client leveraging native fetch with cookie credentials support,
 * configurable timeout, and standardized error handling.
 */
class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url.toString();
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, body, headers, timeout = API_CONFIG.DEFAULT_TIMEOUT, ...customOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    const requestHeaders: Record<string, string> = {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...customOptions,
        headers: requestHeaders,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        credentials: 'include', // Ensures HttpOnly cookies are attached and received
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let responseData: any = null;

      if (contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        responseData = await response.text().catch(() => null);
      }

      if (!response.ok) {
        throw ApiError.fromResponse(response.status, responseData);
      }

      return responseData as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error?.name === 'AbortError') {
        throw ApiError.timeoutError();
      }

      throw ApiError.networkError(error?.message || 'Unable to connect to backend server');
    }
  }

  get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient(API_CONFIG.BASE_URL);
export default httpClient;
