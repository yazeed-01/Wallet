// Goal Repository - Manages goal database operations
import { v4 as uuidv4 } from 'uuid';
import { executeSql } from '../index';
import type { Goal, GoalInput } from '../../types/models';

export class GoalRepository {
    // ============================================
    // Create Goal
    // ============================================

    async create(data: GoalInput): Promise<Goal> {
        const id = uuidv4();
        const now = Date.now();

        const goal: Goal = {
            id,
            accountId: data.accountId,
            name: data.name,
            targetAmount: data.targetAmount,
            currentAmount: data.currentAmount || 0,
            fundingSource: data.fundingSource,
            icon: data.icon,
            color: data.color,
            isCompleted: false,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
        };

        await executeSql(
            `INSERT INTO goals (
        id, account_id, name, target_amount, current_amount,
        funding_source, icon, color, is_completed, completed_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                goal.id,
                goal.accountId,
                goal.name,
                goal.targetAmount,
                goal.currentAmount,
                goal.fundingSource,
                goal.icon,
                goal.color,
                goal.isCompleted ? 1 : 0,
                goal.completedAt,
                goal.createdAt,
                goal.updatedAt,
            ]
        );

        console.log('[GoalRepo] Goal created:', goal.id);
        return goal;
    }

    // ============================================
    // Find Goal by ID
    // ============================================

    async findById(id: string): Promise<Goal | null> {
        const rows = await executeSql<any>(
            'SELECT * FROM goals WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return null;
        }

        return this.mapRowToGoal(rows[0]);
    }

    // ============================================
    // Find Goals by Account
    // ============================================

    async findByAccount(accountId: string): Promise<Goal[]> {
        const rows = await executeSql<any>(
            `SELECT * FROM goals 
       WHERE account_id = ? 
       ORDER BY is_completed ASC, created_at DESC`,
            [accountId]
        );

        return rows.map((row) => this.mapRowToGoal(row));
    }

    // ============================================
    // Get Active Goals
    // ============================================

    async getActiveGoals(accountId: string): Promise<Goal[]> {
        const rows = await executeSql<any>(
            `SELECT * FROM goals 
       WHERE account_id = ? AND is_completed = 0 
       ORDER BY created_at DESC`,
            [accountId]
        );

        return rows.map((row) => this.mapRowToGoal(row));
    }

    // ============================================
    // Get Completed Goals
    // ============================================

    async getCompletedGoals(accountId: string): Promise<Goal[]> {
        const rows = await executeSql<any>(
            `SELECT * FROM goals 
       WHERE account_id = ? AND is_completed = 1 
       ORDER BY completed_at DESC`,
            [accountId]
        );

        return rows.map((row) => this.mapRowToGoal(row));
    }

    // ============================================
    // Update Goal
    // ============================================

    async update(id: string, updates: Partial<GoalInput>): Promise<void> {
        const now = Date.now();
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }

        if (updates.targetAmount !== undefined) {
            fields.push('target_amount = ?');
            values.push(updates.targetAmount);
        }

        if (updates.fundingSource !== undefined) {
            fields.push('funding_source = ?');
            values.push(updates.fundingSource);
        }

        if (updates.icon !== undefined) {
            fields.push('icon = ?');
            values.push(updates.icon);
        }

        if (updates.color !== undefined) {
            fields.push('color = ?');
            values.push(updates.color);
        }

        fields.push('updated_at = ?');
        values.push(now);

        values.push(id);

        await executeSql(
            `UPDATE goals SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        console.log('[GoalRepo] Goal updated:', id);
    }

    // ============================================
    // Update Goal Progress
    // ============================================

    async updateProgress(id: string, currentAmount: number): Promise<void> {
        const now = Date.now();

        await executeSql(
            `UPDATE goals 
       SET current_amount = ?, updated_at = ? 
       WHERE id = ?`,
            [currentAmount, now, id]
        );

        console.log('[GoalRepo] Goal progress updated:', id, currentAmount);
    }

    // ============================================
    // Mark Goal as Completed
    // ============================================

    async markCompleted(id: string): Promise<void> {
        const now = Date.now();

        await executeSql(
            `UPDATE goals 
       SET is_completed = 1, completed_at = ?, updated_at = ? 
       WHERE id = ?`,
            [now, now, id]
        );

        console.log('[GoalRepo] Goal marked as completed:', id);
    }

    // ============================================
    // Reopen Goal (unmark as completed)
    // ============================================

    async reopenGoal(id: string): Promise<void> {
        const now = Date.now();

        await executeSql(
            `UPDATE goals 
       SET is_completed = 0, completed_at = NULL, updated_at = ? 
       WHERE id = ?`,
            [now, id]
        );

        console.log('[GoalRepo] Goal reopened:', id);
    }

    // ============================================
    // Delete Goal
    // ============================================

    async delete(id: string): Promise<void> {
        await executeSql('DELETE FROM goals WHERE id = ?', [id]);
        console.log('[GoalRepo] Goal deleted:', id);
    }

    // ============================================
    // Get Goals Count
    // ============================================

    async getGoalsCount(accountId: string): Promise<{
        total: number;
        active: number;
        completed: number;
    }> {
        const rows = await executeSql<any>(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
       FROM goals 
       WHERE account_id = ?`,
            [accountId]
        );

        const row = rows[0];
        return {
            total: row.total || 0,
            active: row.active || 0,
            completed: row.completed || 0,
        };
    }

    // ============================================
    // Helper: Map Database Row to Goal
    // ============================================

    private mapRowToGoal(row: any): Goal {
        return {
            id: row.id,
            accountId: row.account_id,
            name: row.name,
            targetAmount: row.target_amount,
            currentAmount: row.current_amount,
            fundingSource: row.funding_source,
            icon: row.icon,
            color: row.color,
            isCompleted: row.is_completed === 1,
            completedAt: row.completed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
