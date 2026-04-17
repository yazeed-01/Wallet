// Recurring Expense Repository - Manages recurring expense database operations
import { v4 as uuidv4 } from 'uuid';
import { executeSql } from '../index';
import type {
  RecurringExpense,
  RecurringExpenseInput,
  RecurringFrequency,
} from '../../types/models';

export class RecurringExpenseRepository {
  // ============================================
  // Create Recurring Expense
  // ============================================

  async create(data: RecurringExpenseInput): Promise<RecurringExpense> {
    const id = uuidv4();
    const now = Date.now();

    const recurringExpense: RecurringExpense = {
      id,
      accountId: data.accountId,
      name: data.name,
      amount: data.amount,
      categoryId: data.categoryId,
      frequency: data.frequency,
      interval: data.interval,
      nextOccurrence: data.nextOccurrence,
      vaultType: data.vaultType,
      isActive: data.isActive,
      autoDeduct: data.autoDeduct,
      lastProcessed: null,
      createdAt: now,
      updatedAt: now,
    };

    await executeSql(
      `INSERT INTO recurring_expenses (
        id, account_id, name, amount, category_id, frequency, interval,
        next_occurrence, vault_type, is_active, auto_deduct, last_processed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recurringExpense.id,
        recurringExpense.accountId,
        recurringExpense.name,
        recurringExpense.amount,
        recurringExpense.categoryId,
        recurringExpense.frequency,
        recurringExpense.interval,
        recurringExpense.nextOccurrence,
        recurringExpense.vaultType,
        recurringExpense.isActive ? 1 : 0,
        recurringExpense.autoDeduct ? 1 : 0,
        recurringExpense.lastProcessed,
        recurringExpense.createdAt,
        recurringExpense.updatedAt,
      ]
    );

    console.log('[RecurringExpenseRepo] Recurring expense created:', recurringExpense.name);
    return recurringExpense;
  }

  // ============================================
  // Find Recurring Expense by ID
  // ============================================

  async findById(id: string): Promise<RecurringExpense | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM recurring_expenses WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToRecurringExpense(rows[0]);
  }

  // ============================================
  // Find Recurring Expenses by Account
  // ============================================

  async findByAccount(accountId: string): Promise<RecurringExpense[]> {
    const rows = await executeSql<any>(
      'SELECT * FROM recurring_expenses WHERE account_id = ? ORDER BY is_active DESC, name ASC',
      [accountId]
    );

    return rows.map((row) => this.mapRowToRecurringExpense(row));
  }

  // ============================================
  // Find Active Recurring Expenses by Account
  // ============================================

  async findActiveByAccount(accountId: string): Promise<RecurringExpense[]> {
    const rows = await executeSql<any>(
      'SELECT * FROM recurring_expenses WHERE account_id = ? AND is_active = 1 ORDER BY name ASC',
      [accountId]
    );

    return rows.map((row) => this.mapRowToRecurringExpense(row));
  }

  // ============================================
  // Find Due Recurring Expenses
  // ============================================

  async findDue(): Promise<RecurringExpense[]> {
    const now = Date.now();

    const rows = await executeSql<any>(
      'SELECT * FROM recurring_expenses WHERE is_active = 1 AND next_occurrence <= ?',
      [now]
    );

    return rows.map((row) => this.mapRowToRecurringExpense(row));
  }

  // ============================================
  // Find Overdue Recurring Expenses
  // ============================================

  async findOverdue(): Promise<RecurringExpense[]> {
    const now = Date.now();

    const rows = await executeSql<any>(
      'SELECT * FROM recurring_expenses WHERE is_active = 1 AND next_occurrence < ?',
      [now]
    );

    return rows.map((row) => this.mapRowToRecurringExpense(row));
  }

  // ============================================
  // Update Recurring Expense
  // ============================================

  async update(id: string, updates: Partial<RecurringExpense>): Promise<void> {
    const now = Date.now();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }

    if (updates.categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(updates.categoryId);
    }

    if (updates.frequency !== undefined) {
      fields.push('frequency = ?');
      values.push(updates.frequency);
    }

    if (updates.interval !== undefined) {
      fields.push('interval = ?');
      values.push(updates.interval);
    }

    if (updates.nextOccurrence !== undefined) {
      fields.push('next_occurrence = ?');
      values.push(updates.nextOccurrence);
    }

    if (updates.vaultType !== undefined) {
      fields.push('vault_type = ?');
      values.push(updates.vaultType);
    }

    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    if (updates.autoDeduct !== undefined) {
      fields.push('auto_deduct = ?');
      values.push(updates.autoDeduct ? 1 : 0);
    }

    if (updates.lastProcessed !== undefined) {
      fields.push('last_processed = ?');
      values.push(updates.lastProcessed);
    }

    fields.push('updated_at = ?');
    values.push(now);

    values.push(id);

    await executeSql(
      `UPDATE recurring_expenses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[RecurringExpenseRepo] Recurring expense updated:', id);
  }

  // ============================================
  // Delete Recurring Expense
  // ============================================

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM recurring_expenses WHERE id = ?', [id]);
    console.log('[RecurringExpenseRepo] Recurring expense deleted:', id);
  }

  // ============================================
  // Mark as Processed
  // ============================================

  async markAsProcessed(id: string): Promise<void> {
    const expense = await this.findById(id);
    if (!expense) {
      throw new Error('Recurring expense not found');
    }

    const now = Date.now();
    const nextOccurrence = this.calculateNextOccurrence(
      expense.nextOccurrence,
      expense.frequency,
      expense.interval
    );

    await this.update(id, {
      lastProcessed: now,
      nextOccurrence,
    });

    console.log('[RecurringExpenseRepo] Recurring expense marked as processed:', id);
  }

  // ============================================
  // Helper: Calculate Next Occurrence
  // ============================================

  private calculateNextOccurrence(
    currentOccurrence: number,
    frequency: RecurringFrequency,
    interval: number
  ): number {
    const currentDate = new Date(currentOccurrence);

    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;

      case 'weekly':
        currentDate.setDate(currentDate.getDate() + interval * 7);
        break;

      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;

      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
    }

    return currentDate.getTime();
  }

  // ============================================
  // Helper: Map Database Row to Recurring Expense
  // ============================================

  private mapRowToRecurringExpense(row: any): RecurringExpense {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      amount: row.amount,
      categoryId: row.category_id,
      frequency: row.frequency,
      interval: row.interval,
      nextOccurrence: row.next_occurrence,
      vaultType: row.vault_type,
      isActive: row.is_active === 1,
      autoDeduct: row.auto_deduct === 1,
      lastProcessed: row.last_processed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
