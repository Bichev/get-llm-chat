import React, { useState, useCallback } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { EXPORT_FORMATS } from '@/utils/constants';
import { validateChatURL } from '@/utils/validators';
import type { ExportFormat, URLValidationResult } from '@/types';

export interface ExportFormProps {
  onExport?: (url: string, format: ExportFormat) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ExportForm: React.FC<ExportFormProps> = ({
  onExport,
  isLoading = false,
  error = null,
}) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [urlValidation, setUrlValidation] = useState<URLValidationResult | null>(null);
  const [hasUrlBeenValidated, setHasUrlBeenValidated] = useState(false);

  // Format options for the select component
  const formatOptions = Object.entries(EXPORT_FORMATS).map(([key, config]) => ({
    value: key,
    label: config.name,
    description: config.description,
    icon: config.icon,
  }));

  // Handle URL input changes
  const handleUrlChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value;
    setUrl(newUrl);
    
    // Reset validation state when URL changes
    if (hasUrlBeenValidated) {
      setUrlValidation(null);
      setHasUrlBeenValidated(false);
    }
  }, [hasUrlBeenValidated]);

  // Handle URL validation on blur
  const handleUrlBlur = useCallback(() => {
    if (url.trim()) {
      const validation = validateChatURL(url.trim());
      setUrlValidation(validation);
      setHasUrlBeenValidated(true);
    }
  }, [url]);

  // Handle format selection
  const handleFormatChange = useCallback((selectedFormat: string) => {
    setFormat(selectedFormat as ExportFormat);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    
    if (!url.trim()) {
      return;
    }

    // Validate URL if not already validated
    let validation = urlValidation;
    if (!hasUrlBeenValidated) {
      validation = validateChatURL(url.trim());
      setUrlValidation(validation);
      setHasUrlBeenValidated(true);
    }

    // Only proceed if URL is valid
    if (validation?.isValid) {
      onExport?.(url.trim(), format);
    }
  }, [url, format, urlValidation, hasUrlBeenValidated, onExport]);

  // Check if form is valid for submission
  const isFormValid = urlValidation?.isValid && !isLoading;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input Section */}
        <div className="space-y-2">
          <label 
            htmlFor="chat-url" 
            className="block text-sm font-medium text-gray-700"
          >
            Shared Chat URL
          </label>
          <Input
            id="chat-url"
            name="chat-url"
            type="url"
            placeholder="https://chatgpt.com/share/..."
            value={url}
            onChange={handleUrlChange}
            onBlur={handleUrlBlur}
            error={hasUrlBeenValidated && !urlValidation?.isValid}
            errorMessage={urlValidation?.error}
            helperText={
              !hasUrlBeenValidated 
                ? "Paste a shared conversation link from ChatGPT, Claude, Gemini, or Perplexity"
                : urlValidation?.isValid
                ? `✓ Valid ${urlValidation.platform?.toUpperCase()} conversation detected`
                : undefined
            }
            disabled={isLoading}
            required
            data-testid="url-input"
            autoFocus
          />
          
          {/* URL Validation Suggestions */}
          {urlValidation?.suggestions && urlValidation.suggestions.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
              <ul className="text-sm text-gray-500 space-y-1">
                {urlValidation.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label 
            htmlFor="export-format" 
            className="block text-sm font-medium text-gray-700"
          >
            Export Format
          </label>
          <Select
            id="export-format"
            name="export-format"
            options={formatOptions}
            value={format}
            onChange={handleFormatChange}
            disabled={isLoading}
            data-testid="format-select"
          />
          
          {/* Format Description */}
          <p className="text-sm text-gray-500">
            {EXPORT_FORMATS[format].description}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error.includes('Note:') ? 'Demo Export Generated' : 'Export Failed'}
                </h3>
                <div className="mt-2 text-sm text-red-700 whitespace-pre-line">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Production-Ready API Info */}
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                🚀 Production-Ready API
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-2">
                  <strong>Ready for real ChatGPT conversations!</strong> Start local API server: 
                  <code className="mx-1 px-2 py-1 bg-green-100 rounded text-green-800">vercel dev</code>
                </p>
                <p className="text-xs">
                  ✅ CORS bypassed  ✅ Server-side parsing  ✅ Deploy to production instantly
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!isFormValid}
            data-testid="export-button"
            className="w-full sm:w-auto min-w-[200px]"
          >
            {isLoading ? 'Exporting...' : `Export as ${EXPORT_FORMATS[format].name}`}
          </Button>
        </div>
      </form>
    </div>
  );
}; 