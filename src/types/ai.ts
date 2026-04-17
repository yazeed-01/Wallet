/**
 * Purpose: Type definitions for AI chat integration with Google Gemini
 *
 * Outputs:
 *   - Exports all TypeScript types and interfaces for AI features
 *
 * Side effects: None
 */

/**
 * Available Gemini model identifiers
 */
export type GeminiModel =
  | 'gemini-1.5-flash'
  | 'gemini-2.5-flash'
  | 'gemini-1.5-pro';

/**
 * Detailed information about a Gemini model
 */
export interface ModelInfo {
  id: GeminiModel;
  name: string;
  description: string;
  speed: number; // 1-3 (1 = slowest, 3 = fastest)
  accuracy: number; // 1-4 (1 = basic, 4 = best)
  tokensPerMinute: number; // Rate limit
  maxOutputTokens: number; // Maximum tokens in response
  bestFor: string; // Use case description
  recommended: boolean; // Is this the recommended model
}

/**
 * User AI settings stored in settings store
 */
export interface AISettings {
  apiKey: string | null; // Google AI Studio API key
  selectedModel: GeminiModel; // Currently selected model
  isConfigured: boolean; // Whether API key is set
  totalTokensUsed: number; // Total tokens consumed (for stats)
  conversationCount: number; // Number of conversations started
  lastUsed: number | null; // Timestamp of last usage
}

/**
 * Message role in conversation
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Single message in AI conversation
 */
export interface AIMessage {
  id: string; // Unique message ID
  role: MessageRole; // Who sent the message
  content: string; // Message text
  timestamp: number; // Unix timestamp
  isError?: boolean; // Whether this is an error message
  functionCalls?: string[]; // Names of functions called (for debugging)
  pendingActionId?: string; // ID of pending action associated with this message
}

/**
 * Context provided to AI for conversation continuity
 */
export interface AIConversationContext {
  accountId: string; // Current user's account ID
  accountCurrency: string; // Account currency code
  accountBalance: number; // Current total balance
  conversationSummary?: string; // Summary of older messages (for context)
  recentMessages: AIMessage[]; // Last N messages in full detail
  timestamp: number; // When context was created
}

/**
 * Response from a data query function
 */
export interface DataQueryResult {
  functionName: string; // Name of the function called
  data: any; // Result data (varies by function)
  error?: string; // Error message if query failed
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  apiKey: string; // Google AI Studio API key
  accountId: string; // Current account ID
  modelId: GeminiModel; // Model to use
}
