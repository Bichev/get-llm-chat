/**
 * Supported export formats
 */
export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'csv' | 'text';

/**
 * Export configuration options
 */
export interface ExportOptions {
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  includeArtifacts?: boolean;
  customTemplate?: string;
  pageSize?: 'A4' | 'Letter';
  fontSize?: number;
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * Export request payload
 */
export interface ExportRequest {
  url: string;
  format: ExportFormat;
  options?: ExportOptions;
}

/**
 * Export processing result
 */
export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  downloadUrl?: string;
  filename?: string;
  timestamp: Date;
  error?: string;
  metadata?: {
    fileSize?: number;
    processingTime?: number;
    messageCount?: number;
  };
}

/**
 * Export state for UI components
 */
export interface ExportState {
  isLoading: boolean;
  error: Error | null;
  result: ExportResult | null;
  progress?: number;
}

/**
 * Export hook return type
 */
export interface ExportHook extends ExportState {
  exportConversation: (url: string, format: ExportFormat, options?: ExportOptions) => Promise<ExportResult>;
  resetState: () => void;
}

/**
 * File generator interface
 */
export interface FileGenerator {
  generate: (conversation: any, options?: ExportOptions) => Promise<Buffer | string>;
  getContentType: () => string;
  getFileExtension: () => string;
} 