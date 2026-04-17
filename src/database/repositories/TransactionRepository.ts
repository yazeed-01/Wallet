// Transaction Repository - Manages transaction database operations
import { v4 as uuidv4 } from 'uuid';
import { executeSql } from '../index';
import type { Transaction, TransactionInput } from '../../types/models';
import { deleteTransactionImage } from '../../utils/imageStorage';

export class TransactionRepository {
  // ============================================
  // Create Transaction
  // ============================================

  async create(data: TransactionInput): Promise<Transaction> {
    const id = uuidv4();
    const now = Date.now();

    const transaction: Transaction = {
      id,
      accountId: data.accountId,
      type: data.type,
      amount: data.amount,
      categoryId: data.categoryId,
      description: data.description || '',
      date: data.date,
      vaultType: data.vaultType,
      isRecurring: data.isRecurring || false,
      recurringExpenseId: data.recurringExpenseId,
      subscriptionId: data.subscriptionId,
      imagePath: data.imagePath,
      currency: data.currency || 'USD',
      originalAmount: data.originalAmount,
      exchangeRate: data.exchangeRate,
      convertedAmount: data.convertedAmount,
      createdAt: now,
      updatedAt: now,
    };

    await executeSql(
      `INSERT INTO transactions (
        id, account_id, type, amount, category_id, description, date,
        vault_type, is_recurring, recurring_expense_id, subscription_id,
        image_path, currency, original_amount, exchange_rate, converted_amount,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.accountId,
        transaction.type,
        transaction.amount,
        transaction.categoryId,
        transaction.description,
        transaction.date,
        transaction.vaultType,
        transaction.isRecurring ? 1 : 0,
        transaction.recurringExpenseId || null,
        transaction.subscriptionId || null,
        transaction.imagePath || null,
        transaction.currency,
        transaction.originalAmount || null,
        transaction.exchangeRate || null,
        transaction.convertedAmount || null,
        transaction.createdAt,
        transaction.updatedAt,
      ]
    );

    console.log('[TransactionRepo] Transaction created:', transaction.id);
    return transaction;
  }

  // ============================================
  // Find Transaction by ID
  // ============================================

  async findById(id: string): Promise<Transaction | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const tx = this.mapRowToTransaction(rows[0]);
    tx.images = await this.getImages(id);
    return tx;
  }

  // ============================================
  // Find Transactions by Account
  // ============================================

  async findByAccount(
    accountId: string,
    limit?: number
  ): Promise<Transaction[]> {
    const sql = limit
      ? 'SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC, created_at DESC LIMIT ?'
      : 'SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC, created_at DESC';

    const params = limit ? [accountId, limit] : [accountId];

    const rows = await executeSql<any>(sql, params);

    return rows.map((row) => this.mapRowToTransaction(row));
  }

  // ============================================
  // Find Transactions by Date Range
  // ============================================

  async findByDateRange(
    accountId: string,
    startDate: number,
    endDate: number
  ): Promise<Transaction[]> {
    const rows = await executeSql<any>(
      `SELECT * FROM transactions
       WHERE account_id = ? AND date >= ? AND date <= ?
       ORDER BY date DESC, created_at DESC`,
      [accountId, startDate, endDate]
    );

    return rows.map((row) => this.mapRowToTransaction(row));
  }

  // ============================================
  // Find Transactions by Category
  // ============================================

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    const rows = await executeSql<any>(
      'SELECT * FROM transactions WHERE category_id = ? ORDER BY date DESC',
      [categoryId]
    );

    return rows.map((row) => this.mapRowToTransaction(row));
  }

  // ============================================
  // Update Transaction
  // ============================================

  async update(id: string, updates: Partial<Transaction>): Promise<void> {
    const now = Date.now();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }

    if (updates.categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(updates.categoryId);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }

    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }

    if (updates.vaultType !== undefined) {
      fields.push('vault_type = ?');
      values.push(updates.vaultType);
    }

    if (updates.imagePath !== undefined) {
      fields.push('image_path = ?');
      values.push(updates.imagePath);
    }

    if (updates.currency !== undefined) {
      fields.push('currency = ?');
      values.push(updates.currency);
    }

    if (updates.originalAmount !== undefined) {
      fields.push('original_amount = ?');
      values.push(updates.originalAmount);
    }

    if (updates.exchangeRate !== undefined) {
      fields.push('exchange_rate = ?');
      values.push(updates.exchangeRate);
    }

    if (updates.convertedAmount !== undefined) {
      fields.push('converted_amount = ?');
      values.push(updates.convertedAmount);
    }

    fields.push('updated_at = ?');
    values.push(now);

    values.push(id);

    await executeSql(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[TransactionRepo] Transaction updated:', id);
  }

  // ============================================
  // Delete Transaction
  // ============================================

  async delete(id: string): Promise<void> {
    // Delete associated image if exists
    await deleteTransactionImage(id);

    await executeSql('DELETE FROM transactions WHERE id = ?', [id]);
    console.log('[TransactionRepo] Transaction deleted:', id);
  }

  // ============================================
  // Get Monthly Stats
  // ============================================

  async getMonthlyStats(
    accountId: string,
    year: number,
    month: number
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    netChange: number;
    transactionCount: number;
  }> {
    // Get start and end of month
    const startDate = new Date(year, month - 1, 1).getTime();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    const rows = await executeSql<any>(
      `SELECT
        SUM(CASE WHEN type = 'income' THEN COALESCE(converted_amount, amount) ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN COALESCE(converted_amount, amount) ELSE 0 END) as total_expense,
        COUNT(*) as transaction_count
       FROM transactions
       WHERE account_id = ? AND date >= ? AND date <= ?`,
      [accountId, startDate, endDate]
    );

    const row = rows[0];
    const totalIncome = row.total_income || 0;
    const totalExpense = row.total_expense || 0;

    return {
      totalIncome,
      totalExpense,
      netChange: totalIncome - totalExpense,
      transactionCount: row.transaction_count || 0,
    };
  }

  // ============================================
  // Get Category Breakdown
  // ============================================

  async getCategoryBreakdown(
    accountId: string,
    startDate: number,
    endDate: number,
    type: 'income' | 'expense'
  ): Promise<
    Array<{
      categoryId: string;
      totalAmount: number;
      transactionCount: number;
    }>
  > {
    const rows = await executeSql<any>(
      `SELECT
        category_id,
        SUM(COALESCE(converted_amount, amount)) as total_amount,
        COUNT(*) as transaction_count
       FROM transactions
       WHERE account_id = ? AND type = ? AND date >= ? AND date <= ?
       GROUP BY category_id
       ORDER BY total_amount DESC`,
      [accountId, type, startDate, endDate]
    );

    return rows.map((row) => ({
      categoryId: row.category_id,
      totalAmount: row.total_amount,
      transactionCount: row.transaction_count,
    }));
  }

  // ============================================
  // Helper: Map Database Row to Transaction
  // ============================================

  async getImages(transactionId: string): Promise<string[]> {
    try {
      const rows = await executeSql<any>(
        'SELECT image_path FROM transaction_images WHERE transaction_id = ? ORDER BY sort_order ASC',
        [transactionId]
      );
      return rows.map((r: any) => r.image_path as string);
    } catch {
      return [];
    }
  }

  async addImage(transactionId: string, imagePath: string, sortOrder: number): Promise<void> {
    const id = uuidv4();
    await executeSql(
      'INSERT INTO transaction_images (id, transaction_id, image_path, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, transactionId, imagePath, sortOrder, Date.now()]
    );
  }

  async deleteImages(transactionId: string): Promise<void> {
    await executeSql('DELETE FROM transaction_images WHERE transaction_id = ?', [transactionId]);
  }

  private mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      accountId: row.account_id,
      type: row.type,
      amount: row.amount,
      categoryId: row.category_id,
      description: row.description,
      date: row.date,
      vaultType: row.vault_type,
      isRecurring: row.is_recurring === 1,
      recurringExpenseId: row.recurring_expense_id,
      subscriptionId: row.subscription_id,
      imagePath: row.image_path,
      currency: row.currency || 'USD',
      originalAmount: row.original_amount,
      exchangeRate: row.exchange_rate,
      convertedAmount: row.converted_amount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
