// Category Repository - Manages category database operations
import { v4 as uuidv4 } from 'uuid';
import { executeSql } from '../index';
import type { Category, CategoryType } from '../../types/models';

// ============================================
// Default Categories Data
// ============================================

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: 'food', color: '#FF6B6B' },
  { name: 'Transportation', icon: 'car', color: '#4ECDC4' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#FFE66D' },
  { name: 'Entertainment', icon: 'movie', color: '#A8E6CF' },
  { name: 'Bills & Utilities', icon: 'receipt', color: '#FF8B94' },
  { name: 'Healthcare', icon: 'medical-bag', color: '#B4A7D6' },
  { name: 'Education', icon: 'school', color: '#89CFF0' },
  { name: 'Other', icon: 'dots-horizontal', color: '#C7CEEA' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'briefcase', color: '#06D6A0' },
  { name: 'Freelance', icon: 'laptop', color: '#118AB2' },
  { name: 'Investment', icon: 'trending-up', color: '#FFD166' },
  { name: 'Gift', icon: 'gift', color: '#EF476F' },
  { name: 'Other', icon: 'cash', color: '#26547C' },
];

// ============================================
// Category Repository
// ============================================

export class CategoryRepository {
  // ============================================
  // Create Category
  // ============================================

  async create(data: {
    userId: string;
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
    isDefault?: boolean;
  }): Promise<Category> {
    const id = uuidv4();
    const now = Date.now();

    const category: Category = {
      id,
      userId: data.userId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      isDefault: data.isDefault || false,
      createdAt: now,
    };

    await executeSql(
      `INSERT INTO categories (id, user_id, name, type, icon, color, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.id,
        category.userId,
        category.name,
        category.type,
        category.icon,
        category.color,
        category.isDefault ? 1 : 0,
        category.createdAt,
      ]
    );

    console.log('[CategoryRepo] Category created:', category.name);
    return category;
  }

  // ============================================
  // Find Category by ID
  // ============================================

  async findById(id: string): Promise<Category | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToCategory(rows[0]);
  }

  // ============================================
  // Find All Categories by User
  // ============================================

  async findByUser(userId: string): Promise<Category[]> {
    const rows = await executeSql<any>(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, name ASC',
      [userId]
    );

    return rows.map((row) => this.mapRowToCategory(row));
  }

  // ============================================
  // Find Categories by Type
  // ============================================

  async findByUserAndType(
    userId: string,
    type: CategoryType
  ): Promise<Category[]> {
    const rows = await executeSql<any>(
      'SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY is_default DESC, name ASC',
      [userId, type]
    );

    return rows.map((row) => this.mapRowToCategory(row));
  }

  // ============================================
  // Update Category
  // ============================================

  async update(id: string, updates: Partial<Category>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }

    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);

    await executeSql(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    console.log('[CategoryRepo] Category updated:', id);
  }

  // ============================================
  // Delete Category
  // ============================================

  async delete(id: string): Promise<void> {
    // Check if category is default
    const category = await this.findById(id);
    if (category?.isDefault) {
      throw new Error('Cannot delete default category');
    }

    await executeSql('DELETE FROM categories WHERE id = ?', [id]);
    console.log('[CategoryRepo] Category deleted:', id);
  }

  // ============================================
  // Find Salary Category
  // ============================================

  async findSalaryCategory(userId: string): Promise<Category | null> {
    const rows = await executeSql<any>(
      'SELECT * FROM categories WHERE user_id = ? AND type = ? AND name = ?',
      [userId, 'income', 'Salary']
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToCategory(rows[0]);
  }

  // ============================================
  // Helper: Map Database Row to Category
  // ============================================

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      color: row.color,
      isDefault: row.is_default === 1,
      createdAt: row.created_at,
    };
  }
}

// ============================================
// Create Default Categories for New User
// ============================================

export async function createDefaultCategories(userId: string): Promise<void> {
  const repo = new CategoryRepository();

  console.log('[CategoryRepo] Creating default categories for user:', userId);

  // Create expense categories
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    await repo.create({
      userId,
      name: cat.name,
      type: 'expense',
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
    });
  }

  // Create income categories
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    await repo.create({
      userId,
      name: cat.name,
      type: 'income',
      icon: cat.icon,
      color: cat.color,
      isDefault: true,
    });
  }

  console.log('[CategoryRepo] Default categories created successfully');
}
