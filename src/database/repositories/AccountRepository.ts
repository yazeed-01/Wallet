// Account Repository - Manages account database operations
import { v4 as uuidv4 } from 'uuid';
import { executeSql } from '../index';
import type { Account } from '../../types/models';

export class AccountRepository {
  // ============================================
  // Create Account
  // ============================================

  async create(data: {
    userId: string;
    name: string;
    currency: string;
    icon: string;
    color: string;
    isDefault: boolean;
  }): Promise<Account> {
    const id = uuidv4();
    const now = Date.now();

    const account: Account = {
      id,
      userId: data.userId,
      name: data.name,
      currency: data.currency,
      icon: data.icon,
      color: data.color,
      isDefault: data.isDefault,
      createdAt: now,
      updatedAt: now,
    };

    // If this is the default account, unset other defaults
    if (account.isDefault) {
      await executeSql(
        'UPDATE accounts SET is_default = 0 WHERE user_id = ?',
        [account.userId]
      );
    }

    await executeSql(
      `INSERT INTO accounts (id, user_id, name, currency, icon, color, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.userId,
        account.name,
        account.currency,
        account.icon,
        account.color,
        account.isDefault ? 1 : 0,
        account.createdAt,
        account.updatedAt,
      ]
    );

    console.log('[AccountRepo] Account created:', account.name);
    return account;
  }

  // ============================================
  // Find Account by ID
  // ============================================

  async findById(id: string): Promise<Account | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM accounts WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToAccount(rows[0]);
  }

  // ============================================
  // Find All Accounts by User
  // ============================================

  async findByUser(userId: string): Promise<Account[]> {
    const rows = await executeSql<any>(
      'SELECT * FROM accounts WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
      [userId]
    );

    return rows.map((row) => this.mapRowToAccount(row));
  }

  // ============================================
  // Find Default Account by User
  // ============================================

  async findDefaultByUser(userId: string): Promise<Account | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM accounts WHERE user_id = ? AND is_default = 1',
      [userId]
    );

    if (rows.length === 0) {
      // If no default, return first account
      const allAccounts = await this.findByUser(userId);
      return allAccounts[0] || null;
    }

    return this.mapRowToAccount(rows[0]);
  }

  // ============================================
  // Update Account
  // ============================================

  async update(id: string, updates: Partial<Account>): Promise<void> {
    const now = Date.now();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.currency !== undefined) {
      fields.push('currency = ?');
      values.push(updates.currency);
    }

    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }

    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }

    if (updates.isDefault !== undefined) {
      fields.push('is_default = ?');
      values.push(updates.isDefault ? 1 : 0);

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        const account = await this.findById(id);
        if (account) {
          await executeSql(
            'UPDATE accounts SET is_default = 0 WHERE user_id = ? AND id != ?',
            [account.userId, id]
          );
        }
      }
    }

    fields.push('updated_at = ?');
    values.push(now);

    values.push(id);

    await executeSql(
      `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[AccountRepo] Account updated:', id);
  }

  // ============================================
  // Delete Account
  // ============================================

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM accounts WHERE id = ?', [id]);
    console.log('[AccountRepo] Account deleted:', id);
  }

  // ============================================
  // Helper: Map Database Row to Account
  // ============================================

  private mapRowToAccount(row: any): Account {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      currency: row.currency,
      icon: row.icon,
      color: row.color,
      isDefault: row.is_default === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
