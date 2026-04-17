/**
 * Purpose: Execute database queries for AI assistant function calls
 *
 * Inputs:
 *   - accountId (string): Current user's account ID
 *
 * Outputs:
 *   - Returns (DataQueryService): Service instance with query methods
 *
 * Side effects:
 *   - Queries database for financial data
 *   - Logs query execution for debugging
 */

import { TransactionRepository } from '../../database/repositories/TransactionRepository';
import { CategoryRepository } from '../../database/repositories/CategoryRepository';
import { GoalRepository } from '../../database/repositories/GoalRepository';
import { DebtRepository } from '../../database/repositories/DebtRepository';
import { SubscriptionRepository } from '../../database/repositories/SubscriptionRepository';
import { RecurringExpenseRepository } from '../../database/repositories/RecurringExpenseRepository';
import { AccountRepository } from '../../database/repositories/AccountRepository';
import type { DataQueryResult } from '../../types/ai';

export class DataQueryService {
  private accountId: string;
  private transactionRepo: TransactionRepository;
  private categoryRepo: CategoryRepository;
  private goalRepo: GoalRepository;
  private debtRepo: DebtRepository;
  private subscriptionRepo: SubscriptionRepository;
  private recurringRepo: RecurringExpenseRepository;
  private accountRepo: AccountRepository;

  constructor(accountId: string) {
    this.accountId = accountId;
    this.transactionRepo = new TransactionRepository();
    this.categoryRepo = new CategoryRepository();
    this.goalRepo = new GoalRepository();
    this.debtRepo = new DebtRepository();
    this.subscriptionRepo = new SubscriptionRepository();
    this.recurringRepo = new RecurringExpenseRepository();
    this.accountRepo = new AccountRepository();
  }

  /**
   * Execute a function by name with parameters
   */
  async executeFunction(
    functionName: string,
    params: Record<string, any>
  ): Promise<DataQueryResult> {
    try {
      console.log(`[DataQuery] Executing ${functionName} with params:`, params);

      let data: any;

      switch (functionName) {
        case 'getRecentTransactions':
          data = await this.getRecentTransactions(params.limit, params.type);
          break;
        case 'getMonthlyStats':
          data = await this.getMonthlyStats(params.year, params.month);
          break;
        case 'getCategoryBreakdown':
          data = await this.getCategoryBreakdown(
            params.startDate,
            params.endDate,
            params.type
          );
          break;
        case 'getAccountBalance':
          data = await this.getAccountBalance();
          break;
        case 'getActiveGoals':
          data = await this.getActiveGoals();
          break;
        case 'getDebtStats':
          data = await this.getDebtStats();
          break;
        case 'getActiveSubscriptions':
          data = await this.getActiveSubscriptions();
          break;
        case 'getRecurringExpenses':
          data = await this.getRecurringExpenses();
          break;
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }

      return {
        functionName,
        data,
      };
    } catch (error: any) {
      console.error(`[DataQuery] Error executing ${functionName}:`, error);
      return {
        functionName,
        data: null,
        error: error.message || 'Failed to execute query',
      };
    }
  }

  /**
   * Get recent transactions (max 10)
   */
  async getRecentTransactions(limit: number = 10, type?: 'income' | 'expense') {
    try {
      // Limit to max 10
      const actualLimit = Math.min(limit, 10);

      // Get transactions
      const transactions = await this.transactionRepo.findByAccount(
        this.accountId,
        actualLimit * 2 // Get more in case we need to filter by type
      );

      // Filter by type if specified
      let filtered = type
        ? transactions.filter((t) => t.type === type)
        : transactions;

      // Limit to requested amount
      filtered = filtered.slice(0, actualLimit);

      // Get categories for all transactions
      const categoryMap = new Map();
      for (const transaction of filtered) {
        if (!categoryMap.has(transaction.categoryId)) {
          const category = await this.categoryRepo.findById(
            transaction.categoryId
          );
          if (category) {
            categoryMap.set(transaction.categoryId, category.name);
          }
        }
      }

      // Format for AI
      return filtered.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: categoryMap.get(t.categoryId) || 'Unknown',
        description: t.description || '',
        date: new Date(t.date).toISOString().split('T')[0],
        vault: t.vaultType,
      }));
    } catch (error: any) {
      console.error('[DataQuery] getRecentTransactions error:', error);
      throw error;
    }
  }

  /**
   * Get monthly statistics (income/expense totals)
   */
  async getMonthlyStats(year: number, month: number) {
    try {
      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1).getTime();
      const endDate = new Date(year, month, 0, 23, 59, 59).getTime();

      // Get all transactions for the month
      const transactions = await this.transactionRepo.findByDateRange(
        this.accountId,
        startDate,
        endDate
      );

      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;

      transactions.forEach((t) => {
        if (t.type === 'income') {
          totalIncome += (t.amount || 0);
        } else {
          totalExpense += (t.amount || 0);
        }
      });

      return {
        year,
        month,
        totalIncome: Number((totalIncome ?? 0).toFixed(2)),
        totalExpense: Number((totalExpense ?? 0).toFixed(2)),
        netSavings: Number(((totalIncome ?? 0) - (totalExpense ?? 0)).toFixed(2)),
        transactionCount: transactions.length,
      };
    } catch (error: any) {
      console.error('[DataQuery] getMonthlyStats error:', error);
      throw error;
    }
  }

  /**
   * Get category breakdown for a date range
   */
  async getCategoryBreakdown(
    startDate: string,
    endDate: string,
    type: 'income' | 'expense'
  ) {
    try {
      // Convert ISO dates to timestamps
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).setHours(23, 59, 59, 999);

      // Get transactions
      const transactions = await this.transactionRepo.findByDateRange(
        this.accountId,
        start,
        end
      );

      // Filter by type
      const filtered = transactions.filter((t) => t.type === type);

      // Group by category
      const categoryTotals = new Map<string, { total: number; count: number }>();
      let grandTotal = 0;

      for (const transaction of filtered) {
        const categoryId = transaction.categoryId;
        const current = categoryTotals.get(categoryId) || { total: 0, count: 0 };
        current.total += (transaction.amount || 0);
        current.count += 1;
        categoryTotals.set(categoryId, current);
        grandTotal += (transaction.amount || 0);
      }

      // Get category names and format results
      const results = [];
      for (const [categoryId, stats] of categoryTotals.entries()) {
        const category = await this.categoryRepo.findById(categoryId);
        results.push({
          categoryName: category?.name || 'Unknown',
          total: Number((stats.total ?? 0).toFixed(2)),
          count: stats.count,
          percentage: Number((((stats.total ?? 0) / (grandTotal || 1)) * 100).toFixed(1)),
        });
      }

      // Sort by total descending
      results.sort((a, b) => b.total - a.total);

      return results;
    } catch (error: any) {
      console.error('[DataQuery] getCategoryBreakdown error:', error);
      throw error;
    }
  }

  /**
   * Get current account balance (vault balances)
   */
  async getAccountBalance() {
    try {
      const account = await this.accountRepo.findById(this.accountId);

      if (!account) {
        throw new Error('Account not found');
      }

      // Calculate vault balances from transactions
      const transactions = await this.transactionRepo.findByAccount(this.accountId);

      let mainVault = 0;
      let savingsVault = 0;
      let heldVault = 0;

      transactions.forEach((transaction) => {
        const amount = transaction.amount || 0;
        const vaultType = transaction.vaultType;

        // Add income, subtract expenses
        const value = transaction.type === 'income' ? amount : -amount;

        if (vaultType === 'main') {
          mainVault += value;
        } else if (vaultType === 'savings') {
          savingsVault += value;
        } else if (vaultType === 'held') {
          heldVault += value;
        }
      });

      const result = {
        main: Number(mainVault.toFixed(2)),
        savings: Number(savingsVault.toFixed(2)),
        held: Number(heldVault.toFixed(2)),
        total: Number((mainVault + savingsVault + heldVault).toFixed(2)),
        currency: account.currency || 'USD',
      };

      console.log('[DataQuery] Calculated balances:', result);

      return result;
    } catch (error: any) {
      console.error('[DataQuery] getAccountBalance error:', error);
      throw error;
    }
  }

  /**
   * Get all active savings goals
   */
  async getActiveGoals() {
    try {
      const goals = await this.goalRepo.findByAccount(this.accountId);

      // Filter active goals only
      const activeGoals = goals.filter((g) => g.status === 'active');

      return activeGoals.map((g) => {
        const currentAmount = g.currentAmount || 0;
        const targetAmount = g.targetAmount || 1;
        const progress = (currentAmount / targetAmount) * 100;
        return {
          id: g.id,
          name: g.name,
          targetAmount: Number(targetAmount.toFixed(2)),
          currentAmount: Number(currentAmount.toFixed(2)),
          progress: Number(progress.toFixed(1)),
          deadline: g.deadline
            ? new Date(g.deadline).toISOString().split('T')[0]
            : null,
          category: g.category || 'General',
        };
      });
    } catch (error: any) {
      console.error('[DataQuery] getActiveGoals error:', error);
      throw error;
    }
  }

  /**
   * Get debt statistics (lending/borrowing summary)
   */
  async getDebtStats() {
    try {
      const debts = await this.debtRepo.findByAccount(this.accountId);

      let totalLending = 0;
      let totalBorrowing = 0;
      const activeDebts: any[] = [];

      debts.forEach((debt) => {
        if (debt.status !== 'settled') {
          const amount = debt.amount || 0;
          const paidAmount = debt.paidAmount || 0;
          const remaining = amount - paidAmount;

          if (debt.type === 'lending') {
            totalLending += remaining;
          } else {
            totalBorrowing += remaining;
          }

          activeDebts.push({
            id: debt.id,
            type: debt.type,
            person: debt.personName,
            totalAmount: Number(amount.toFixed(2)),
            paidAmount: Number(paidAmount.toFixed(2)),
            remaining: Number(remaining.toFixed(2)),
            dueDate: debt.dueDate
              ? new Date(debt.dueDate).toISOString().split('T')[0]
              : null,
          });
        }
      });

      return {
        totalLending: Number(totalLending.toFixed(2)),
        totalBorrowing: Number(totalBorrowing.toFixed(2)),
        netPosition: Number((totalLending - totalBorrowing).toFixed(2)),
        activeDebts: activeDebts.slice(0, 10), // Limit to 10 most recent
      };
    } catch (error: any) {
      console.error('[DataQuery] getDebtStats error:', error);
      throw error;
    }
  }

  /**
   * Get all active subscriptions
   */
  async getActiveSubscriptions() {
    try {
      const subscriptions = await this.subscriptionRepo.findByAccount(
        this.accountId
      );

      // Filter active only
      const active = subscriptions.filter((s) => s.isActive);

      // Get categories
      const results = [];
      for (const sub of active) {
        const category = await this.categoryRepo.findById(sub.categoryId);
        results.push({
          id: sub.id,
          name: sub.name,
          amount: Number((sub.amount || 0).toFixed(2)),
          nextBillingDate: new Date(sub.nextBillingDate)
            .toISOString()
            .split('T')[0],
          category: category?.name || 'Unknown',
        });
      }

      return results;
    } catch (error: any) {
      console.error('[DataQuery] getActiveSubscriptions error:', error);
      throw error;
    }
  }

  /**
   * Get all recurring expenses
   */
  async getRecurringExpenses() {
    try {
      const expenses = await this.recurringRepo.findByAccount(this.accountId);

      // Filter active only
      const active = expenses.filter((e) => e.isActive);

      // Get categories
      const results = [];
      for (const expense of active) {
        const category = await this.categoryRepo.findById(expense.categoryId);
        results.push({
          id: expense.id,
          name: expense.name,
          amount: Number((expense.amount || 0).toFixed(2)),
          frequency: expense.frequency,
          nextDate: new Date(expense.nextDate).toISOString().split('T')[0],
          category: category?.name || 'Unknown',
        });
      }

      return results;
    } catch (error: any) {
      console.error('[DataQuery] getRecurringExpenses error:', error);
      throw error;
    }
  }
}
