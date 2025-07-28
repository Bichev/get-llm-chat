import type { Conversation, ExportFormat, ExportOptions } from '@/types';
import { generateSafeFilename } from '@/utils/validators';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

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
 * PDF export generator - now generates actual PDFs
 */
export class PDFGenerator implements ExportGenerator {
  generate(conversation: Conversation, options: ExportOptions = {}): string {
    const { includeMetadata = true, includeTimestamps = true } = options;
    
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;
    
    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5; // Line height
      }
      
      yPosition += 5; // Extra spacing after text block
    };
    
    // Title
    addWrappedText(conversation.title, 18, true);
    yPosition += 10;
    
    // Metadata
    if (includeMetadata) {
      addWrappedText(`Platform: ${conversation.platform.toUpperCase()}`, 12, true);
      addWrappedText(`Extracted: ${format(conversation.metadata.extractedAt, 'PPpp')}`, 12);
      addWrappedText(`Messages: ${conversation.metadata.messageCount}`, 12);
      
      if (conversation.metadata.url) {
        addWrappedText(`Original URL: ${conversation.metadata.url}`, 12);
      }
      
      yPosition += 10;
      
      // Add a line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
    }
    
    // Messages
    for (const message of conversation.messages) {
      const roleName = message.role === 'user' ? 'You' : 'Assistant';
      let roleText = roleName;
      
      if (includeTimestamps) {
        roleText += ` - ${format(message.timestamp, 'PPp')}`;
      }
      
      // Role header
      addWrappedText(roleText, 14, true);
      
      // Message content
      addWrappedText(message.content.text, 11);
      
      // Code artifacts
      if (message.content.artifacts) {
        for (const artifact of message.content.artifacts) {
          if (artifact.type === 'code') {
            yPosition += 5;
            addWrappedText(`[Code${artifact.language ? ` - ${artifact.language}` : ''}]:`, 10, true);
            
            // Code content with monospace font
            doc.setFont('courier', 'normal');
            doc.setFontSize(9);
            const codeLines = doc.splitTextToSize(artifact.content, maxWidth);
            
            for (const line of codeLines) {
              if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
              }
              
              doc.text(line, margin, yPosition);
              yPosition += 12;
            }
            
            yPosition += 5;
          }
        }
      }
      
      // Add separator between messages
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      } else {
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
      }
    }
    
    // Return the PDF as a base64 string
    return doc.output('datauristring');
  }
  
  getContentType(): string {
    return 'application/pdf';
  }
  
  getFileExtension(): string {
    return 'pdf';
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
  let blob: Blob;
  
  // Handle PDF data URI (from jsPDF)
  if (contentType === 'application/pdf' && content.startsWith('data:application/pdf;filename=generated.pdf;base64,')) {
    // Extract base64 content from data URI
    const base64Content = content.split(',')[1];
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    blob = new Blob([bytes], { type: contentType });
  } else {
    // Handle regular text content
    blob = new Blob([content], { type: contentType });
  }
  
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