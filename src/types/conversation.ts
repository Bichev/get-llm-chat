/**
 * Supported LLM platforms
 */
export type Platform = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';

/**
 * Message roles in a conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Content artifacts found in messages
 */
export interface Artifact {
  type: 'code' | 'image' | 'file' | 'link';
  content: string;
  language?: string;
  filename?: string;
  metadata?: Record<string, any>;
}

/**
 * Formatting information for message content
 */
export interface FormattingInfo {
  isMarkdown?: boolean;
  hasCodeBlocks?: boolean;
  hasImages?: boolean;
  hasLinks?: boolean;
}

/**
 * Message content with rich formatting
 */
export interface MessageContent {
  text: string;
  artifacts?: Artifact[];
  formatting?: FormattingInfo;
}

/**
 * Additional metadata for messages
 */
export interface MessageMetadata {
  timestamp?: Date;
  tokens?: number;
  model?: string;
  edited?: boolean;
  regenerated?: boolean;
}

/**
 * Individual message in a conversation
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent;
  timestamp: Date;
  metadata?: MessageMetadata;
}

/**
 * Conversation metadata
 */
export interface ConversationMetadata {
  platform: Platform;
  extractedAt: Date;
  messageCount: number;
  title?: string;
  url?: string;
  model?: string;
  totalTokens?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Complete conversation structure
 */
export interface Conversation {
  id: string;
  title: string;
  platform: Platform;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  metadata: ConversationMetadata;
} 