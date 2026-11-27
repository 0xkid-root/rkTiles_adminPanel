/**
 * Unified API Error representation across the application.
 */
export class ApiError extends Error {
  public status: number;
  public data: any;
  public isNetworkError: boolean;
  public isTimeout: boolean;

  constructor(message: string, status = 500, data: any = null, isNetworkError = false, isTimeout = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;

    // Restore prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(status: number, data: any): ApiError {
    const message = data?.message || (typeof data === 'string' ? data : `Request failed with status ${status}`);
    return new ApiError(message, status, data);
  }

  static networkError(message = 'Network error or backend server unavailable. Please check your connection.'): ApiError {
    return new ApiError(message, 0, null, true, false);
  }

  static timeoutError(message = 'Request timed out. Please try again.'): ApiError {
    return new ApiError(message, 408, null, false, true);
  }
}
