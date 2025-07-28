import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: {
    text: string;
    artifacts?: Array<{
      type: 'code' | 'image' | 'link';
      content: string;
      language?: string;
    }>;
    formatting: {
      isMarkdown: boolean;
      hasCodeBlocks: boolean;
      hasLinks: boolean;
      hasImages: boolean;
    };
  };
  timestamp: string;
  metadata: {
    timestamp: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  platform: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  metadata: {
    platform: string;
    extractedAt: string;
    messageCount: number;
    title: string;
    url?: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log('Fetching conversation from:', url);

    // Validate ChatGPT URL
    if (!url.includes('chatgpt.com') && !url.includes('chat.openai.com')) {
      return res.status(400).json({ 
        error: 'Invalid URL. Please provide a ChatGPT conversation URL.' 
      });
    }

    // Fetch the HTML content with proper headers
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
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('HTML fetched, length:', html.length);

    // Parse the conversation
    const conversation = parseConversationFromHtml(html, url);
    
    console.log('Conversation parsed successfully:', {
      title: conversation.title,
      messageCount: conversation.messages.length
    });

    return res.status(200).json({ success: true, conversation });

  } catch (error) {
    console.error('Error parsing conversation:', error);
    
    return res.status(500).json({ 
      error: `Failed to parse conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

function parseConversationFromHtml(html: string, originalUrl: string): Conversation {
  const $ = cheerio.load(html);
  
  // Extract title
  const title = extractTitle($);
  
  // Extract messages
  const messages = extractMessages($);
  
  if (messages.length === 0) {
    throw new Error('No messages found in the conversation. The page may be private or the structure has changed.');
  }
  
  const now = new Date().toISOString();
  const conversationId = uuidv4();
  
  return {
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
}

function extractTitle($: cheerio.Root): string {
  // Try multiple selectors for title
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
        title = title.replace(/^ChatGPT\s*[-|]\s*/, '').trim();
        if (title.length > 0) {
          return title;
        }
      }
    }
  }

  return 'ChatGPT Conversation';
}

function extractMessages($: cheerio.Root): Message[] {
  const messages: Message[] = [];
  
  // Look for conversation structure - try multiple selectors
  const messageSelectors = [
    '[data-message-author-role]',
    '.conversation-turn',
    '[role="presentation"]',
    '.group',
  ];

  let messageElements: cheerio.Cheerio<any> = $();
  
  for (const selector of messageSelectors) {
    messageElements = $(selector);
    if (messageElements.length > 0) {
      console.log(`Found ${messageElements.length} messages with selector: ${selector}`);
      break;
    }
  }

  messageElements.each((index, element) => {
    try {
      const $element = $(element);
      
      // Determine role
      const role = extractMessageRole($element);
      
      // Extract content
      const content = extractMessageContent($element, $);
      
      if (content.text.trim()) {
        const timestamp = new Date().toISOString();
        
        messages.push({
          id: uuidv4(),
          role,
          content,
          timestamp,
          metadata: { timestamp }
        });
      }
    } catch (error) {
      console.warn(`Failed to parse message ${index}:`, error);
    }
  });

  return messages;
}

function extractMessageRole($element: cheerio.Cheerio<any>): 'user' | 'assistant' | 'system' {
  const roleAttr = $element.attr('data-message-author-role');
  
  if (roleAttr === 'user') return 'user';
  if (roleAttr === 'assistant') return 'assistant';
  if (roleAttr === 'system') return 'system';

  // Fallback logic
  const elementText = $element.text().toLowerCase();
  const elementHtml = $element.html()?.toLowerCase() || '';
  
  if (elementText.length < 50 && !elementHtml.includes('code')) {
    return 'user';
  }
  
  return 'assistant';
}

function extractMessageContent($element: cheerio.Cheerio<any>, $: cheerio.Root) {
  // Get the text content
  let text = $element.text().trim();
  
  // Clean up the text
  text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  
  // Check for code blocks
  const hasCodeBlocks = $element.find('code, pre').length > 0;
  const hasLinks = $element.find('a').length > 0;
  const hasImages = $element.find('img').length > 0;
  
  // Extract code artifacts
  const artifacts: Array<{
    type: 'code' | 'image' | 'link';
    content: string;
    language?: string;
  }> = [];
  
  if (hasCodeBlocks) {
    $element.find('code').each((_, codeElement) => {
      const $code = $(codeElement);
      const codeContent = $code.text().trim();
      
      if (codeContent && codeContent.length > 10) {
        // Detect language from class or content
        const className = $code.attr('class') || '';
        const language = className.match(/language-(\w+)/)?.[1] || 
                        className.match(/lang-(\w+)/)?.[1] ||
                        detectLanguageFromContent(codeContent);
        
        artifacts.push({
          type: 'code',
          content: codeContent,
          language
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

function detectLanguageFromContent(content: string): string | undefined {
  // Simple language detection based on content patterns
  if (content.includes('import ') && content.includes('from ')) return 'javascript';
  if (content.includes('def ') && content.includes(':')) return 'python';
  if (content.includes('function ') && content.includes('{')) return 'javascript';
  if (content.includes('class ') && content.includes('{')) return 'java';
  if (content.includes('<?php')) return 'php';
  if (content.includes('#include')) return 'cpp';
  if (content.includes('SELECT ') || content.includes('FROM ')) return 'sql';
  
  return undefined;
} 