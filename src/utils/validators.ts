import type { Platform, URLValidationResult, ExportRequest } from '@/types';
import { PLATFORMS, ERROR_MESSAGES } from './constants';

/**
 * Validates a chat URL and determines the platform
 */
export const validateChatURL = (url: string): URLValidationResult => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_URL,
    };
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_URL,
    };
  }

  // Check if it's a valid URL format
  try {
    new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_URL,
      suggestions: [
        'Make sure the URL starts with https://',
        'Check that the URL is complete and properly formatted',
      ],
    };
  }

  // Check against platform patterns
  for (const [platform, config] of Object.entries(PLATFORMS)) {
    const match = trimmedUrl.match(config.pattern);
    if (match) {
      const chatId = match[1];
      return {
        isValid: true,
        platform: platform as Platform,
        chatId,
      };
    }
  }

  // Not a recognized platform
  const supportedPlatforms = Object.values(PLATFORMS).map(p => p.name).join(', ');
  return {
    isValid: false,
    error: ERROR_MESSAGES.UNSUPPORTED_PLATFORM,
    suggestions: [
      `Supported platforms: ${supportedPlatforms}`,
      'Make sure you\'re using a shared chat link',
      'Check that the URL format matches the platform\'s sharing format',
    ],
  };
};

/**
 * Detects platform from URL
 */
export const detectPlatform = (url: string): Platform | null => {
  const validation = validateChatURL(url);
  return validation.platform || null;
};

/**
 * Extracts chat ID from URL
 */
export const extractChatId = (url: string): string | null => {
  const validation = validateChatURL(url);
  return validation.chatId || null;
};

/**
 * Validates export request data
 */
export const validateExportRequest = (request: any): { 
  success: boolean; 
  data?: ExportRequest; 
  errors?: string[] 
} => {
  const errors: string[] = [];

  // Check required fields
  if (!request.url) {
    errors.push('URL is required');
  }

  if (!request.format) {
    errors.push('Export format is required');
  }

  // Validate URL if provided
  if (request.url) {
    const urlValidation = validateChatURL(request.url);
    if (!urlValidation.isValid) {
      errors.push(urlValidation.error || 'Invalid URL');
    }
  }

  // Validate format if provided
  const validFormats = ['pdf', 'markdown', 'json', 'csv', 'text'];
  if (request.format && !validFormats.includes(request.format)) {
    errors.push(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      url: request.url,
      format: request.format,
      options: request.options || {},
    },
  };
};

/**
 * Sanitizes HTML content for safe processing
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates file size constraints
 */
export const validateFileSize = (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
  return size > 0 && size <= maxSize;
};

/**
 * Generates a safe filename from conversation title
 */
export const generateSafeFilename = (title: string, extension: string): string => {
  if (!title) {
    title = 'conversation';
  }

  // Remove unsafe characters and limit length
  const safeTitle = title
    .replace(/[<>:"/\\|?*]/g, '') // Remove unsafe characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50) // Limit length
    .toLowerCase();

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  return `${safeTitle}_${timestamp}.${extension}`;
};

/**
 * Validates rate limiting constraints
 */
export const validateRateLimit = (
  requestCount: number,
  maxRequests: number,
  windowMs: number,
  lastRequest?: Date
): { allowed: boolean; retryAfter?: number } => {
  if (requestCount < maxRequests) {
    return { allowed: true };
  }

  if (lastRequest) {
    const timeSinceLastRequest = Date.now() - lastRequest.getTime();
    if (timeSinceLastRequest >= windowMs) {
      return { allowed: true };
    }

    const retryAfter = Math.ceil((windowMs - timeSinceLastRequest) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: false };
}; 