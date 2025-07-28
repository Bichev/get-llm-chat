import React, { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { ExportForm } from '@/components/features/ExportForm';
import type { ExportFormat } from '@/types';

function App(): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = useCallback(async (url: string, format: ExportFormat) => {
    setIsExporting(true);
    setExportError(null);

    try {
      console.log('Starting export:', { url, format });
      
      // Dynamic imports
      const { ApiService } = await import('@/services/apiService');
      const { ChatGPTParser } = await import('@/services/chatgptParser');
      const { createExportGenerator, downloadFile } = await import('@/services/exportGenerators');
      const { generateSafeFilename } = await import('@/utils/validators');
      
      let conversation;
      
      try {
        // Try to parse the conversation using our API proxy
        console.log('Parsing conversation via API...');
        conversation = await ApiService.parseConversation(url);
        console.log('Parsed conversation:', conversation);
      } catch (parseError) {
        console.log('API parsing failed, using demo conversation:', parseError);
        
        // Show specific error for API not available
        if (parseError instanceof Error && parseError.message.includes('API server not available')) {
          setExportError(
            `🚀 Production-Ready API Available!\n\n` +
            `The parsing API is ready but needs to be started locally.\n\n` +
            `To test with REAL ChatGPT conversations:\n` +
            `1. Open a new terminal\n` +
            `2. Run: vercel dev\n` +
            `3. Wait for "Ready! Available at http://localhost:3000"\n` +
            `4. Keep both servers running (this one + Vercel)\n` +
            `5. Try the export again!\n\n` +
            `For now, here's a demo export:`
          );
        } else {
          setExportError(
            `Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}\n\n` +
            `Using demo export to show functionality:`
          );
        }
        
        // Use demo conversation as fallback
        conversation = ChatGPTParser.createDemoConversation(url);
      }
      
      // Generate export
      console.log('Generating export...');
      const generator = createExportGenerator(format);
      const content = generator.generate(conversation);
      
      // Create filename
      const filename = generateSafeFilename(conversation.title, generator.getFileExtension());
      
      // Trigger download
      downloadFile(content, filename, generator.getContentType());
      
      console.log('Export completed successfully');
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Export AI Conversations
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Transform your ChatGPT, Claude, Gemini, and Perplexity conversations into professional documents. 
              PDF, Markdown, JSON, CSV, and Text formats supported.
            </p>
          </div>

          {/* Export Form */}
          <div className="max-w-2xl mx-auto">
            <ExportForm
              onExport={handleExport}
              isLoading={isExporting}
              error={exportError}
            />
          </div>

          {/* Features Section */}
          <div className="mt-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Why Choose LLM Chat Exporter?
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Professional export quality with privacy-first design
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-primary-100">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Professional Quality</h3>
                <p className="mt-2 text-base text-gray-500">
                  Export conversations with proper formatting, preserved code blocks, and professional layout.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-primary-100">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Privacy First</h3>
                <p className="mt-2 text-base text-gray-500">
                  No data storage, no tracking. Your conversations are processed temporarily and never saved.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-primary-100">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Multiple Formats</h3>
                <p className="mt-2 text-base text-gray-500">
                  Choose from PDF, Markdown, JSON, CSV, or plain text to suit your specific needs.
                </p>
              </div>
            </div>
          </div>

          {/* Supported Platforms */}
          <div className="mt-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Supported Platforms
              </h2>
              <div className="mt-8 flex justify-center items-center space-x-8 text-gray-500">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🤖</span>
                  <span className="font-medium">ChatGPT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🧠</span>
                  <span className="font-medium">Claude</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✨</span>
                  <span className="font-medium">Gemini</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔍</span>
                  <span className="font-medium">Perplexity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Made with ❤️ by{' '}
              <a
                href="https://vladbichev.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-500"
              >
                Vlad Bichev
              </a>
              {' '}• Open source on{' '}
              <a
                href="https://github.com/vladbichev/get-llm-chat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-500"
              >
                GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
