/**
 * Centralized API configuration.
 * All API URLs and defaults are resolved here.
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  DEFAULT_TIMEOUT: 15000,
} as const;
