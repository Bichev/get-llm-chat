import type { Conversation } from '@/types';

/**
 * API service for communicating with our backend
 */
export class ApiService {
  /**
   * Parse a conversation from a ChatGPT URL using our API proxy
   */
  static async parseConversation(url: string): Promise<Conversation> {
    try {
      // Determine API base URL
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3001'; // Vercel dev server

      const response = await fetch(`${apiBaseUrl}/api/parse-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.conversation) {
        throw new Error(data.error || 'Invalid response from API');
      }

      return data.conversation;
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a network error (API not available)
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          throw new Error(
            'API server not available. Make sure to run "vercel dev" in another terminal to start the local API server. ' +
            'See instructions below for setup.'
          );
        }
        throw error;
      }
      throw new Error('Unknown error occurred while parsing conversation');
    }
  }

  /**
   * Check if the API is available
   */
  static async checkApiHealth(): Promise<boolean> {
    try {
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3001';

      const response = await fetch(`${apiBaseUrl}/api/parse-conversation`, {
        method: 'OPTIONS',
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
} 