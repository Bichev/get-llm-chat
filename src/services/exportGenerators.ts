import type { Conversation, ExportFormat, ExportOptions } from '@/types';
import { generateSafeFilename } from '@/utils/validators';
import { format } from 'date-fns';

/**
 * Base interface for export generators
 */
export interface ExportGenerator {
  generate(conversation: Conversation, options?: ExportOptions): string;
  getContentType(): string;
  getFileExtension(): string;
}

/**
 * Markdown export generator
 */
export class MarkdownGenerator implements ExportGenerator {
  generate(conversation: Conversation, options: ExportOptions = {}): string {
    const { includeMetadata = true, includeTimestamps = true } = options;
    
    let output = '';
    
    // Title and metadata
    output += `# ${conversation.title}\n\n`;
    
    if (includeMetadata) {
      output += `**Platform:** ${conversation.platform.toUpperCase()}\n`;
      output += `**Extracted:** ${format(conversation.metadata.extractedAt, 'PPpp')}\n`;
      output += `**Messages:** ${conversation.metadata.messageCount}\n\n`;
      
      if (conversation.metadata.url) {
        output += `**Original URL:** ${conversation.metadata.url}\n\n`;
      }
      
      output += '---\n\n';
    }
    
    // Messages
    for (const message of conversation.messages) {
      // Message header
      const role = message.role === 'user' ? '**You**' : '**Assistant**';
      output += `## ${role}`;
      
      if (includeTimestamps) {
        output += ` - ${format(message.timestamp, 'PPp')}`;
      }
      
      output += '\n\n';
      
      // Message content
      output += message.content.text + '\n\n';
      
      // Code artifacts
      if (message.content.artifacts) {
        for (const artifact of message.content.artifacts) {
          if (artifact.type === 'code') {
            output += '```' + (artifact.language || '') + '\n';
            output += artifact.content + '\n';
            output += '```\n\n';
          }
        }
      }
      
      output += '---\n\n';
    }
    
    return output;
  }
  
  getContentType(): string {
    return 'text/markdown';
  }
  
  getFileExtension(): string {
    return 'md';
  }
}

/**
 * JSON export generator
 */
export class JSONGenerator implements ExportGenerator {
  generate(conversation: Conversation, options: ExportOptions = {}): string {
    const { includeMetadata = true } = options;
    
    const data = {
      ...conversation,
      metadata: includeMetadata ? conversation.metadata : undefined,
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  getContentType(): string {
    return 'application/json';
  }
  
  getFileExtension(): string {
    return 'json';
  }
}

/**
 * CSV export generator
 */
export class CSVGenerator implements ExportGenerator {
  generate(conversation: Conversation, options: ExportOptions = {}): string {
    const { includeTimestamps = true } = options;
    
    let output = '';
    
    // Header
    const headers = ['Role', 'Content'];
    if (includeTimestamps) {
      headers.push('Timestamp');
    }
    output += headers.join(',') + '\n';
    
    // Messages
    for (const message of conversation.messages) {
      const row = [
        this.escapeCSV(message.role),
        this.escapeCSV(message.content.text),
      ];
      
      if (includeTimestamps) {
        row.push(this.escapeCSV(format(message.timestamp, 'yyyy-MM-dd HH:mm:ss')));
      }
      
      output += row.join(',') + '\n';
    }
    
    return output;
  }
  
  private escapeCSV(text: string): string {
    // Escape CSV special characters
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }
  
  getContentType(): string {
    return 'text/csv';
  }
  
  getFileExtension(): string {
    return 'csv';
  }
}

/**
 * Plain text export generator
 */
export class TextGenerator implements ExportGenerator {
  generate(conversation: Conversation, options: ExportOptions = {}): string {
    const { includeMetadata = true, includeTimestamps = true } = options;
    
    let output = '';
    
    // Title and metadata
    output += `${conversation.title}\n`;
    output += '='.repeat(conversation.title.length) + '\n\n';
    
    if (includeMetadata) {
      output += `Platform: ${conversation.platform.toUpperCase()}\n`;
      output += `Extracted: ${format(conversation.metadata.extractedAt, 'PPpp')}\n`;
      output += `Messages: ${conversation.metadata.messageCount}\n\n`;
      
      if (conversation.metadata.url) {
        output += `Original URL: ${conversation.metadata.url}\n\n`;
      }
    }
    
    // Messages
    for (const message of conversation.messages) {
      const role = message.role === 'user' ? 'You' : 'Assistant';
      output += `${role}`;
      
      if (includeTimestamps) {
        output += ` (${format(message.timestamp, 'PPp')})`;
      }
      
      output += ':\n';
      output += message.content.text + '\n\n';
      
      // Code artifacts
      if (message.content.artifacts) {
        for (const artifact of message.content.artifacts) {
          if (artifact.type === 'code') {
            output += `[Code${artifact.language ? ` - ${artifact.language}` : ''}]:\n`;
            output += artifact.content + '\n\n';
          }
        }
      }
      
      output += '-'.repeat(50) + '\n\n';
    }
    
    return output;
  }
  
  getContentType(): string {
    return 'text/plain';
  }
  
  getFileExtension(): string {
    return 'txt';
  }
}

/**
 * PDF export generator (placeholder - will be implemented with proper PDF library)
 */
export class PDFGenerator implements ExportGenerator {
  generate(conversation: Conversation, options: ExportOptions = {}): string {
    // For now, return HTML that can be converted to PDF
    const { includeMetadata = true, includeTimestamps = true } = options;
    
    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${conversation.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .metadata { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
        .user { background: #eff6ff; border-left: 4px solid #3b82f6; }
        .assistant { background: #f0f9ff; border-left: 4px solid #10b981; }
        .role { font-weight: 600; margin-bottom: 8px; }
        .timestamp { color: #6b7280; font-size: 0.875rem; }
        .content { line-height: 1.6; }
        pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; }
        code { font-family: 'SF Mono', Monaco, monospace; }
    </style>
</head>
<body>
    <h1>${conversation.title}</h1>
`;
    
    if (includeMetadata) {
      html += `
    <div class="metadata">
        <strong>Platform:</strong> ${conversation.platform.toUpperCase()}<br>
        <strong>Extracted:</strong> ${format(conversation.metadata.extractedAt, 'PPpp')}<br>
        <strong>Messages:</strong> ${conversation.metadata.messageCount}
        ${conversation.metadata.url ? `<br><strong>Original URL:</strong> ${conversation.metadata.url}` : ''}
    </div>
`;
    }
    
    for (const message of conversation.messages) {
      const roleClass = message.role === 'user' ? 'user' : 'assistant';
      const roleName = message.role === 'user' ? 'You' : 'Assistant';
      
      html += `
    <div class="message ${roleClass}">
        <div class="role">
            ${roleName}
            ${includeTimestamps ? `<span class="timestamp">${format(message.timestamp, 'PPp')}</span>` : ''}
        </div>
        <div class="content">${this.formatContentForHTML(message.content.text)}</div>
`;
      
      // Add code artifacts
      if (message.content.artifacts) {
        for (const artifact of message.content.artifacts) {
          if (artifact.type === 'code') {
            html += `
        <pre><code>${this.escapeHTML(artifact.content)}</code></pre>
`;
          }
        }
      }
      
      html += '    </div>\n';
    }
    
    html += '</body></html>';
    return html;
  }
  
  private formatContentForHTML(text: string): string {
    return this.escapeHTML(text).replace(/\n/g, '<br>');
  }
  
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  getContentType(): string {
    return 'text/html'; // Will be 'application/pdf' when proper PDF generation is implemented
  }
  
  getFileExtension(): string {
    return 'html'; // Will be 'pdf' when proper PDF generation is implemented
  }
}

/**
 * Factory function to create export generators
 */
export function createExportGenerator(format: ExportFormat): ExportGenerator {
  switch (format) {
    case 'markdown':
      return new MarkdownGenerator();
    case 'json':
      return new JSONGenerator();
    case 'csv':
      return new CSVGenerator();
    case 'text':
      return new TextGenerator();
    case 'pdf':
      return new PDFGenerator();
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Utility function to trigger file download
 */
export function downloadFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the blob URL
  URL.revokeObjectURL(url);
} 