import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer';

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

  let html = '';

  try {
    console.log('Fetching conversation from:', url);

    // Validate ChatGPT URL
    if (!url.includes('chatgpt.com') && !url.includes('chat.openai.com')) {
      return res.status(400).json({ 
        error: 'Invalid URL. Please provide a ChatGPT conversation URL.' 
      });
    }

    // Use Puppeteer for ChatGPT URLs to handle JavaScript rendering
    html = await fetchWithPuppeteer(url);
    console.log('HTML fetched with Puppeteer, length:', html.length);

    // Parse the conversation
    const conversation = parseConversationFromHtml(html, url);
    
    console.log('Conversation parsed successfully:', {
      title: conversation.title,
      messageCount: conversation.messages.length
    });

    return res.status(200).json({ success: true, conversation });

  } catch (error) {
    console.error('Error parsing conversation:', error);
    
    // Check if this looks like a JavaScript-rendered page
    if (error instanceof Error && error.message.includes('No messages found')) {
      return res.status(400).json({ 
        error: 'Failed to extract conversation content. The page may be private, require authentication, or have a changed structure.',
        suggestion: 'Please ensure the ChatGPT conversation is publicly shared and accessible.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    return res.status(500).json({ 
      error: `Failed to parse conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

/**
 * Fetches a ChatGPT page using Puppeteer to handle JavaScript rendering
 */
async function fetchWithPuppeteer(url: string): Promise<string> {
  let browser;
  try {
    console.log('Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to URL:', url);
    
    // Navigate to the page and wait for network to be idle
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for conversation content to load
    console.log('Waiting for conversation content to load...');
    
    // Try to wait for message elements to appear
    try {
      await page.waitForSelector('article[data-testid*="conversation-turn"], [data-message-author-role], .group.w-full', {
        timeout: 15000
      });
      console.log('Found conversation elements');
      
      // Wait for the page to be fully loaded and stabilized
      let previousMessageCount = 0;
      let stableCount = 0;
      const maxWaitTime = 20000; // 20 seconds max wait
      const checkInterval = 2000; // Check every 2 seconds
      
      for (let i = 0; i < maxWaitTime / checkInterval; i++) {
        // Count current messages
        const currentMessages = await page.$$eval('article[data-testid*="conversation-turn"]', elements => elements.length);
        console.log(`Message count check ${i + 1}: ${currentMessages} messages`);
        
        if (currentMessages === previousMessageCount) {
          stableCount++;
          if (stableCount >= 2) { // If count is stable for 2 consecutive checks
            console.log('Message count stabilized, continuing...');
            break;
          }
        } else {
          stableCount = 0; // Reset stability counter
          previousMessageCount = currentMessages;
        }
        
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
      
    } catch (selectorError) {
      console.log('No conversation elements found immediately, continuing...');
    }

    // Additional wait to ensure dynamic content loads
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll to bottom to ensure all messages are loaded (some sites lazy load)
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait a bit more after scrolling
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Look for and click any "show more", "expand", or similar buttons
    console.log('Looking for expandable content...');
    try {
      // Common selectors for expand/show more buttons in ChatGPT
      const expandSelectors = [
        'button[aria-expanded="false"]',
        'button:contains("Show more")',
        'button:contains("...")',
        '[data-testid*="expand"]',
        '.cursor-pointer:contains("...")',
        'button.text-xs:contains("...")'
      ];

      for (const selector of expandSelectors) {
        try {
          const buttons = await page.$$(selector);
          if (buttons.length > 0) {
            console.log(`Found ${buttons.length} potential expand buttons with selector: ${selector}`);
            
            // Click all expand buttons
            for (let i = 0; i < buttons.length; i++) {
              try {
                await buttons[i].click();
                console.log(`Clicked expand button ${i + 1}`);
                // Wait for content to expand
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (clickError) {
                console.log(`Failed to click expand button ${i + 1}:`, clickError);
              }
            }
          }
        } catch (selectorError) {
          // Selector not found, continue
        }
      }

      // Also try clicking on any text that looks like "..." which might expand content
      await page.evaluate(() => {
        // Find elements containing "..." text that might be clickable
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (el.textContent && el.textContent.trim() === '...' && el.tagName !== 'SCRIPT') {
            try {
              (el as HTMLElement).click();
            } catch (e) {
              // Ignore click errors
            }
          }
        });
      });

      // Wait for any expansions to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (expandError) {
      console.log('Error while looking for expandable content:', expandError);
    }

    // Final scroll to ensure everything is visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the HTML content
    const html = await page.content();
    console.log('Page content extracted, length:', html.length);

    // Save HTML for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      try {
        const fs = require('fs');
        const path = require('path');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `debug-chatgpt-${timestamp}.html`;
        const filepath = path.join(process.cwd(), filename);
        fs.writeFileSync(filepath, html);
        console.log(`Debug HTML saved to: ${filepath}`);
      } catch (saveError) {
        console.log('Failed to save debug HTML:', saveError);
      }
    }

    return html;

  } catch (error) {
    console.error('Puppeteer error:', error);
    throw new Error(`Failed to fetch page with Puppeteer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
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
  
  // Look for conversation structure - updated selectors based on actual ChatGPT HTML
  const messageSelectors = [
    'article[data-testid*="conversation-turn"]', // Primary selector for ChatGPT messages
    '[data-message-author-role]',  // Fallback selector for messages with role
    'div[data-testid*="conversation-turn"]', // Alternative test ID based
    '.group.w-full',  // ChatGPT message containers (older structure)
    '.group .flex.flex-col', // Message content containers (older structure)
  ];

  let messageElements: any = $('');
  
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
      
      // For ChatGPT's article-based structure, look for the actual message div inside
      let $messageDiv = $element.find('[data-message-author-role]');
      if ($messageDiv.length === 0) {
        // If we already selected the message div directly
        $messageDiv = $element;
      }
      
      // Determine role
      const role = extractMessageRole($messageDiv);
      
      // Extract content
      const content = extractMessageContent($messageDiv, $);
      
      if (content.text.trim() && content.text.length > 5 && content.text.length < 10000) {
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

function extractMessageRole($element: any): 'user' | 'assistant' | 'system' {
  const roleAttr = $element.attr('data-message-author-role');
  
  if (roleAttr === 'user') return 'user';
  if (roleAttr === 'assistant') return 'assistant';
  if (roleAttr === 'system') return 'system';

  // Fallback logic - look for role in parent or child elements
  const $parent = $element.parent();
  const parentRole = $parent.attr('data-message-author-role');
  if (parentRole === 'user') return 'user';
  if (parentRole === 'assistant') return 'assistant';
  
  const $child = $element.find('[data-message-author-role]').first();
  const childRole = $child.attr('data-message-author-role');
  if (childRole === 'user') return 'user';
  if (childRole === 'assistant') return 'assistant';
  
  // Final fallback based on content length (simple heuristic)
  const elementText = $element.text().toLowerCase();
  if (elementText.length < 200 && !elementText.includes('code')) {
    return 'user';
  }
  
  return 'assistant';
}

function extractMessageContent($element: any, $: cheerio.Root) {
  // Look for the actual content in ChatGPT's structure
  const contentSelectors = [
    '.whitespace-pre-wrap',  // Primary content selector for ChatGPT
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

  // Get the text content
  let text = contentElement.text().trim();
  
  // Skip if this looks like JavaScript or system content
  if (text.includes('window.__') || 
      text.includes('requestAnimationFrame') || 
      text.includes('__oai_') ||
      text.includes('ChatGPTLog inSign up') ||
      text.includes('You said:') ||
      text.includes('ChatGPT said:') ||
      text.length > 5000) {
    return {
      text: '',
      formatting: {
        isMarkdown: false,
        hasCodeBlocks: false,
        hasLinks: false,
        hasImages: false,
      }
    };
  }
  
  // Clean up the text
  text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  
  // Check for code blocks
  const hasCodeBlocks = contentElement.find('code, pre').length > 0;
  const hasLinks = contentElement.find('a').length > 0;
  const hasImages = contentElement.find('img').length > 0;
  
  // Extract code artifacts
  const artifacts: Array<{
    type: 'code' | 'image' | 'link';
    content: string;
    language?: string;
  }> = [];
  
  if (hasCodeBlocks) {
    contentElement.find('code').each((_, codeElement) => {
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