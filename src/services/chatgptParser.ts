import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import type { Conversation, Message, MessageRole, MessageContent, Artifact } from '@/types';
import { PARSING_SELECTORS } from '@/utils/constants';

/**
 * Parses a ChatGPT conversation from HTML content
 */
export class ChatGPTParser {
  /**
   * Fetches and parses a ChatGPT conversation from a shared URL
   */
  static async parseFromUrl(url: string): Promise<Conversation> {
    try {
      // First, try to detect if we're in a browser environment
      if (typeof window !== 'undefined') {
        throw new Error('Direct URL fetching is not supported due to CORS restrictions. Please use the copy-paste method or deploy to a server with proxy.');
      }

      // This will only work in server environment (Vercel functions, etc.)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      return this.parseFromHtml(html, url);
    } catch (error) {
      if (error instanceof Error && error.message.includes('CORS')) {
        throw new Error('CORS restriction: Cannot fetch ChatGPT conversations directly from browser. Please copy the HTML content or use a server deployment.');
      }
      throw new Error(`Failed to parse ChatGPT conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a demo conversation for testing purposes
   */
  static createDemoConversation(url: string): Conversation {
    const now = new Date();
    const conversationId = uuidv4();

    const demoMessages: Message[] = [
      {
        id: uuidv4(),
        role: 'user' as MessageRole,
        content: {
          text: 'Hello! Can you help me understand how React hooks work?',
          formatting: { isMarkdown: false, hasCodeBlocks: false, hasLinks: false, hasImages: false }
        },
        timestamp: new Date(now.getTime() - 10000),
        metadata: { timestamp: new Date(now.getTime() - 10000) }
      },
      {
        id: uuidv4(),
        role: 'assistant' as MessageRole,
        content: {
          text: 'Of course! React hooks are functions that let you use state and other React features in functional components. Here\'s a simple example:',
          artifacts: [
            {
              type: 'code',
              content: `import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`,
              language: 'javascript'
            }
          ],
          formatting: { isMarkdown: true, hasCodeBlocks: true, hasLinks: false, hasImages: false }
        },
        timestamp: new Date(now.getTime() - 5000),
        metadata: { timestamp: new Date(now.getTime() - 5000) }
      },
      {
        id: uuidv4(),
        role: 'user' as MessageRole,
        content: {
          text: 'That\'s helpful! Can you explain useState and useEffect in more detail?',
          formatting: { isMarkdown: false, hasCodeBlocks: false, hasLinks: false, hasImages: false }
        },
        timestamp: now,
        metadata: { timestamp: now }
      },
      {
        id: uuidv4(),
        role: 'assistant' as MessageRole,
        content: {
          text: 'Absolutely! Let me break down these two essential hooks:\n\n**useState Hook:**\n- Manages component state in functional components\n- Returns an array with current state value and setter function\n- Takes initial state as argument\n\n**useEffect Hook:**\n- Handles side effects (API calls, subscriptions, manual DOM updates)\n- Runs after render by default\n- Can be controlled with dependency array\n- Can return cleanup function\n\nBoth are fundamental for building modern React applications!',
          formatting: { isMarkdown: true, hasCodeBlocks: false, hasLinks: false, hasImages: false }
        },
        timestamp: now,
        metadata: { timestamp: now }
      }
    ];

    return {
      id: conversationId,
      title: 'Demo: Understanding React Hooks',
      platform: 'chatgpt',
      createdAt: new Date(now.getTime() - 15000),
      updatedAt: now,
      messages: demoMessages,
      metadata: {
        platform: 'chatgpt',
        extractedAt: now,
        messageCount: demoMessages.length,
        title: 'Demo: Understanding React Hooks',
        url: url,
      }
    };
  }

  /**
   * Parses a ChatGPT conversation from HTML string
   */
  static parseFromHtml(html: string, originalUrl?: string): Conversation {
    const $ = cheerio.load(html);
    const selectors = PARSING_SELECTORS.chatgpt;

    // Check if this looks like a ChatGPT conversation page
    if (!html.includes('chatgpt') && !html.includes('conversation') && !html.includes('message')) {
      throw new Error('This does not appear to be a ChatGPT conversation page. Please verify the URL or try copying the page HTML.');
    }

    // Extract title
    const title = this.extractTitle($);

    // Extract messages
    const messages = this.extractMessages($, selectors);

    if (messages.length === 0) {
      throw new Error('No messages found in the conversation. The page structure may have changed or the conversation may be private.');
    }

    // Generate conversation metadata
    const now = new Date();
    const conversationId = uuidv4();

    const conversation: Conversation = {
      id: conversationId,
      title,
      platform: 'chatgpt',
      createdAt: now,
      updatedAt: now,
      messages,
      metadata: {
        platform: 'chatgpt',
        extractedAt: now,
        messageCount: messages.length,
        title,
        url: originalUrl,
      }
    };

    return conversation;
  }

  /**
   * Extracts the conversation title from the HTML
   */
  private static extractTitle($: cheerio.Root): string {
    // Try multiple selectors for title extraction
    const titleSelectors = [
      'title',
      'h1',
      '[data-testid="conversation-title"]',
      '.conversation-title',
      'meta[property="og:title"]',
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let title = '';
        
        if (selector === 'meta[property="og:title"]') {
          title = element.attr('content') || '';
        } else {
          title = element.text().trim();
        }

        if (title && title !== 'ChatGPT') {
          // Clean up title
          title = title.replace(/^ChatGPT\s*[-|]\s*/, '').trim();
          if (title.length > 0) {
            return title;
          }
        }
      }
    }

    return 'ChatGPT Conversation';
  }

  /**
   * Extracts messages from the conversation HTML
   */
  private static extractMessages($: cheerio.Root, selectors: typeof PARSING_SELECTORS.chatgpt): Message[] {
    const messages: Message[] = [];
    
    // Find all message elements
    const messageElements = $(selectors.messages);
    
    messageElements.each((index, element) => {
      try {
        const $element = $(element);
        const role = this.extractMessageRole($element);
        const content = this.extractMessageContent($element, $);
        const timestamp = this.extractTimestamp($element);

        if (content.text.trim()) {
          const message: Message = {
            id: uuidv4(),
            role,
            content,
            timestamp,
            metadata: {
              timestamp,
            }
          };

          messages.push(message);
        }
      } catch (error) {
        console.warn(`Failed to parse message ${index}:`, error);
      }
    });

    return messages;
  }

  /**
   * Determines the role of a message element
   */
  private static extractMessageRole($element: any): MessageRole {
    const roleAttr = $element.attr('data-message-author-role');
    
    if (roleAttr === 'user') return 'user';
    if (roleAttr === 'assistant') return 'assistant';
    if (roleAttr === 'system') return 'system';

    // Fallback: check for other indicators
    if ($element.hasClass('user-message') || $element.find('.user-message').length > 0) {
      return 'user';
    }
    
    if ($element.hasClass('assistant-message') || $element.find('.assistant-message').length > 0) {
      return 'assistant';
    }

    // Default to assistant if unclear
    return 'assistant';
  }

  /**
   * Extracts the content from a message element
   */
  private static extractMessageContent($element: any, $: cheerio.Root): MessageContent {
    // Find content container
    const contentSelectors = [
      '.markdown',
      '.prose',
      '.message-content',
      '[data-message-content]',
    ];

    let contentElement = $element;
    for (const selector of contentSelectors) {
      const found = $element.find(selector);
      if (found.length > 0) {
        contentElement = found.first();
        break;
      }
    }

    // Extract text content
    const text = this.cleanTextContent(contentElement.text());

    // Check for formatting elements
    const hasCodeBlocks = contentElement.find('pre, code, .code-block').length > 0;
    const hasLinks = contentElement.find('a').length > 0;
    const hasImages = contentElement.find('img').length > 0;

    // Extract code blocks as artifacts
    const artifacts: Artifact[] = [];
    if (hasCodeBlocks) {
      contentElement.find('pre code').each((_: number, codeElement: any) => {
        const $code = $(codeElement);
        const codeContent = $code.text().trim();
        const language = this.detectCodeLanguage($code);

        if (codeContent) {
          artifacts.push({
            type: 'code' as const,
            content: codeContent,
            language,
          });
        }
      });
    }

    return {
      text,
      artifacts: artifacts.length > 0 ? artifacts : undefined,
      formatting: {
        isMarkdown: true,
        hasCodeBlocks,
        hasLinks,
        hasImages,
      }
    };
  }

  /**
   * Attempts to detect code language from class names
   */
  private static detectCodeLanguage($codeElement: any): string | undefined {
    const className = $codeElement.attr('class') || '';
    
    // Common language class patterns
    const languagePatterns = [
      /language-(\w+)/,
      /lang-(\w+)/,
      /highlight-(\w+)/,
    ];

    for (const pattern of languagePatterns) {
      const match = className.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Check parent element
    const parentClass = $codeElement.parent().attr('class') || '';
    for (const pattern of languagePatterns) {
      const match = parentClass.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extracts timestamp from message element
   */
  private static extractTimestamp($element: any): Date {
    // Try to find timestamp elements
    const timeElement = $element.find('time[datetime]').first();
    if (timeElement.length > 0) {
      const datetime = timeElement.attr('datetime');
      if (datetime) {
        const parsed = new Date(datetime);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    // Fallback to current time
    return new Date();
  }

  /**
   * Cleans up text content by removing extra whitespace and artifacts
   */
  private static cleanTextContent(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n')  // Normalize line breaks
      .trim();
  }
} 