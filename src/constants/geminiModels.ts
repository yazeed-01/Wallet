/**
 * Purpose: Define available Gemini AI models with their specifications and capabilities
 *
 * Outputs:
 *   - GEMINI_MODELS: Array of all available models with details
 *   - TOKENS_EXPLANATION: User-friendly explanation of what tokens are
 *
 * Side effects: None
 */

import { ModelInfo } from '../types/ai';

/**
 * Available Gemini models with detailed specifications
 *
 * Speed: ⚡⚡⚡ (3) = Fastest, ⚡⚡ (2) = Fast, ⚡ (1) = Balanced
 * Accuracy: ⭐⭐⭐⭐ (4) = Best, ⭐⭐⭐ (3) = Great, ⭐⭐ (2) = Good
 */
export const GEMINI_MODELS: ModelInfo[] = [
  {
    id: 'gemini-1.5-flash',
    name: '1.5 Flash',
    description: 'Fast and efficient with good accuracy',
    speed: 3,
    accuracy: 2,
    tokensPerMinute: 4000000, // 4M TPM
    maxOutputTokens: 8192,
    bestFor: 'Quick questions and simple queries',
    recommended: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: '2.5 Flash (Latest)',
    description: 'Latest model with best balance of speed and accuracy',
    speed: 2,
    accuracy: 3,
    tokensPerMinute: 4000000, // 4M TPM
    maxOutputTokens: 8192,
    bestFor: 'Most financial questions and insights',
    recommended: true, // Recommended option
  },
  {
    id: 'gemini-1.5-pro',
    name: '1.5 Pro',
    description: 'More accurate and detailed responses',
    speed: 1,
    accuracy: 4,
    tokensPerMinute: 2000000, // 2M TPM
    maxOutputTokens: 8192,
    bestFor: 'Complex analysis and detailed breakdowns',
    recommended: false,
  },
];

/**
 * Friendly explanation of what tokens are for users
 */
export const TOKENS_EXPLANATION = `Think of tokens like "word pieces" that the AI reads and writes.

For example, "spending" might be 1 token, while "budget analysis" could be 2-3 tokens.

**What you need to know:**
• The AI can read ~4 million tokens per minute (that's A LOT! 📚)
• A typical conversation uses 500-2000 tokens total
• Google gives you this for FREE - no limits for personal use
• You won't run out! The limits are very generous

**Bottom line:** Don't worry about tokens! Just chat naturally. The free tier is more than enough for daily use. 😊`;

/**
 * Get model info by ID
 */
export const getModelById = (modelId: string): ModelInfo | undefined => {
  return GEMINI_MODELS.find((model) => model.id === modelId);
};

/**
 * Get the recommended model
 */
export const getRecommendedModel = (): ModelInfo => {
  return GEMINI_MODELS.find((model) => model.recommended) || GEMINI_MODELS[1];
};
