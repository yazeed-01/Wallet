// Subscription Repository - Manages subscription database operations
import { v4 as uuidv4 } from 'uuid';
import { executeSql } from '../index';
import type { Subscription, SubscriptionInput } from '../../types/models';

export class SubscriptionRepository {
  // ============================================
  // Create Subscription
  // ============================================

  async create(data: SubscriptionInput): Promise<Subscription> {
    const id = uuidv4();
    const now = Date.now();

    // Calculate next processing date
    const nextProcessing = this.calculateNextProcessing(data.billingDay);

    const subscription: Subscription = {
      id,
      accountId: data.accountId,
      name: data.name,
      amount: data.amount,
      categoryId: data.categoryId,
      billingDay: data.billingDay,
      isActive: data.isActive,
      vaultType: data.vaultType,
      lastProcessed: null,
      nextProcessing,
      createdAt: now,
      updatedAt: now,
    };

    await executeSql(
      `INSERT INTO subscriptions (
        id, account_id, name, amount, category_id, billing_day, is_active,
        vault_type, last_processed, next_processing, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subscription.id,
        subscription.accountId,
        subscription.name,
        subscription.amount,
        subscription.categoryId,
        subscription.billingDay,
        subscription.isActive ? 1 : 0,
        subscription.vaultType,
        subscription.lastProcessed,
        subscription.nextProcessing,
        subscription.createdAt,
        subscription.updatedAt,
      ]
    );

    console.log('[SubscriptionRepo] Subscription created:', subscription.name);
    return subscription;
  }

  // ============================================
  // Find Subscription by ID
  // ============================================

  async findById(id: string): Promise<Subscription | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM subscriptions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToSubscription(rows[0]);
  }

  // ============================================
  // Find Subscriptions by Account
  // ============================================

  async findByAccount(accountId: string): Promise<Subscription[]> {
    const rows = await executeSql<any>(
      'SELECT * FROM subscriptions WHERE account_id = ? ORDER BY is_active DESC, name ASC',
      [accountId]
    );

    return rows.map((row) => this.mapRowToSubscription(row));
  }

  // ============================================
  // Find Active Subscriptions by Account
  // ============================================

  async findActiveByAccount(accountId: string): Promise<Subscription[]> {
    const rows = await executeSql<any>(
      'SELECT * FROM subscriptions WHERE account_id = ? AND is_active = 1 ORDER BY name ASC',
      [accountId]
    );

    return rows.map((row) => this.mapRowToSubscription(row));
  }

  // ============================================
  // Find Due Subscriptions
  // ============================================

  async findDueSubscriptions(): Promise<Subscription[]> {
    const now = Date.now();

    const rows = await executeSql<any>(
      'SELECT * FROM subscriptions WHERE is_active = 1 AND next_processing <= ?',
      [now]
    );

    return rows.map((row) => this.mapRowToSubscription(row));
  }

  // ============================================
  // Update Subscription
  // ============================================

  async update(id: string, updates: Partial<Subscription>): Promise<void> {
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

    if (updates.billingDay !== undefined) {
      fields.push('billing_day = ?');
      values.push(updates.billingDay);

      // Recalculate next processing
      const nextProcessing = this.calculateNextProcessing(updates.billingDay);
      fields.push('next_processing = ?');
      values.push(nextProcessing);
    }

    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    if (updates.vaultType !== undefined) {
      fields.push('vault_type = ?');
      values.push(updates.vaultType);
    }

    if (updates.lastProcessed !== undefined) {
      fields.push('last_processed = ?');
      values.push(updates.lastProcessed);
    }

    if (updates.nextProcessing !== undefined) {
      fields.push('next_processing = ?');
      values.push(updates.nextProcessing);
    }

    fields.push('updated_at = ?');
    values.push(now);

    values.push(id);

    await executeSql(
      `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[SubscriptionRepo] Subscription updated:', id);
  }

  // ============================================
  // Delete Subscription
  // ============================================

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM subscriptions WHERE id = ?', [id]);
    console.log('[SubscriptionRepo] Subscription deleted:', id);
  }

  // ============================================
  // Mark as Processed
  // ============================================

  async markAsProcessed(id: string): Promise<void> {
    const subscription = await this.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const now = Date.now();
    const nextProcessing = this.calculateNextProcessing(subscription.billingDay);

    await this.update(id, {
      lastProcessed: now,
      nextProcessing,
    });

    console.log('[SubscriptionRepo] Subscription marked as processed:', id);
  }

  // ============================================
  // Find Due Subscriptions (for today)
  // ============================================

  async findDue(): Promise<Subscription[]> {
    const now = Date.now();
    const rows = await executeSql<any>(
      'SELECT * FROM subscriptions WHERE is_active = 1 AND next_processing <= ? ORDER BY name ASC',
      [now]
    );

    return rows.map((row) => this.mapRowToSubscription(row));
  }

  // ============================================
  // Find Overdue Subscriptions (missed)
  // ============================================

  async findOverdue(): Promise<Subscription[]> {
    const now = Date.now();
    const rows = await executeSql<any>(
      'SELECT * FROM subscriptions WHERE is_active = 1 AND next_processing < ? ORDER BY next_processing ASC',
      [now]
    );

    return rows.map((row) => this.mapRowToSubscription(row));
  }

  // ============================================
  // Helper: Calculate Next Processing Date
  // ============================================

  private calculateNextProcessing(billingDay: number): number {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let targetMonth = currentMonth;
    let targetYear = currentYear;

    // If billing day has passed this month, schedule for next month
    if (currentDay >= billingDay) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    // Handle months with fewer days
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const effectiveDay = Math.min(billingDay, daysInTargetMonth);

    const nextDate = new Date(targetYear, targetMonth, effectiveDay, 0, 0, 0, 0);
    return nextDate.getTime();
  }

  // ============================================
  // Helper: Map Database Row to Subscription
  // ============================================

  private mapRowToSubscription(row: any): Subscription {
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      amount: row.amount,
      categoryId: row.category_id,
      billingDay: row.billing_day,
      isActive: row.is_active === 1,
      vaultType: row.vault_type,
      lastProcessed: row.last_processed,
      nextProcessing: row.next_processing,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
