import type { Platform } from './conversation';
import type { ExportFormat } from './export';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * URL validation result
 */
export interface URLValidationResult {
  isValid: boolean;
  platform?: Platform;
  chatId?: string;
  error?: string;
  suggestions?: string[];
}

/**
 * Error types for better error handling
 */
export type ErrorType = 
  | 'INVALID_URL'
  | 'UNSUPPORTED_PLATFORM'
  | 'PARSE_FAILED'
  | 'EXPORT_FAILED'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

/**
 * Custom error class for export operations
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public code: ErrorType,
    public platform?: Platform,
    public format?: ExportFormat,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

/**
 * Validation error for form inputs
 */
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Parse error for HTML processing
 */
export class ParseError extends Error {
  constructor(message: string, public platform: Platform) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Request/response logging interface
 */
export interface RequestLog {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  platform?: Platform;
  format?: ExportFormat;
  success: boolean;
  error?: string;
  processingTime?: number;
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
} 