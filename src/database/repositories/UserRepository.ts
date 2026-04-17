// User Repository - Manages user database operations
import { v4 as uuidv4 } from 'uuid';
import { executeSql } from '../index';
import type { User } from '../../types/models';

export class UserRepository {
  // ============================================
  // Create User
  // ============================================

  async create(data: {
    email: string;
    passwordHash: string;
    name: string;
  }): Promise<User> {
    const id = uuidv4();
    const now = Date.now();

    const user: User = {
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      createdAt: now,
      updatedAt: now,
    };

    await executeSql(
      `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, user.email, user.passwordHash, user.name, user.createdAt, user.updatedAt]
    );

    console.log('[UserRepo] User created:', user.email);
    return user;
  }

  // ============================================
  // Find User by ID
  // ============================================

  async findById(id: string): Promise<User | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(rows[0]);
  }

  // ============================================
  // Find User by Email
  // ============================================

  async findByEmail(email: string): Promise<User | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(rows[0]);
  }

  // ============================================
  // Update User
  // ============================================

  async update(id: string, updates: Partial<User>): Promise<void> {
    const now = Date.now();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }

    if (updates.passwordHash !== undefined) {
      fields.push('password_hash = ?');
      values.push(updates.passwordHash);
    }

    fields.push('updated_at = ?');
    values.push(now);

    values.push(id);

    await executeSql(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[UserRepo] User updated:', id);
  }

  // ============================================
  // Delete User
  // ============================================

  async delete(id: string): Promise<void> {
    await executeSql('DELETE FROM users WHERE id = ?', [id]);
    console.log('[UserRepo] User deleted:', id);
  }

  // ============================================
  // Helper: Map Database Row to User
  // ============================================

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
