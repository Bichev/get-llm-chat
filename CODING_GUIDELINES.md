# Coding Guidelines & Cursor Instructions

## 1. Project Setup & Development Environment

### 1.1 Initial Setup Commands

```bash
# Initialize project
npm create vite@latest get-llm-chat -- --template react-ts
cd get-llm-chat

# Install core dependencies
npm install @tailwindcss/forms @tailwindcss/typography
npm install cheerio jsdom date-fns
npm install @types/cheerio @types/jsdom

# Install SEO and Analytics dependencies
npm install next-seo next-sitemap
npm install @vercel/analytics @vercel/speed-insights
npm install uuid @types/uuid
npm install gtag @types/gtag

# Install development dependencies
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D husky lint-staged
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test

# Setup Git hooks
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

### 1.2 Configuration Files

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**eslint.config.js:**
```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
)
```

**.prettierrc:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 2. Code Style & Standards

### 2.1 TypeScript Standards

**Strict Type Definitions:**
```typescript
// ✅ Good: Explicit types
interface ExportOptions {
  format: 'pdf' | 'markdown' | 'json' | 'csv' | 'text';
  includeMetadata: boolean;
  includeTimestamps: boolean;
}

// ✅ Good: Generic constraints
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// ❌ Bad: Any types
function processData(data: any): any {
  return data;
}

// ✅ Good: Proper error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

**Naming Conventions:**
```typescript
// ✅ Components: PascalCase
export const ExportButton: React.FC<ExportButtonProps> = ({ ... }) => { ... };

// ✅ Hooks: camelCase starting with 'use'
export const useExportConversation = (): ExportHook => { ... };

// ✅ Constants: SCREAMING_SNAKE_CASE
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_PLATFORMS = ['chatgpt', 'claude', 'gemini', 'perplexity'] as const;

// ✅ Functions: camelCase with descriptive names
export const validateChatGPTUrl = (url: string): boolean => { ... };
export const parseConversationFromHTML = (html: string): Conversation => { ... };

// ✅ Types & Interfaces: PascalCase
interface ConversationMetadata {
  platform: Platform;
  extractedAt: Date;
  messageCount: number;
}

type Platform = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
```

### 2.2 React Component Standards

**Component Structure:**
```typescript
// ✅ Proper component structure
interface ExportButtonProps {
  url: string;
  format: ExportFormat;
  onExportStart?: () => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  url,
  format,
  onExportStart,
  onExportComplete,
  onExportError,
  disabled = false,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { exportConversation } = useExportConversation();

  const handleExport = useCallback(async (): Promise<void> => {
    if (disabled || isExporting) return;
    
    try {
      setIsExporting(true);
      onExportStart?.();
      
      const result = await exportConversation(url, format);
      onExportComplete?.(result);
    } catch (error) {
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  }, [url, format, disabled, isExporting, exportConversation, onExportStart, onExportComplete, onExportError]);

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`export-button ${className}`}
      data-testid="export-button"
    >
      {isExporting ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Exporting...</span>
        </>
      ) : (
        <span>Export as {format.toUpperCase()}</span>
      )}
    </Button>
  );
};
```

**Custom Hooks Pattern:**
```typescript
// ✅ Custom hook with proper error handling
export const useExportConversation = (): ExportHook => {
  const [state, setState] = useState<ExportState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const exportConversation = useCallback(async (
    url: string,
    format: ExportFormat
  ): Promise<ExportResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.blob();
      const downloadUrl = URL.createObjectURL(result);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `conversation.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      const exportResult: ExportResult = {
        success: true,
        format,
        downloadUrl,
        timestamp: new Date(),
      };

      setState(prev => ({ ...prev, isLoading: false, result: exportResult }));
      return exportResult;

    } catch (error) {
      const exportError = error as Error;
      setState(prev => ({ ...prev, isLoading: false, error: exportError }));
      throw exportError;
    }
  }, []);

  return {
    ...state,
    exportConversation,
  };
};
```

### 2.3 API Route Standards

**Vercel API Route Structure:**
```typescript
// api/export/index.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { validateExportRequest } from '@/lib/validation';
import { createParser } from '@/lib/parsers';
import { createGenerator } from '@/lib/generators';

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'fra1', 'sin1'],
};

export default async function handler(req: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const rateLimitResult = await rateLimit(req);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Validate request
    const body = await req.json();
    const validation = validateExportRequest(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    const { url, format } = validation.data;

    // Parse conversation
    const parser = createParser(url);
    const conversation = await parser.parse(url);

    // Generate export
    const generator = createGenerator(format);
    const exportStream = await generator.generate(conversation);

    // Return file stream
    return new NextResponse(exportStream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': getContentType(format),
        'Content-Disposition': `attachment; filename="conversation.${format}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    
    return NextResponse.json(
      { error: 'Export failed', message: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}

function getContentType(format: ExportFormat): string {
  const contentTypes = {
    pdf: 'application/pdf',
    markdown: 'text/markdown',
    json: 'application/json',
    csv: 'text/csv',
    text: 'text/plain',
  };
  
  return contentTypes[format] || 'application/octet-stream';
}
```

## 3. Testing Standards

### 3.1 Unit Testing with Vitest

**Test Structure:**
```typescript
// __tests__/services/exportService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportConversation } from '@/services/exportService';
import { mockConversation } from '@/test-utils/mocks';

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportConversation', () => {
    it('should export conversation as PDF successfully', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['pdf content'])),
      });
      vi.stubGlobal('fetch', mockFetch);

      // Act
      const result = await exportConversation('test-url', 'pdf');

      // Assert
      expect(result.success).toBe(true);
      expect(result.format).toBe('pdf');
      expect(mockFetch).toHaveBeenCalledWith('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'test-url', format: 'pdf' }),
      });
    });

    it('should handle export errors gracefully', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });
      vi.stubGlobal('fetch', mockFetch);

      // Act & Assert
      await expect(exportConversation('test-url', 'pdf'))
        .rejects
        .toThrow('Export failed: Internal Server Error');
    });
  });
});
```

**Component Testing:**
```typescript
// __tests__/components/ExportButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportButton } from '@/components/ExportButton';

// Mock the hook
vi.mock('@/hooks/useExportConversation', () => ({
  useExportConversation: () => ({
    isLoading: false,
    error: null,
    result: null,
    exportConversation: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

describe('ExportButton', () => {
  it('renders with correct format label', () => {
    render(<ExportButton url="test-url" format="pdf" />);
    
    expect(screen.getByRole('button')).toHaveTextContent('Export as PDF');
  });

  it('shows loading state during export', async () => {
    const mockExport = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ExportButton url="test-url" format="pdf" />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  it('calls onExportComplete when export succeeds', async () => {
    const onExportComplete = vi.fn();
    
    render(
      <ExportButton 
        url="test-url" 
        format="pdf" 
        onExportComplete={onExportComplete}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(onExportComplete).toHaveBeenCalled();
    });
  });
});
```

### 3.2 E2E Testing with Playwright

**Test Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**E2E Test Example:**
```typescript
// e2e/export-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Export Flow', () => {
  test('should complete full export workflow', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'LLM Chat Exporter' })).toBeVisible();
    
    // Enter URL
    const urlInput = page.getByTestId('url-input');
    await urlInput.fill('https://chatgpt.com/share/example-id');
    
    // Select format
    await page.getByTestId('format-select').selectOption('pdf');
    
    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-button').click();
    
    // Verify export starts
    await expect(page.getByText('Exporting...')).toBeVisible();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('conversation.pdf');
    
    // Verify success message
    await expect(page.getByText('Export completed successfully')).toBeVisible();
  });

  test('should handle invalid URLs gracefully', async ({ page }) => {
    await page.goto('/');
    
    const urlInput = page.getByTestId('url-input');
    await urlInput.fill('https://invalid-url.com');
    
    await page.getByTestId('export-button').click();
    
    await expect(page.getByText('Invalid URL format')).toBeVisible();
  });
});
```

## 4. File Organization & Project Structure

### 4.1 Directory Structure

```
src/
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Select/
│   │   └── LoadingSpinner/
│   ├── features/           # Feature-specific components
│   │   ├── ExportForm/
│   │   ├── URLInput/
│   │   ├── FormatSelector/
│   │   └── ResultDisplay/
│   └── layout/             # Layout components
│       ├── Header/
│       ├── Footer/
│       └── Container/
├── hooks/                  # Custom React hooks
│   ├── useExportConversation.ts
│   ├── useValidation.ts
│   └── useDownload.ts
├── services/               # API and business logic
│   ├── exportService.ts
│   ├── validationService.ts
│   └── downloadService.ts
├── types/                  # TypeScript type definitions
│   ├── conversation.ts
│   ├── export.ts
│   └── api.ts
├── utils/                  # Utility functions
│   ├── constants.ts
│   ├── formatters.ts
│   └── validators.ts
├── test-utils/             # Testing utilities
│   ├── mocks.ts
│   ├── fixtures/
│   └── test-setup.ts
└── styles/                 # Global styles
    ├── globals.css
    └── components.css

api/                        # Vercel API routes
├── export/
│   └── index.ts
├── validate/
│   └── index.ts
└── lib/                    # Server-side utilities
    ├── parsers/
    ├── generators/
    ├── middleware/
    └── utils/

e2e/                        # End-to-end tests
├── export-flow.spec.ts
├── validation.spec.ts
└── fixtures/

__tests__/                  # Unit tests (mirrors src structure)
├── components/
├── hooks/
├── services/
└── utils/
```

### 4.2 Component File Pattern

```typescript
// components/ui/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  'data-testid'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
  'data-testid': testId,
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && 'btn-disabled',
    loading && 'btn-loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      data-testid={testId}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};
```

```typescript
// components/ui/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

## 5. Performance & Optimization Guidelines

### 5.1 React Performance

```typescript
// ✅ Memoization for expensive calculations
const ExpensiveComponent: React.FC<Props> = ({ data }) => {
  const expensiveValue = useMemo(() => {
    return data.reduce((acc, item) => acc + item.value, 0);
  }, [data]);

  return <div>{expensiveValue}</div>;
};

// ✅ Callback memoization
const ParentComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  
  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return <ChildComponent onIncrement={handleIncrement} />;
};

// ✅ Component memoization
const ChildComponent = React.memo<ChildProps>(({ onIncrement }) => {
  return <button onClick={onIncrement}>Increment</button>;
});
```

### 5.2 Bundle Optimization

```typescript
// ✅ Lazy loading for routes
const ExportPage = lazy(() => import('@/pages/ExportPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));

// ✅ Dynamic imports for heavy libraries
const loadPDFLibrary = async () => {
  const { default: PDFGenerator } = await import('@/lib/pdf-generator');
  return PDFGenerator;
};

// ✅ Tree shaking friendly imports
import { validateURL } from '@/utils/validators';
// instead of
import * as validators from '@/utils/validators';
```

## 6. Git Workflow & Commit Standards

### 6.1 Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(export): add PDF generation support

- Implement PDF export using Puppeteer
- Add custom styling for PDF layout
- Include conversation metadata in export

Closes #12
```

```
fix(parser): handle empty messages in ChatGPT conversations

- Add null check for message content
- Graceful fallback for malformed HTML
- Add test coverage for edge cases

Fixes #24
```

### 6.2 Branch Naming

```
feature/export-pdf-support
bugfix/chatgpt-parser-null-handling
hotfix/rate-limiting-bypass
docs/setup-instructions
refactor/component-structure
```

## 7. Error Handling Standards

### 7.1 Error Types & Classes

```typescript
// types/errors.ts
export class ExportError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform?: string,
    public format?: string
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ParseError extends Error {
  constructor(message: string, public platform: string) {
    super(message);
    this.name = 'ParseError';
  }
}

// Error codes
export const ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  UNSUPPORTED_PLATFORM: 'UNSUPPORTED_PLATFORM',
  PARSE_FAILED: 'PARSE_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;
```

### 7.2 Error Handling Patterns

```typescript
// ✅ Result pattern for functions that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export async function parseConversation(url: string): Promise<Result<Conversation, ParseError>> {
  try {
    const parser = createParser(url);
    const conversation = await parser.parse(url);
    return { success: true, data: conversation };
  } catch (error) {
    return { 
      success: false, 
      error: new ParseError(`Failed to parse conversation: ${error.message}`, detectPlatform(url))
    };
  }
}

// ✅ Error boundaries for React components
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 8. Documentation Standards

### 8.1 Component Documentation

```typescript
/**
 * ExportButton component for triggering conversation exports
 * 
 * @example
 * ```tsx
 * <ExportButton
 *   url="https://chatgpt.com/share/example"
 *   format="pdf"
 *   onExportComplete={(result) => console.log('Export completed:', result)}
 * />
 * ```
 */
interface ExportButtonProps {
  /** The shared conversation URL to export */
  url: string;
  /** The desired export format */
  format: ExportFormat;
  /** Callback fired when export starts */
  onExportStart?: () => void;
  /** Callback fired when export completes successfully */
  onExportComplete?: (result: ExportResult) => void;
  /** Callback fired when export fails */
  onExportError?: (error: Error) => void;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}
```

### 8.2 Function Documentation

```typescript
/**
 * Validates a chat platform URL and extracts platform information
 * 
 * @param url - The URL to validate
 * @returns Validation result with platform information
 * 
 * @example
 * ```typescript
 * const result = validateChatURL('https://chatgpt.com/share/123');
 * if (result.isValid) {
 *   console.log('Platform:', result.platform);
 * }
 * ```
 */
export function validateChatURL(url: string): URLValidationResult {
  // Implementation
}
```

## 9. SEO & Analytics Implementation

### 9.1 SEO Optimization Standards

**Meta Tags and Head Management:**
```typescript
// components/SEOHead.tsx
import Head from 'next/head';
import { NextSeo } from 'next-seo';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'LLM Chat Exporter - Export AI Conversations',
  description = 'Free tool to export ChatGPT, Claude, Gemini & Perplexity conversations to PDF, Markdown, JSON, CSV formats. Privacy-first, no storage.',
  keywords = ['ChatGPT export', 'Claude export', 'AI conversation', 'PDF export'],
  ogImage = '/og-image.png',
  canonicalUrl,
}) => {
  const fullTitle = title.includes('LLM Chat Exporter') 
    ? title 
    : `${title} | LLM Chat Exporter`;

  return (
    <>
      <NextSeo
        title={fullTitle}
        description={description}
        canonical={canonicalUrl}
        openGraph={{
          title: fullTitle,
          description,
          images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
          type: 'website',
        }}
        twitter={{
          cardType: 'summary_large_image',
          handle: '@vladbichev',
        }}
        additionalMetaTags={[
          { name: 'keywords', content: keywords.join(', ') },
          { name: 'author', content: 'Vlad Bichev' },
          { name: 'robots', content: 'index, follow' },
        ]}
      />
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
    </>
  );
};
```

**Structured Data Implementation:**
```typescript
// hooks/useStructuredData.ts
export const useStructuredData = (type: 'website' | 'article' | 'tool') => {
  const generateStructuredData = useCallback(() => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'website' ? 'WebApplication' : 'SoftwareApplication',
      name: 'LLM Chat Exporter',
      description: 'Export AI conversations from ChatGPT, Claude, Gemini, and Perplexity',
      url: 'https://get-llm-chat.vercel.app',
      author: {
        '@type': 'Person',
        name: 'Vlad Bichev',
        url: 'https://vladbichev.com',
      },
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    };

    return baseData;
  }, [type]);

  return { generateStructuredData };
};
```

**Sitemap Generation:**
```typescript
// pages/sitemap.xml.ts
import { GetServerSideProps } from 'next';

const STATIC_PAGES = [
  '',
  '/about',
  '/privacy',
  '/terms',
  '/blog',
  '/how-to-export-chatgpt',
  '/claude-export-guide',
  '/ai-conversation-archiving',
];

function generateSiteMap(pages: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map(
          (page) => `
        <url>
          <loc>https://get-llm-chat.vercel.app${page}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${page === '' ? '1.0' : '0.8'}</priority>
        </url>
      `
        )
        .join('')}
    </urlset>
  `;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const sitemap = generateSiteMap(STATIC_PAGES);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  // This component will never be rendered
  return null;
}
```

### 9.2 Analytics Implementation Standards

**Google Analytics 4 Setup:**
```typescript
// lib/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Log the pageview with their URL
export const pageview = (url: string): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Log specific events happening.
export const event = (action: string, parameters: Record<string, any>): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, parameters);
  }
};

// Custom event tracking functions
export const trackExport = (platform: string, format: string): void => {
  event('export_conversation', {
    event_category: 'Export',
    event_label: `${platform}_${format}`,
    platform,
    format,
    value: 1,
  });
};

export const trackError = (error: string, context: string): void => {
  event('export_error', {
    event_category: 'Error',
    event_label: error,
    context,
    non_interaction: true,
  });
};

export const trackDownload = (filename: string, filesize: number): void => {
  event('file_download', {
    event_category: 'Download',
    event_label: filename,
    value: filesize,
  });
};
```

**Anonymous User Tracking:**
```typescript
// services/analytics.ts
import { v4 as uuidv4 } from 'uuid';

interface UserSession {
  anonymousId: string;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  exports: number;
}

class AnalyticsService {
  private session: UserSession;
  private initialized = false;

  constructor() {
    this.session = this.initializeSession();
  }

  private initializeSession(): UserSession {
    if (typeof window === 'undefined') {
      return this.createNewSession();
    }

    const anonymousId = this.getOrCreateAnonymousId();
    const sessionId = uuidv4();
    
    return {
      anonymousId,
      sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: 0,
      exports: 0,
    };
  }

  private getOrCreateAnonymousId(): string {
    const key = 'llm_exporter_uid';
    let id = localStorage.getItem(key);
    
    if (!id) {
      id = uuidv4();
      localStorage.setItem(key, id);
    }
    
    return id;
  }

  private createNewSession(): UserSession {
    return {
      anonymousId: 'server',
      sessionId: 'server',
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: 0,
      exports: 0,
    };
  }

  async trackPageView(path: string): Promise<void> {
    if (!this.initialized) {
      this.initialized = true;
      await this.sendAnalytics('session_start', {
        session_id: this.session.sessionId,
      });
    }

    this.session.pageViews += 1;
    this.session.lastActivity = new Date();

    await this.sendAnalytics('page_view', {
      page_path: path,
      session_id: this.session.sessionId,
    });
  }

  async trackExport(platform: string, format: string): Promise<void> {
    this.session.exports += 1;
    this.session.lastActivity = new Date();

    await Promise.all([
      this.sendAnalytics('export', {
        platform,
        format,
        session_id: this.session.sessionId,
        export_number: this.session.exports,
      }),
      trackExport(platform, format), // Google Analytics
    ]);
  }

  private async sendAnalytics(event: string, data: Record<string, any>): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          anonymousId: this.session.anonymousId,
          timestamp: new Date().toISOString(),
          ...data,
        }),
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  getSessionMetrics(): UserSession {
    return { ...this.session };
  }
}

export const analytics = new AnalyticsService();
```

**Analytics API Endpoint:**
```typescript
// pages/api/analytics.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';

interface AnalyticsEvent {
  event: string;
  anonymousId: string;
  timestamp: string;
  [key: string]: any;
}

// Simple in-memory storage for MVP (replace with database later)
const analyticsStore = new Map<string, any>();

function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex');
}

function getCountryFromIP(ip: string): string {
  // Implement IP geolocation logic
  return 'Unknown';
}

function sanitizeUserAgent(userAgent: string): Record<string, any> {
  // Parse and sanitize user agent
  return {
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Unknown',
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event: AnalyticsEvent = req.body;
    
    // Hash the anonymous ID for privacy
    const hashedId = hashUserId(event.anonymousId);
    
    // Enhance with server-side data
    const enrichedEvent = {
      ...event,
      anonymousId: hashedId,
      ip: hashUserId(req.socket.remoteAddress || ''),
      country: getCountryFromIP(req.socket.remoteAddress || ''),
      userAgent: sanitizeUserAgent(req.headers['user-agent'] || ''),
      referrer: req.headers.referer || null,
    };

    // Store analytics data (implement proper database storage)
    const key = `${hashedId}_${Date.now()}`;
    analyticsStore.set(key, enrichedEvent);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Analytics failed' });
  }
}
```

**Performance Monitoring:**
```typescript
// hooks/usePerformanceTracking.ts
import { useEffect } from 'react';

export const usePerformanceTracking = (): void => {
  useEffect(() => {
    // Track Core Web Vitals
    const trackWebVitals = (): void => {
      if (typeof window !== 'undefined' && 'web-vital' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log);
          getFID(console.log);
          getFCP(console.log);
          getLCP(console.log);
          getTTFB(console.log);
        });
      }
    };

    // Track page load performance
    const trackPageLoad = (): void => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        event('page_performance', {
          event_category: 'Performance',
          load_time: navigation.loadEventEnd - navigation.loadEventStart,
          dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          first_paint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        });
      }
    };

    trackWebVitals();
    window.addEventListener('load', trackPageLoad);

    return () => {
      window.removeEventListener('load', trackPageLoad);
    };
  }, []);
};
```

## 10. Cursor-Specific Instructions

### 9.1 Auto-completion Preferences

**Cursor Settings:**
```json
{
  "typescript.preferences.quoteStyle": "single",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.paths": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### 9.2 Code Generation Prompts

**For Components:**
```
Generate a React component for [component name] that:
- Uses TypeScript with strict typing
- Follows the project's naming conventions
- Includes proper error handling
- Has comprehensive prop types
- Includes data-testid attributes
- Uses Tailwind CSS classes
- Follows accessibility best practices
```

**For API Routes:**
```
Create a Vercel Edge API route for [endpoint purpose] that:
- Uses TypeScript
- Includes proper error handling
- Has rate limiting
- Validates input data
- Returns appropriate HTTP status codes
- Includes CORS headers
- Follows the project's API response format
```

**For Tests:**
```
Write comprehensive tests for [component/function] that:
- Uses Vitest and Testing Library
- Covers happy path and error cases
- Includes accessibility tests
- Mocks external dependencies
- Has descriptive test names
- Achieves high code coverage
```

### 9.3 Refactoring Guidelines

**When refactoring:**
1. Always run tests before and after changes
2. Update documentation alongside code changes
3. Maintain backward compatibility when possible
4. Use TypeScript's refactoring tools
5. Keep commits atomic and well-described

**Code review checklist:**
- [ ] TypeScript errors resolved
- [ ] Tests passing
- [ ] ESLint warnings addressed
- [ ] Performance considerations reviewed
- [ ] Accessibility requirements met
- [ ] Documentation updated
- [ ] Security implications considered

This comprehensive guide ensures consistent, high-quality code across the entire LLM Chat Exporter project while leveraging Cursor's capabilities for efficient development. 