import type { Platform, ExportFormat } from '@/types';

/**
 * Supported platforms and their URL patterns
 */
export const PLATFORMS: Record<Platform, { name: string; pattern: RegExp; baseUrl: string }> = {
  chatgpt: {
    name: 'ChatGPT',
    pattern: /^https:\/\/chatgpt\.com\/share\/([a-f0-9-]+)$/i,
    baseUrl: 'https://chatgpt.com',
  },
  claude: {
    name: 'Claude',
    pattern: /^https:\/\/claude\.ai\/share\/([a-f0-9-]+)$/i,
    baseUrl: 'https://claude.ai',
  },
  gemini: {
    name: 'Gemini',
    pattern: /^https:\/\/gemini\.google\.com\/share\/([a-f0-9]+)$/i,
    baseUrl: 'https://gemini.google.com',
  },
  perplexity: {
    name: 'Perplexity',
    pattern: /^https:\/\/www\.perplexity\.ai\/search\/([a-zA-Z0-9_-]+)$/i,
    baseUrl: 'https://www.perplexity.ai',
  },
};

/**
 * Export format configurations
 */
export const EXPORT_FORMATS: Record<ExportFormat, { 
  name: string; 
  description: string; 
  extension: string;
  mimeType: string;
  icon: string;
}> = {
  pdf: {
    name: 'PDF',
    description: 'Professional document format with proper formatting',
    extension: 'pdf',
    mimeType: 'application/pdf',
    icon: '📄',
  },
  markdown: {
    name: 'Markdown',
    description: 'Developer-friendly format with preserved code blocks',
    extension: 'md',
    mimeType: 'text/markdown',
    icon: '📝',
  },
  json: {
    name: 'JSON',
    description: 'Structured data format for programmatic use',
    extension: 'json',
    mimeType: 'application/json',
    icon: '🔧',
  },
  csv: {
    name: 'CSV',
    description: 'Tabular format for spreadsheet analysis',
    extension: 'csv',
    mimeType: 'text/csv',
    icon: '📊',
  },
  text: {
    name: 'Text',
    description: 'Clean, readable plain text format',
    extension: 'txt',
    mimeType: 'text/plain',
    icon: '📄',
  },
};

/**
 * Application configuration
 */
export const CONFIG = {
  // API Configuration
  API_BASE_URL: '/api',
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Rate Limiting
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  
  // File Size Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CONVERSATION_LENGTH: 1000, // messages
  
  // UI Configuration
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  
  // Export Configuration
  DEFAULT_EXPORT_OPTIONS: {
    includeMetadata: true,
    includeTimestamps: true,
    includeArtifacts: true,
    pageSize: 'A4' as const,
    fontSize: 12,
    includeHeaders: true,
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
  },
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_URL: 'Please enter a valid shared chat URL',
  UNSUPPORTED_PLATFORM: 'This platform is not yet supported',
  PARSE_FAILED: 'Failed to extract conversation content',
  EXPORT_FAILED: 'Failed to generate export file',
  RATE_LIMITED: 'Too many requests. Please wait before trying again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  VALIDATION_ERROR: 'Please check your input and try again',
  INTERNAL_ERROR: 'An unexpected error occurred',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  EXPORT_COMPLETED: 'Export completed successfully!',
  URL_VALIDATED: 'URL is valid and ready for export',
  DOWNLOAD_STARTED: 'Download started successfully',
} as const;

/**
 * Platform-specific selectors for HTML parsing
 */
export const PARSING_SELECTORS = {
  chatgpt: {
    messages: '[data-message-author-role]',
    userMessage: '[data-message-author-role="user"]',
    assistantMessage: '[data-message-author-role="assistant"]',
    messageContent: '.markdown, .prose',
    timestamp: 'time[datetime]',
    title: 'title, h1',
    codeBlock: 'pre code, .code-block',
  },
  claude: {
    messages: '[data-role]',
    userMessage: '[data-role="user"]',
    assistantMessage: '[data-role="assistant"]',
    messageContent: '.prose, .message-content',
    timestamp: 'time, .timestamp',
    title: 'title, .conversation-title',
    codeBlock: 'pre code, .code-block',
  },
  // Will be expanded for other platforms
} as const; 