/**
 * Purpose: Handle AI-initiated CRUD operations with pending action workflow
 *
 * Inputs:
 *   - accountId (string): Current user's account ID
 *   - userId (string): Current user's ID for category operations
 *
 * Outputs:
 *   - Returns (DataMutationService): Service instance with mutation methods
 *
 * Side effects:
 *   - Creates pending actions in memory
 *   - Executes database write operations on confirmation
 *   - Logs all operations via audit service
 */

import { v4 as uuidv4 } from 'uuid';
import { ValidationService } from './validationService';
import { TransactionRepository } from '../../database/repositories/TransactionRepository';
import { GoalRepository } from '../../database/repositories/GoalRepository';
import { DebtRepository } from '../../database/repositories/DebtRepository';
import { SubscriptionRepository } from '../../database/repositories/SubscriptionRepository';
import { RecurringExpenseRepository } from '../../database/repositories/RecurringExpenseRepository';
import { CategoryRepository } from '../../database/repositories/CategoryRepository';
import {
  AIOperationError,
  AIOperationErrorType,
  type PendingAction,
  type ActionResult,
  type MutationType,
  type EntityType,
  type CreateTransactionParams,
  type UpdateTransactionParams,
  type DeleteTransactionParams,
  type CreateGoalParams,
  type UpdateGoalParams,
  type UpdateGoalProgressParams,
  type CompleteGoalParams,
  type DeleteGoalParams,
  type CreateDebtParams,
  type UpdateDebtParams,
  type RecordDebtPaymentParams,
  type MarkDebtAsPaidParams,
  type DeleteDebtParams,
  type CreateSubscriptionParams,
  type UpdateSubscriptionParams,
  type ToggleSubscriptionParams,
  type DeleteSubscriptionParams,
  type CreateRecurringExpenseParams,
  type UpdateRecurringExpenseParams,
  type DeleteRecurringExpenseParams,
  type CreateCategoryParams,
  type UpdateCategoryParams,
  type DeleteCategoryParams,
  PENDING_ACTION_TTL_MS,
  WRITE_FUNCTION_NAMES,
} from '../../types/aiMutations';

export class DataMutationService {
  private accountId: string;
  private userId: string;
  private validator: ValidationService;
  private pendingActions: Map<string, PendingAction>;

  private transactionRepo: TransactionRepository;
  private goalRepo: GoalRepository;
  private debtRepo: DebtRepository;
  private subscriptionRepo: SubscriptionRepository;
  private recurringRepo: RecurringExpenseRepository;
  private categoryRepo: CategoryRepository;

  constructor(accountId: string, userId: string) {
    this.accountId = accountId;
    this.userId = userId;
    this.validator = new ValidationService(accountId);
    this.pendingActions = new Map();

    this.transactionRepo = new TransactionRepository();
    this.goalRepo = new GoalRepository();
    this.debtRepo = new DebtRepository();
    this.subscriptionRepo = new SubscriptionRepository();
    this.recurringRepo = new RecurringExpenseRepository();
    this.categoryRepo = new CategoryRepository();
  }

  // ============================================================================
  // Pending Action Management
  // ============================================================================

  createPendingAction(
    functionName: string,
    type: MutationType,
    entityType: EntityType,
    parameters: Record<string, any>,
    resolvedData: Record<string, any>,
    summary: string
  ): PendingAction {
    const actionId = uuidv4() as string;
    const now = Date.now();

    const action: PendingAction = {
      id: actionId,
      type,
      entityType,
      functionName,
      parameters,
      resolvedData,
      summary,
      createdAt: now,
      expiresAt: now + PENDING_ACTION_TTL_MS,
      status: 'pending',
    };

    this.pendingActions.set(actionId, action);

    // Auto-expire after TTL
    setTimeout(() => {
      this.expireAction(actionId);
    }, PENDING_ACTION_TTL_MS);

    return action;
  }

  getPendingAction(actionId: string): PendingAction | undefined {
    return this.pendingActions.get(actionId);
  }

  cancelAction(actionId: string): void {
    const action = this.pendingActions.get(actionId);
    if (action) {
      action.status = 'cancelled';
      this.pendingActions.set(actionId, action);
    }
  }

  private expireAction(actionId: string): void {
    const action = this.pendingActions.get(actionId);
    if (action && action.status === 'pending') {
      action.status = 'expired';
      this.pendingActions.set(actionId, action);
    }
  }

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  async createTransactionAction(params: CreateTransactionParams): Promise<PendingAction> {
    try {
      // Validate inputs
      const validated = await this.validator.validateTransactionInput(params);

      // Create summary
      const summary = `Add ${validated.amount.toFixed(2)} ${params.type} to ${validated.categoryName}${params.description ? ` (${params.description})` : ''}`;

      // Create pending action
      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.CREATE_TRANSACTION,
        'create',
        'transaction',
        params,
        validated,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'create transaction');
    }
  }

  async updateTransactionAction(params: UpdateTransactionParams): Promise<PendingAction> {
    try {
      // Validate transaction exists
      await this.validator.validateEntityExists('transaction', params.transactionId);

      // Get current transaction
      const transaction = await this.transactionRepo.findById(params.transactionId);
      if (!transaction) {
        throw new AIOperationError(
          AIOperationErrorType.ENTITY_NOT_FOUND,
          'Transaction not found',
          'Transaction not found.'
        );
      }

      // Validate and resolve updates
      const resolvedData: Record<string, any> = { transactionId: params.transactionId };

      if (params.categoryName) {
        const category = await this.validator.resolveCategoryName(
          params.categoryName,
          transaction.type
        );
        resolvedData.categoryId = category.id;
        resolvedData.categoryName = category.name;
      }

      if (params.amount !== undefined) {
        this.validator.validatePositiveNumber(params.amount, 'Amount');
        resolvedData.amount = params.amount;
      }

      if (params.date) {
        resolvedData.date = this.validator.validateDateString(params.date, 'Date');
      }

      if (params.description !== undefined) {
        resolvedData.description = params.description;
      }

      if (params.vaultType) {
        resolvedData.vaultType = this.validator.validateEnum(
          params.vaultType,
          ['main', 'savings', 'held'] as const,
          'Vault type'
        );
      }

      // Create summary
      const updates = [];
      if (params.amount) updates.push(`amount: ${params.amount.toFixed(2)}`);
      if (params.categoryName) updates.push(`category: ${resolvedData.categoryName}`);
      if (params.description) updates.push(`description: ${params.description}`);
      const summary = `Update transaction - ${updates.join(', ')}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.UPDATE_TRANSACTION,
        'update',
        'transaction',
        params,
        resolvedData,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'update transaction');
    }
  }

  async deleteTransactionAction(params: DeleteTransactionParams): Promise<PendingAction> {
    try {
      // Validate transaction exists
      await this.validator.validateEntityExists('transaction', params.transactionId);

      const summary = `Delete transaction${params.reason ? ` (${params.reason})` : ''}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.DELETE_TRANSACTION,
        'delete',
        'transaction',
        params,
        { transactionId: params.transactionId },
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'delete transaction');
    }
  }

  // ============================================================================
  // Goal Operations
  // ============================================================================

  async createGoalAction(params: CreateGoalParams): Promise<PendingAction> {
    try {
      const validated = await this.validator.validateGoalInput(params);

      const summary = `Create goal "${validated.name}" with target ${validated.targetAmount.toFixed(2)}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.CREATE_GOAL,
        'create',
        'goal',
        params,
        validated,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'create goal');
    }
  }

  async updateGoalAction(params: UpdateGoalParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('goal', params.goalId);

      const resolvedData: Record<string, any> = { goalId: params.goalId };
      const updates = [];

      if (params.name !== undefined) {
        this.validator.validateStringLength(params.name, 'Goal name', 1, 100);
        resolvedData.name = params.name.trim();
        updates.push(`name: ${params.name}`);
      }

      if (params.targetAmount !== undefined) {
        this.validator.validatePositiveNumber(params.targetAmount, 'Target amount');
        resolvedData.targetAmount = params.targetAmount;
        updates.push(`target: ${params.targetAmount.toFixed(2)}`);
      }

      if (params.fundingSource) {
        resolvedData.fundingSource = this.validator.validateEnum(
          params.fundingSource,
          ['main', 'savings', 'both'] as const,
          'Funding source'
        );
        updates.push(`funding: ${params.fundingSource}`);
      }

      const summary = `Update goal - ${updates.join(', ')}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.UPDATE_GOAL,
        'update',
        'goal',
        params,
        resolvedData,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'update goal');
    }
  }

  async updateGoalProgressAction(params: UpdateGoalProgressParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('goal', params.goalId);
      this.validator.validateNonNegativeNumber(params.currentAmount, 'Current amount');

      const summary = `Update goal progress to ${params.currentAmount.toFixed(2)}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.UPDATE_GOAL_PROGRESS,
        'update',
        'goal',
        params,
        params,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'update goal progress');
    }
  }

  async completeGoalAction(params: CompleteGoalParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('goal', params.goalId);

      const summary = 'Mark goal as completed';

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.COMPLETE_GOAL,
        'update',
        'goal',
        params,
        params,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'complete goal');
    }
  }

  async deleteGoalAction(params: DeleteGoalParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('goal', params.goalId);

      const summary = `Delete goal${params.reason ? ` (${params.reason})` : ''}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.DELETE_GOAL,
        'delete',
        'goal',
        params,
        { goalId: params.goalId },
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'delete goal');
    }
  }

  // ============================================================================
  // Debt Operations
  // ============================================================================

  async createDebtAction(params: CreateDebtParams): Promise<PendingAction> {
    try {
      const validated = await this.validator.validateDebtInput(params);

      const summary = `Record ${validated.amount.toFixed(2)} ${params.type} ${params.type === 'lent' ? 'to' : 'from'} ${validated.personName}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.CREATE_DEBT,
        'create',
        'debt',
        params,
        validated,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'create debt');
    }
  }

  async updateDebtAction(params: UpdateDebtParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('debt', params.debtId);

      const resolvedData: Record<string, any> = { debtId: params.debtId };
      const updates = [];

      if (params.personName !== undefined) {
        this.validator.validateStringLength(params.personName, 'Person name', 1, 100);
        resolvedData.personName = params.personName.trim();
        updates.push(`person: ${params.personName}`);
      }

      if (params.amount !== undefined) {
        this.validator.validatePositiveNumber(params.amount, 'Amount');
        resolvedData.amount = params.amount;
        updates.push(`amount: ${params.amount.toFixed(2)}`);
      }

      if (params.dueDate) {
        resolvedData.dueDate = this.validator.validateDateString(params.dueDate, 'Due date');
        updates.push(`due: ${params.dueDate}`);
      }

      if (params.description !== undefined) {
        resolvedData.description = params.description;
      }

      const summary = `Update debt - ${updates.join(', ')}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.UPDATE_DEBT,
        'update',
        'debt',
        params,
        resolvedData,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'update debt');
    }
  }

  async recordDebtPaymentAction(params: RecordDebtPaymentParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('debt', params.debtId);
      this.validator.validatePositiveNumber(params.paymentAmount, 'Payment amount');

      const summary = `Record payment of ${params.paymentAmount.toFixed(2)} for debt`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.RECORD_DEBT_PAYMENT,
        'update',
        'debt',
        params,
        params,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'record debt payment');
    }
  }

  async markDebtAsPaidAction(params: MarkDebtAsPaidParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('debt', params.debtId);

      const summary = 'Mark debt as fully paid';

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.MARK_DEBT_AS_PAID,
        'update',
        'debt',
        params,
        params,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'mark debt as paid');
    }
  }

  async deleteDebtAction(params: DeleteDebtParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('debt', params.debtId);

      const summary = `Delete debt${params.reason ? ` (${params.reason})` : ''}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.DELETE_DEBT,
        'delete',
        'debt',
        params,
        { debtId: params.debtId },
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'delete debt');
    }
  }

  // ============================================================================
  // Subscription Operations (continued in next message)
  // ============================================================================

  async createSubscriptionAction(params: CreateSubscriptionParams): Promise<PendingAction> {
    try {
      const validated = await this.validator.validateSubscriptionInput(params);

      const summary = `Create subscription "${validated.name}" - ${validated.amount.toFixed(2)} on day ${validated.billingDay}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.CREATE_SUBSCRIPTION,
        'create',
        'subscription',
        params,
        validated,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'create subscription');
    }
  }

  async updateSubscriptionAction(params: UpdateSubscriptionParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('subscription', params.subscriptionId);

      const resolvedData: Record<string, any> = { subscriptionId: params.subscriptionId };
      const updates = [];

      if (params.name !== undefined) {
        this.validator.validateStringLength(params.name, 'Subscription name', 1, 100);
        resolvedData.name = params.name.trim();
        updates.push(`name: ${params.name}`);
      }

      if (params.amount !== undefined) {
        this.validator.validatePositiveNumber(params.amount, 'Amount');
        resolvedData.amount = params.amount;
        updates.push(`amount: ${params.amount.toFixed(2)}`);
      }

      if (params.categoryName) {
        const category = await this.validator.resolveCategoryName(params.categoryName, 'expense');
        resolvedData.categoryId = category.id;
        resolvedData.categoryName = category.name;
        updates.push(`category: ${category.name}`);
      }

      if (params.billingDay !== undefined) {
        this.validator.validateBillingDay(params.billingDay);
        resolvedData.billingDay = params.billingDay;
        updates.push(`billing day: ${params.billingDay}`);
      }

      if (params.isActive !== undefined) {
        resolvedData.isActive = params.isActive;
        updates.push(`active: ${params.isActive}`);
      }

      const summary = `Update subscription - ${updates.join(', ')}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.UPDATE_SUBSCRIPTION,
        'update',
        'subscription',
        params,
        resolvedData,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'update subscription');
    }
  }

  async toggleSubscriptionAction(params: ToggleSubscriptionParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('subscription', params.subscriptionId);

      const summary = `${params.isActive ? 'Activate' : 'Deactivate'} subscription`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.TOGGLE_SUBSCRIPTION,
        'update',
        'subscription',
        params,
        params,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'toggle subscription');
    }
  }

  async deleteSubscriptionAction(params: DeleteSubscriptionParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('subscription', params.subscriptionId);

      const summary = `Delete subscription${params.reason ? ` (${params.reason})` : ''}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.DELETE_SUBSCRIPTION,
        'delete',
        'subscription',
        params,
        { subscriptionId: params.subscriptionId },
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'delete subscription');
    }
  }

  // ============================================================================
  // Recurring Expense Operations
  // ============================================================================

  async createRecurringExpenseAction(params: CreateRecurringExpenseParams): Promise<PendingAction> {
    try {
      const validated = await this.validator.validateRecurringExpenseInput(params);

      const summary = `Create recurring expense "${validated.name}" - ${validated.amount.toFixed(2)} ${params.frequency}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.CREATE_RECURRING_EXPENSE,
        'create',
        'recurringExpense',
        params,
        validated,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'create recurring expense');
    }
  }

  async updateRecurringExpenseAction(params: UpdateRecurringExpenseParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('recurringExpense', params.recurringExpenseId);

      const resolvedData: Record<string, any> = { recurringExpenseId: params.recurringExpenseId };
      const updates = [];

      if (params.name !== undefined) {
        this.validator.validateStringLength(params.name, 'Expense name', 1, 100);
        resolvedData.name = params.name.trim();
        updates.push(`name: ${params.name}`);
      }

      if (params.amount !== undefined) {
        this.validator.validatePositiveNumber(params.amount, 'Amount');
        resolvedData.amount = params.amount;
        updates.push(`amount: ${params.amount.toFixed(2)}`);
      }

      if (params.categoryName) {
        const category = await this.validator.resolveCategoryName(params.categoryName, 'expense');
        resolvedData.categoryId = category.id;
        resolvedData.categoryName = category.name;
        updates.push(`category: ${category.name}`);
      }

      if (params.frequency) {
        resolvedData.frequency = this.validator.validateEnum(
          params.frequency,
          ['daily', 'weekly', 'monthly', 'yearly'] as const,
          'Frequency'
        );
        updates.push(`frequency: ${params.frequency}`);
      }

      if (params.interval !== undefined) {
        this.validator.validateInterval(params.interval);
        resolvedData.interval = params.interval;
        updates.push(`interval: ${params.interval}`);
      }

      if (params.isActive !== undefined) {
        resolvedData.isActive = params.isActive;
        updates.push(`active: ${params.isActive}`);
      }

      const summary = `Update recurring expense - ${updates.join(', ')}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.UPDATE_RECURRING_EXPENSE,
        'update',
        'recurringExpense',
        params,
        resolvedData,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'update recurring expense');
    }
  }

  async deleteRecurringExpenseAction(params: DeleteRecurringExpenseParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('recurringExpense', params.recurringExpenseId);

      const summary = `Delete recurring expense${params.reason ? ` (${params.reason})` : ''}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.DELETE_RECURRING_EXPENSE,
        'delete',
        'recurringExpense',
        params,
        { recurringExpenseId: params.recurringExpenseId },
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'delete recurring expense');
    }
  }

  // ============================================================================
  // Category Operations
  // ============================================================================

  async createCategoryAction(params: CreateCategoryParams): Promise<PendingAction> {
    try {
      const validated = await this.validator.validateCategoryInput(params);

      const summary = `Create ${params.type} category "${validated.name}"`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.CREATE_CATEGORY,
        'create',
        'category',
        params,
        validated,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'create category');
    }
  }

  async updateCategoryAction(params: UpdateCategoryParams): Promise<PendingAction> {
    try {
      await this.validator.validateEntityExists('category', params.categoryId);

      const resolvedData: Record<string, any> = { categoryId: params.categoryId };
      const updates = [];

      if (params.name !== undefined) {
        this.validator.validateStringLength(params.name, 'Category name', 1, 50);
        resolvedData.name = params.name.trim();
        updates.push(`name: ${params.name}`);
      }

      if (params.icon !== undefined) {
        resolvedData.icon = params.icon;
        updates.push(`icon: ${params.icon}`);
      }

      if (params.color !== undefined) {
        resolvedData.color = params.color;
        updates.push(`color: ${params.color}`);
      }

      const summary = `Update category - ${updates.join(', ')}`;

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.UPDATE_CATEGORY,
        'update',
        'category',
        params,
        resolvedData,
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'update category');
    }
  }

  async deleteCategoryAction(params: DeleteCategoryParams): Promise<PendingAction> {
    try {
      await this.validator.validateCategoryDeletion(params.categoryId);

      const summary = 'Delete category';

      return this.createPendingAction(
        WRITE_FUNCTION_NAMES.DELETE_CATEGORY,
        'delete',
        'category',
        params,
        { categoryId: params.categoryId },
        summary
      );
    } catch (error) {
      throw this.handleError(error, 'delete category');
    }
  }

  // ============================================================================
  // Execute Action (on user confirmation)
  // ============================================================================

  async executeAction(actionId: string, providedAction?: PendingAction): Promise<ActionResult> {
    // Use provided action if available, otherwise try to get from local Map
    const action = providedAction || this.pendingActions.get(actionId);

    if (!action) {
      throw new AIOperationError(
        AIOperationErrorType.ACTION_NOT_FOUND,
        'Action not found',
        'This action no longer exists. Please try again.'
      );
    }

    if (action.status === 'expired') {
      throw new AIOperationError(
        AIOperationErrorType.ACTION_EXPIRED,
        'Action expired',
        'This action has expired. Would you like me to create it again?'
      );
    }

    if (action.status !== 'pending') {
      throw new AIOperationError(
        AIOperationErrorType.PERMISSION_DENIED,
        `Action is ${action.status}`,
        `This action is ${action.status} and cannot be executed.`
      );
    }

    try {
      let entityId: string | undefined;

      // Execute based on function name
      switch (action.functionName) {
        // Transactions
        case WRITE_FUNCTION_NAMES.CREATE_TRANSACTION:
          entityId = await this.executeCreateTransaction(action.resolvedData);
          break;
        case WRITE_FUNCTION_NAMES.UPDATE_TRANSACTION:
          await this.executeUpdateTransaction(action.resolvedData);
          entityId = action.resolvedData.transactionId;
          break;
        case WRITE_FUNCTION_NAMES.DELETE_TRANSACTION:
          await this.transactionRepo.delete(action.resolvedData.transactionId);
          break;

        // Goals
        case WRITE_FUNCTION_NAMES.CREATE_GOAL:
          entityId = await this.executeCreateGoal(action.resolvedData);
          break;
        case WRITE_FUNCTION_NAMES.UPDATE_GOAL:
          await this.goalRepo.update(action.resolvedData.goalId, action.resolvedData);
          entityId = action.resolvedData.goalId;
          break;
        case WRITE_FUNCTION_NAMES.UPDATE_GOAL_PROGRESS:
          await this.goalRepo.updateProgress(action.resolvedData.goalId, action.resolvedData.currentAmount);
          entityId = action.resolvedData.goalId;
          break;
        case WRITE_FUNCTION_NAMES.COMPLETE_GOAL:
          await this.goalRepo.markCompleted(action.resolvedData.goalId);
          entityId = action.resolvedData.goalId;
          break;
        case WRITE_FUNCTION_NAMES.DELETE_GOAL:
          await this.goalRepo.delete(action.resolvedData.goalId);
          break;

        // Debts
        case WRITE_FUNCTION_NAMES.CREATE_DEBT:
          entityId = await this.executeCreateDebt(action.resolvedData);
          break;
        case WRITE_FUNCTION_NAMES.UPDATE_DEBT:
          await this.debtRepo.update(action.resolvedData.debtId, action.resolvedData);
          entityId = action.resolvedData.debtId;
          break;
        case WRITE_FUNCTION_NAMES.RECORD_DEBT_PAYMENT:
          await this.debtRepo.recordPayment(action.resolvedData.debtId, action.resolvedData.paymentAmount);
          entityId = action.resolvedData.debtId;
          break;
        case WRITE_FUNCTION_NAMES.MARK_DEBT_AS_PAID:
          await this.debtRepo.markAsPaid(action.resolvedData.debtId);
          entityId = action.resolvedData.debtId;
          break;
        case WRITE_FUNCTION_NAMES.DELETE_DEBT:
          await this.debtRepo.delete(action.resolvedData.debtId);
          break;

        // Subscriptions
        case WRITE_FUNCTION_NAMES.CREATE_SUBSCRIPTION:
          entityId = await this.executeCreateSubscription(action.resolvedData);
          break;
        case WRITE_FUNCTION_NAMES.UPDATE_SUBSCRIPTION:
          await this.subscriptionRepo.update(action.resolvedData.subscriptionId, action.resolvedData);
          entityId = action.resolvedData.subscriptionId;
          break;
        case WRITE_FUNCTION_NAMES.TOGGLE_SUBSCRIPTION:
          await this.subscriptionRepo.update(action.resolvedData.subscriptionId, { isActive: action.resolvedData.isActive });
          entityId = action.resolvedData.subscriptionId;
          break;
        case WRITE_FUNCTION_NAMES.DELETE_SUBSCRIPTION:
          await this.subscriptionRepo.delete(action.resolvedData.subscriptionId);
          break;

        // Recurring Expenses
        case WRITE_FUNCTION_NAMES.CREATE_RECURRING_EXPENSE:
          entityId = await this.executeCreateRecurringExpense(action.resolvedData);
          break;
        case WRITE_FUNCTION_NAMES.UPDATE_RECURRING_EXPENSE:
          await this.recurringRepo.update(action.resolvedData.recurringExpenseId, action.resolvedData);
          entityId = action.resolvedData.recurringExpenseId;
          break;
        case WRITE_FUNCTION_NAMES.DELETE_RECURRING_EXPENSE:
          await this.recurringRepo.delete(action.resolvedData.recurringExpenseId);
          break;

        // Categories
        case WRITE_FUNCTION_NAMES.CREATE_CATEGORY:
          entityId = await this.executeCreateCategory(action.resolvedData);
          break;
        case WRITE_FUNCTION_NAMES.UPDATE_CATEGORY:
          await this.categoryRepo.update(action.resolvedData.categoryId, action.resolvedData);
          entityId = action.resolvedData.categoryId;
          break;
        case WRITE_FUNCTION_NAMES.DELETE_CATEGORY:
          await this.categoryRepo.delete(action.resolvedData.categoryId);
          break;

        default:
          throw new AIOperationError(
            AIOperationErrorType.PERMISSION_DENIED,
            `Unknown function: ${action.functionName}`,
            'Unknown operation.'
          );
      }

      // Mark action as confirmed
      action.status = 'confirmed';
      this.pendingActions.set(actionId, action);

      return {
        success: true,
        actionId,
        entityType: action.entityType,
        entityId,
      };
    } catch (error) {
      action.status = 'failed';
      this.pendingActions.set(actionId, action);
      throw this.handleError(error, 'execute action');
    }
  }

  // ============================================================================
  // Execute Helpers
  // ============================================================================

  private async executeCreateTransaction(data: any): Promise<string> {
    const transaction = await this.transactionRepo.create({
      accountId: this.accountId,
      type: data.type,
      amount: data.amount,
      categoryId: data.categoryId,
      description: data.description ?? '',
      date: data.date ?? Date.now(),
      vaultType: data.vaultType ?? 'main',
      isRecurring: false,
      currency: data.currency ?? 'USD',
    });
    return transaction.id;
  }

  private async executeUpdateTransaction(data: any): Promise<void> {
    const updates: any = {};
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
    if (data.description !== undefined) updates.description = data.description;
    if (data.date !== undefined) updates.date = data.date;
    if (data.vaultType !== undefined) updates.vaultType = data.vaultType;

    await this.transactionRepo.update(data.transactionId, updates);
  }

  private async executeCreateGoal(data: any): Promise<string> {
    const goal = await this.goalRepo.create({
      accountId: this.accountId,
      name: data.name,
      targetAmount: data.targetAmount,
      fundingSource: data.fundingSource ?? 'main',
      icon: data.icon ?? 'flag',
      color: data.color ?? '#4CAF50',
    });
    return goal.id;
  }

  private async executeCreateDebt(data: any): Promise<string> {
    const debt = await this.debtRepo.create({
      accountId: this.accountId,
      type: data.type,
      personName: data.personName,
      amount: data.amount,
      dueDate: data.dueDate ?? null,
      description: data.description ?? '',
      categoryId: data.categoryId ?? null,
    });
    return debt.id;
  }

  private async executeCreateSubscription(data: any): Promise<string> {
    const subscription = await this.subscriptionRepo.create({
      accountId: this.accountId,
      name: data.name,
      amount: data.amount,
      categoryId: data.categoryId,
      billingDay: data.billingDay,
      vaultType: data.vaultType,
      isActive: true,
    });
    return subscription.id;
  }

  private async executeCreateRecurringExpense(data: any): Promise<string> {
    const recurring = await this.recurringRepo.create({
      accountId: this.accountId,
      name: data.name,
      amount: data.amount,
      categoryId: data.categoryId,
      frequency: data.frequency,
      interval: data.interval,
      nextOccurrence: data.nextOccurrence,
      vaultType: data.vaultType,
      autoDeduct: data.autoDeduct,
      isActive: true,
    });
    return recurring.id;
  }

  private async executeCreateCategory(data: any): Promise<string> {
    const category = await this.categoryRepo.create({
      userId: this.userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      isDefault: false,
    });
    return category.id;
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  private handleError(error: any, operation: string): AIOperationError {
    if (error instanceof AIOperationError) {
      return error;
    }

    console.error(`[DataMutationService] Error in ${operation}:`, error);

    return new AIOperationError(
      AIOperationErrorType.DATABASE_ERROR,
      error.message || 'Unknown error',
      `Failed to ${operation}. Please try again.`
    );
  }
}
