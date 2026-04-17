/**
 * Purpose: Handle Google Gemini API requests with function calling support
 *
 * Inputs:
 *   - apiKey (string): Google AI Studio API key
 *   - accountId (string): Current account ID
 *   - modelId (GeminiModel): Model to use
 *
 * Outputs:
 *   - Returns (GeminiService): Service instance for AI requests
 *
 * Side effects:
 *   - Makes HTTP requests to Google Gemini API
 *   - Executes database queries via DataQueryService
 *   - Logs API calls for debugging
 */

import type { AIConversationContext, GeminiModel } from '../../types/ai';
import { DataQueryService } from './dataQueryService';
import { DataMutationService } from './dataMutationService';
import { buildSystemPrompt } from './systemPrompt';
import { isWriteFunction } from '../../types/aiMutations';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export class GeminiService {
  private apiKey: string;
  private accountId: string;
  private userId: string;
  private modelId: GeminiModel;
  private dataQuery: DataQueryService;
  private dataMutation: DataMutationService;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string, accountId: string, userId: string, modelId: GeminiModel) {
    this.apiKey = apiKey;
    this.accountId = accountId;
    this.userId = userId;
    this.modelId = modelId;
    this.dataQuery = new DataQueryService(accountId);
    this.dataMutation = new DataMutationService(accountId, userId);
  }

  /**
   * Send a message to Gemini and get a response
   */
  async sendMessage(
    message: string,
    context: AIConversationContext
  ): Promise<{ text: string; pendingActions?: any[] }> {
    console.log('[GeminiService] Sending message:', message);

    try {
      // Build system prompt
      const systemPrompt = buildSystemPrompt({
        accountId: context.accountId,
        currency: context.accountCurrency,
        balance: context.accountBalance,
      });

      // Build message array
      const messages = this.buildMessageArray(systemPrompt, context, message);

      // Make API request
      const response = await this.callGeminiAPI(messages, true); // Enable function calling

      // Check if AI wants to call a function
      if (response.functionCalls && response.functionCalls.length > 0) {
        console.log('[GeminiService] AI requested function calls');
        return await this.handleFunctionCalls(
          response.functionCalls,
          messages,
          systemPrompt
        );
      }

      // Return direct response
      return {
        text: response.text || 'I apologize, but I was unable to generate a response.',
      };
    } catch (error: any) {
      console.error('[GeminiService] Error sending message:', error);
      throw new Error(
        error.message || 'Failed to communicate with AI. Please check your API key and try again.'
      );
    }
  }

  /**
   * Handle function calls (2-step process)
   */
  private async handleFunctionCalls(
    functionCalls: FunctionCall[],
    previousMessages: GeminiMessage[],
    systemPrompt: string
  ): Promise<{ text: string; pendingActions?: any[] }> {
    console.log('[GeminiService] Handling', functionCalls.length, 'function calls');

    // Execute all function calls
    const functionResults = [];
    const pendingActions = [];

    for (const call of functionCalls) {
      // Check if this is a write function
      if (isWriteFunction(call.name)) {
        // For write functions, create pending action instead of executing
        console.log('[GeminiService] Write function detected:', call.name);
        const result = await this.handleWriteFunction(call.name, call.args);

        // Collect pending action if created successfully
        if (result.pendingAction) {
          pendingActions.push(result.pendingAction);
        }

        // Send simplified response to AI (just the summary, not full action structure)
        const simplifiedResult = result.error
          ? { success: false, error: result.error }
          : { success: true, summary: result.pendingAction?.summary };

        functionResults.push({
          name: call.name,
          content: JSON.stringify(simplifiedResult),
        });
      } else {
        // For read functions, execute normally
        const result = await this.dataQuery.executeFunction(
          call.name,
          call.args
        );
        functionResults.push({
          name: call.name,
          content: JSON.stringify(result.data),
        });
      }
    }

    // Build new message array with function results
    const messagesWithResults = [
      ...previousMessages,
      {
        role: 'model' as const,
        parts: [
          {
            text: `[Function calls executed: ${functionCalls.map((c) => c.name).join(', ')}]`,
          },
        ],
      },
      {
        role: 'user' as const,
        parts: [
          {
            text: `Here are the results of the function calls:\n${JSON.stringify(functionResults, null, 2)}\n\nIMPORTANT: You MUST provide a natural, conversational response to the user. If a pending action was created, explain what you want to do and ask the user to confirm it. Always respond with helpful text - never leave your response empty.`,
          },
        ],
      },
    ];

    // Get final response from AI
    const finalResponse = await this.callGeminiAPI(messagesWithResults, false);

    // Log if response is empty for debugging
    if (!finalResponse.text) {
      console.warn('[GeminiService] AI returned empty response after function calls');
      console.warn('[GeminiService] Function results:', JSON.stringify(functionResults, null, 2));
    }

    // Provide helpful fallback based on what happened
    let fallbackText = 'I processed your request, but had trouble forming a response.';
    if (pendingActions.length > 0) {
      const action = pendingActions[0];
      fallbackText = `I want to ${action.summary}. Please review and confirm this action above.`;
    }

    return {
      text: finalResponse.text || fallbackText,
      pendingActions: pendingActions.length > 0 ? pendingActions : undefined,
    };
  }

  /**
   * Handle write function calls by creating pending actions
   */
  private async handleWriteFunction(
    functionName: string,
    params: Record<string, any>
  ): Promise<{ pendingAction: any; error?: string }> {
    try {
      let pendingAction;

      // Route to appropriate mutation service method
      switch (functionName) {
        // Transactions
        case 'createTransaction':
          pendingAction = await this.dataMutation.createTransactionAction(params);
          break;
        case 'updateTransaction':
          pendingAction = await this.dataMutation.updateTransactionAction(params);
          break;
        case 'deleteTransaction':
          pendingAction = await this.dataMutation.deleteTransactionAction(params);
          break;

        // Goals
        case 'createGoal':
          pendingAction = await this.dataMutation.createGoalAction(params);
          break;
        case 'updateGoal':
          pendingAction = await this.dataMutation.updateGoalAction(params);
          break;
        case 'updateGoalProgress':
          pendingAction = await this.dataMutation.updateGoalProgressAction(params);
          break;
        case 'completeGoal':
          pendingAction = await this.dataMutation.completeGoalAction(params);
          break;
        case 'deleteGoal':
          pendingAction = await this.dataMutation.deleteGoalAction(params);
          break;

        // Debts
        case 'createDebt':
          pendingAction = await this.dataMutation.createDebtAction(params);
          break;
        case 'updateDebt':
          pendingAction = await this.dataMutation.updateDebtAction(params);
          break;
        case 'recordDebtPayment':
          pendingAction = await this.dataMutation.recordDebtPaymentAction(params);
          break;
        case 'markDebtAsPaid':
          pendingAction = await this.dataMutation.markDebtAsPaidAction(params);
          break;
        case 'deleteDebt':
          pendingAction = await this.dataMutation.deleteDebtAction(params);
          break;

        // Subscriptions
        case 'createSubscription':
          pendingAction = await this.dataMutation.createSubscriptionAction(params);
          break;
        case 'updateSubscription':
          pendingAction = await this.dataMutation.updateSubscriptionAction(params);
          break;
        case 'toggleSubscription':
          pendingAction = await this.dataMutation.toggleSubscriptionAction(params);
          break;
        case 'deleteSubscription':
          pendingAction = await this.dataMutation.deleteSubscriptionAction(params);
          break;

        // Recurring Expenses
        case 'createRecurringExpense':
          pendingAction = await this.dataMutation.createRecurringExpenseAction(params);
          break;
        case 'updateRecurringExpense':
          pendingAction = await this.dataMutation.updateRecurringExpenseAction(params);
          break;
        case 'deleteRecurringExpense':
          pendingAction = await this.dataMutation.deleteRecurringExpenseAction(params);
          break;

        // Categories
        case 'createCategory':
          pendingAction = await this.dataMutation.createCategoryAction(params);
          break;
        case 'updateCategory':
          pendingAction = await this.dataMutation.updateCategoryAction(params);
          break;
        case 'deleteCategory':
          pendingAction = await this.dataMutation.deleteCategoryAction(params);
          break;

        default:
          throw new Error(`Unknown write function: ${functionName}`);
      }

      return { pendingAction };
    } catch (error: any) {
      console.error(`[GeminiService] Error in write function ${functionName}:`, error);
      return {
        pendingAction: null,
        error: error.userMessage || error.message || 'Failed to create action',
      };
    }
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(
    messages: GeminiMessage[],
    enableFunctions: boolean
  ): Promise<{ text?: string; functionCalls?: FunctionCall[] }> {
    const url = `${this.baseUrl}/${this.modelId}:generateContent?key=${this.apiKey}`;

    // Determine max tokens based on model
    const maxOutputTokens = this.modelId === 'gemini-1.5-pro' ? 2048 : 1024;

    const body: any = {
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens,
      },
    };

    // Add function definitions if enabled
    if (enableFunctions) {
      body.tools = [
        {
          function_declarations: this.getFunctionDefinitions(),
        },
      ];
    }

    console.log('[GeminiService] Making API request to:', this.modelId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `API request failed: ${response.status}`
      );
    }

    const data = await response.json();

    // Parse response
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error('No response from AI');
    }

    const part = candidate.content?.parts?.[0];

    // Check for function call
    if (part?.functionCall) {
      return {
        functionCalls: [
          {
            name: part.functionCall.name,
            args: part.functionCall.args || {},
          },
        ],
      };
    }

    // Regular text response
    return {
      text: part?.text || '',
    };
  }

  /**
   * Build message array for API request
   */
  private buildMessageArray(
    systemPrompt: string,
    context: AIConversationContext,
    newMessage: string
  ): GeminiMessage[] {
    const messages: GeminiMessage[] = [];

    // Add system prompt as first user message
    messages.push({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });

    // Add acknowledgment from model
    messages.push({
      role: 'model',
      parts: [{ text: 'Understood. I will help you with your finances.' }],
    });

    // Add conversation summary if exists
    if (context?.conversationSummary) {
      messages.push({
        role: 'user',
        parts: [{ text: `Previous conversation summary:\n${context.conversationSummary}` }],
      });
    }

    // Add recent messages from context
    if (context?.recentMessages && Array.isArray(context.recentMessages)) {
      context.recentMessages.forEach((msg) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      });
    }

    // Add new message
    messages.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });

    return messages;
  }

  /**
   * Get function definitions for Gemini
   */
  private getFunctionDefinitions() {
    return [
      {
        name: 'getRecentTransactions',
        description: 'Get recent transactions (max 10)',
        parameters: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of transactions to retrieve (1-10)',
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Filter by transaction type',
            },
          },
        },
      },
      {
        name: 'getMonthlyStats',
        description: 'Get income/expense statistics for a specific month',
        parameters: {
          type: 'object',
          properties: {
            year: {
              type: 'number',
              description: 'Year (e.g., 2026)',
            },
            month: {
              type: 'number',
              description: 'Month (1-12)',
            },
          },
          required: ['year', 'month'],
        },
      },
      {
        name: 'getCategoryBreakdown',
        description: 'Get spending/income breakdown by category for a date range',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date in ISO format (YYYY-MM-DD)',
            },
            endDate: {
              type: 'string',
              description: 'End date in ISO format (YYYY-MM-DD)',
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Type of transactions to analyze',
            },
          },
          required: ['startDate', 'endDate', 'type'],
        },
      },
      {
        name: 'getAccountBalance',
        description: 'Get current account balance across all vaults',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'getActiveGoals',
        description: 'Get all active savings goals',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'getDebtStats',
        description: 'Get lending/borrowing statistics and active debts',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'getActiveSubscriptions',
        description: 'Get all active monthly subscriptions',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'getRecurringExpenses',
        description: 'Get all scheduled recurring expenses',
        parameters: {
          type: 'object',
          properties: {},
        },
      },

      // ============ WRITE FUNCTIONS (CRUD Operations) ============
      // Transactions
      {
        name: 'createTransaction',
        description: 'Create a new income or expense transaction. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Transaction type',
            },
            amount: {
              type: 'number',
              description: 'Transaction amount (positive number)',
            },
            categoryName: {
              type: 'string',
              description: 'Category name (will be resolved to category ID)',
            },
            description: {
              type: 'string',
              description: 'Optional description or notes',
            },
            date: {
              type: 'string',
              description: 'Optional date in YYYY-MM-DD format (defaults to today)',
            },
            vaultType: {
              type: 'string',
              enum: ['main', 'savings', 'held'],
              description: 'Which vault to affect (defaults to main)',
            },
          },
          required: ['type', 'amount', 'categoryName'],
        },
      },
      {
        name: 'updateTransaction',
        description: 'Update an existing transaction. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            transactionId: {
              type: 'string',
              description: 'ID of transaction to update',
            },
            amount: { type: 'number', description: 'New amount' },
            categoryName: { type: 'string', description: 'New category name' },
            description: { type: 'string', description: 'New description' },
            date: { type: 'string', description: 'New date (YYYY-MM-DD)' },
            vaultType: {
              type: 'string',
              enum: ['main', 'savings', 'held'],
              description: 'New vault type',
            },
          },
          required: ['transactionId'],
        },
      },
      {
        name: 'deleteTransaction',
        description: 'Delete a transaction. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            transactionId: { type: 'string', description: 'ID of transaction to delete' },
            reason: { type: 'string', description: 'Optional reason for deletion' },
          },
          required: ['transactionId'],
        },
      },

      // Goals
      {
        name: 'createGoal',
        description: 'Create a new savings goal. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Goal name' },
            targetAmount: { type: 'number', description: 'Target amount to save' },
            fundingSource: {
              type: 'string',
              enum: ['main', 'savings', 'both'],
              description: 'Which vaults fund this goal (defaults to savings)',
            },
            icon: { type: 'string', description: 'Optional icon name' },
            color: { type: 'string', description: 'Optional hex color' },
          },
          required: ['name', 'targetAmount'],
        },
      },
      {
        name: 'updateGoal',
        description: 'Update a goal. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            goalId: { type: 'string', description: 'ID of goal to update' },
            name: { type: 'string', description: 'New name' },
            targetAmount: { type: 'number', description: 'New target amount' },
            fundingSource: {
              type: 'string',
              enum: ['main', 'savings', 'both'],
              description: 'New funding source',
            },
          },
          required: ['goalId'],
        },
      },
      {
        name: 'updateGoalProgress',
        description: 'Update the current amount saved for a goal. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            goalId: { type: 'string', description: 'ID of goal' },
            currentAmount: { type: 'number', description: 'New current amount' },
          },
          required: ['goalId', 'currentAmount'],
        },
      },
      {
        name: 'completeGoal',
        description: 'Mark a goal as completed. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            goalId: { type: 'string', description: 'ID of goal to complete' },
          },
          required: ['goalId'],
        },
      },
      {
        name: 'deleteGoal',
        description: 'Delete a goal. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            goalId: { type: 'string', description: 'ID of goal to delete' },
            reason: { type: 'string', description: 'Optional reason' },
          },
          required: ['goalId'],
        },
      },

      // Debts
      {
        name: 'createDebt',
        description: 'Record money lent or borrowed. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['lent', 'borrowed'],
              description: 'lent = money owed to me, borrowed = money I owe',
            },
            personName: { type: 'string', description: 'Name of person' },
            amount: { type: 'number', description: 'Amount' },
            dueDate: { type: 'string', description: 'Optional due date (YYYY-MM-DD)' },
            description: { type: 'string', description: 'Optional description' },
          },
          required: ['type', 'personName', 'amount'],
        },
      },
      {
        name: 'updateDebt',
        description: 'Update debt details. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            debtId: { type: 'string', description: 'ID of debt' },
            personName: { type: 'string', description: 'New person name' },
            amount: { type: 'number', description: 'New amount' },
            dueDate: { type: 'string', description: 'New due date (YYYY-MM-DD)' },
            description: { type: 'string', description: 'New description' },
          },
          required: ['debtId'],
        },
      },
      {
        name: 'recordDebtPayment',
        description: 'Record a payment toward a debt. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            debtId: { type: 'string', description: 'ID of debt' },
            paymentAmount: { type: 'number', description: 'Payment amount' },
          },
          required: ['debtId', 'paymentAmount'],
        },
      },
      {
        name: 'markDebtAsPaid',
        description: 'Mark a debt as fully paid/settled. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            debtId: { type: 'string', description: 'ID of debt' },
          },
          required: ['debtId'],
        },
      },
      {
        name: 'deleteDebt',
        description: 'Delete a debt record. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            debtId: { type: 'string', description: 'ID of debt to delete' },
            reason: { type: 'string', description: 'Optional reason' },
          },
          required: ['debtId'],
        },
      },

      // Subscriptions
      {
        name: 'createSubscription',
        description: 'Add a new monthly subscription. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Subscription name' },
            amount: { type: 'number', description: 'Monthly amount' },
            categoryName: { type: 'string', description: 'Category name' },
            billingDay: {
              type: 'number',
              description: 'Day of month for billing (1-31)',
            },
            vaultType: {
              type: 'string',
              enum: ['main', 'savings', 'held'],
              description: 'Which vault to deduct from (defaults to main)',
            },
          },
          required: ['name', 'amount', 'categoryName', 'billingDay'],
        },
      },
      {
        name: 'updateSubscription',
        description: 'Update subscription details. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            subscriptionId: { type: 'string', description: 'ID of subscription' },
            name: { type: 'string', description: 'New name' },
            amount: { type: 'number', description: 'New amount' },
            categoryName: { type: 'string', description: 'New category' },
            billingDay: { type: 'number', description: 'New billing day (1-31)' },
            isActive: { type: 'boolean', description: 'Active status' },
          },
          required: ['subscriptionId'],
        },
      },
      {
        name: 'toggleSubscription',
        description: 'Activate or deactivate a subscription. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            subscriptionId: { type: 'string', description: 'ID of subscription' },
            isActive: { type: 'boolean', description: 'New active status' },
          },
          required: ['subscriptionId', 'isActive'],
        },
      },
      {
        name: 'deleteSubscription',
        description: 'Remove a subscription. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            subscriptionId: { type: 'string', description: 'ID of subscription to delete' },
            reason: { type: 'string', description: 'Optional reason' },
          },
          required: ['subscriptionId'],
        },
      },

      // Recurring Expenses
      {
        name: 'createRecurringExpense',
        description: 'Add a new recurring expense. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Expense name' },
            amount: { type: 'number', description: 'Amount per occurrence' },
            categoryName: { type: 'string', description: 'Category name' },
            frequency: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'yearly'],
              description: 'How often it recurs',
            },
            interval: {
              type: 'number',
              description: 'Every X frequency units (e.g., interval=2, frequency=weekly = every 2 weeks)',
            },
            startDate: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD)',
            },
            vaultType: {
              type: 'string',
              enum: ['main', 'savings', 'held'],
              description: 'Which vault to deduct from',
            },
            autoDeduct: {
              type: 'boolean',
              description: 'Auto-create transaction on occurrence',
            },
          },
          required: ['name', 'amount', 'categoryName', 'frequency', 'interval', 'startDate'],
        },
      },
      {
        name: 'updateRecurringExpense',
        description: 'Update recurring expense details. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            recurringExpenseId: { type: 'string', description: 'ID of recurring expense' },
            name: { type: 'string', description: 'New name' },
            amount: { type: 'number', description: 'New amount' },
            categoryName: { type: 'string', description: 'New category' },
            frequency: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'yearly'],
              description: 'New frequency',
            },
            interval: { type: 'number', description: 'New interval' },
            isActive: { type: 'boolean', description: 'Active status' },
          },
          required: ['recurringExpenseId'],
        },
      },
      {
        name: 'deleteRecurringExpense',
        description: 'Remove a recurring expense. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            recurringExpenseId: { type: 'string', description: 'ID of recurring expense to delete' },
            reason: { type: 'string', description: 'Optional reason' },
          },
          required: ['recurringExpenseId'],
        },
      },

      // Categories
      {
        name: 'createCategory',
        description: 'Create a new custom category. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Category name' },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Category type',
            },
            icon: { type: 'string', description: 'Optional icon name' },
            color: { type: 'string', description: 'Optional hex color' },
          },
          required: ['name', 'type'],
        },
      },
      {
        name: 'updateCategory',
        description: 'Update category details. REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            categoryId: { type: 'string', description: 'ID of category' },
            name: { type: 'string', description: 'New name' },
            icon: { type: 'string', description: 'New icon' },
            color: { type: 'string', description: 'New color' },
          },
          required: ['categoryId'],
        },
      },
      {
        name: 'deleteCategory',
        description: 'Delete a custom category (cannot delete default categories). REQUIRES USER CONFIRMATION.',
        parameters: {
          type: 'object',
          properties: {
            categoryId: { type: 'string', description: 'ID of category to delete' },
          },
          required: ['categoryId'],
        },
      },
    ];
  }

  /**
   * Validate API key
   */
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
