// Debt Repository - Manages debt database operations
import { v4 as uuidv4 } from 'uuid';
import { executeSql } from '../index';
import type { Debt, DebtInput, DebtStats } from '../../types/models';

export class DebtRepository {
    // ============================================
    // Create Debt
    // ============================================

    async create(data: DebtInput): Promise<Debt> {
        const id = uuidv4();
        const now = Date.now();

        const debt: Debt = {
            id,
            accountId: data.accountId,
            type: data.type,
            personName: data.personName,
            amount: data.amount,
            amountPaid: data.amountPaid || 0,
            dueDate: data.dueDate,
            status: (data.amountPaid || 0) >= data.amount ? 'paid' : (data.amountPaid || 0) > 0 ? 'partial' : 'pending',
            description: data.description || '',
            categoryId: data.categoryId,
            createdAt: now,
            updatedAt: now,
        };

        await executeSql(
            `INSERT INTO debts (
        id, account_id, type, person_name, amount, amount_paid,
        due_date, status, description, category_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                debt.id,
                debt.accountId,
                debt.type,
                debt.personName,
                debt.amount,
                debt.amountPaid,
                debt.dueDate,
                debt.status,
                debt.description,
                debt.categoryId || null,
                debt.createdAt,
                debt.updatedAt,
            ]
        );

        console.log('[DebtRepo] Debt created:', debt.id);
        return debt;
    }

    // ============================================
    // Find Debt by ID
    // ============================================

    async findById(id: string): Promise<Debt | null> {
        const rows = await executeSql<any>(
            'SELECT * FROM debts WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return null;
        }

        return this.mapRowToDebt(rows[0]);
    }

    // ============================================
    // Find Debts by Account
    // ============================================

    async findByAccount(accountId: string): Promise<Debt[]> {
        const rows = await executeSql<any>(
            `SELECT * FROM debts 
       WHERE account_id = ? 
       ORDER BY status ASC, due_date ASC`,
            [accountId]
        );

        return rows.map((row) => this.mapRowToDebt(row));
    }

    // ============================================
    // Get Debts by Type
    // ============================================

    async getDebtsByType(accountId: string, type: 'lent' | 'borrowed'): Promise<Debt[]> {
        const rows = await executeSql<any>(
            `SELECT * FROM debts 
       WHERE account_id = ? AND type = ?
       ORDER BY status ASC, due_date ASC`,
            [accountId, type]
        );

        return rows.map((row) => this.mapRowToDebt(row));
    }

    // ============================================
    // Get Pending Debts (not fully paid)
    // ============================================

    async getPendingDebts(accountId: string): Promise<Debt[]> {
        const rows = await executeSql<any>(
            `SELECT * FROM debts 
       WHERE account_id = ? AND status IN ('pending', 'partial')
       ORDER BY due_date ASC`,
            [accountId]
        );

        return rows.map((row) => this.mapRowToDebt(row));
    }

    // ============================================
    // Get Overdue Debts
    // ============================================

    async getOverdueDebts(accountId: string): Promise<Debt[]> {
        const now = Date.now();
        const rows = await executeSql<any>(
            `SELECT * FROM debts 
       WHERE account_id = ? 
       AND status IN ('pending', 'partial')
       AND due_date < ?
       ORDER BY due_date ASC`,
            [accountId, now]
        );

        return rows.map((row) => this.mapRowToDebt(row));
    }

    // ============================================
    // Update Debt
    // ============================================

    async update(id: string, updates: Partial<DebtInput>): Promise<void> {
        const now = Date.now();
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.personName !== undefined) {
            fields.push('person_name = ?');
            values.push(updates.personName);
        }

        if (updates.amount !== undefined) {
            fields.push('amount = ?');
            values.push(updates.amount);
        }

        if (updates.dueDate !== undefined) {
            fields.push('due_date = ?');
            values.push(updates.dueDate);
        }

        if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description);
        }

        if (updates.categoryId !== undefined) {
            fields.push('category_id = ?');
            values.push(updates.categoryId || null);
        }

        fields.push('updated_at = ?');
        values.push(now);

        values.push(id);

        await executeSql(
            `UPDATE debts SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        console.log('[DebtRepo] Debt updated:', id);
    }

    // ============================================
    // Record Payment
    // ============================================

    async recordPayment(id: string, paymentAmount: number): Promise<void> {
        const now = Date.now();

        // Get current debt
        const debt = await this.findById(id);
        if (!debt) {
            throw new Error('Debt not found');
        }

        const newAmountPaid = debt.amountPaid + paymentAmount;
        const newStatus = newAmountPaid >= debt.amount ? 'paid' : newAmountPaid > 0 ? 'partial' : 'pending';

        await executeSql(
            `UPDATE debts 
       SET amount_paid = ?, status = ?, updated_at = ? 
       WHERE id = ?`,
            [newAmountPaid, newStatus, now, id]
        );

        console.log('[DebtRepo] Payment recorded for debt:', id, paymentAmount);
    }

    // ============================================
    // Mark as Paid
    // ============================================

    async markAsPaid(id: string): Promise<void> {
        const now = Date.now();

        // Get current debt to set amount_paid to full amount
        const debt = await this.findById(id);
        if (!debt) {
            throw new Error('Debt not found');
        }

        await executeSql(
            `UPDATE debts 
       SET amount_paid = amount, status = 'paid', updated_at = ? 
       WHERE id = ?`,
            [now, id]
        );

        console.log('[DebtRepo] Debt marked as paid:', id);
    }

    // ============================================
    // Delete Debt
    // ============================================

    async delete(id: string): Promise<void> {
        await executeSql('DELETE FROM debts WHERE id = ?', [id]);
        console.log('[DebtRepo] Debt deleted:', id);
    }

    // ============================================
    // Get Debt Statistics
    // ============================================

    async getDebtStats(accountId: string): Promise<DebtStats> {
        const now = Date.now();

        // Get totals for lent money (owed to me)
        const lentRows = await executeSql<any>(
            `SELECT 
        SUM(CASE WHEN status IN ('pending', 'partial') THEN amount - amount_paid ELSE 0 END) as total_outstanding,
        SUM(amount_paid) as total_paid,
        COUNT(CASE WHEN status IN ('pending', 'partial') THEN 1 END) as pending_count
       FROM debts 
       WHERE account_id = ? AND type = 'lent'`,
            [accountId]
        );

        // Get totals for borrowed money (I owe)
        const borrowedRows = await executeSql<any>(
            `SELECT 
        SUM(CASE WHEN status IN ('pending', 'partial') THEN amount - amount_paid ELSE 0 END) as total_outstanding,
        SUM(amount_paid) as total_paid,
        COUNT(CASE WHEN status IN ('pending', 'partial') THEN 1 END) as pending_count
       FROM debts 
       WHERE account_id = ? AND type = 'borrowed'`,
            [accountId]
        );

        // Get overdue count
        const overdueRows = await executeSql<any>(
            `SELECT COUNT(*) as count
       FROM debts 
       WHERE account_id = ? 
       AND status IN ('pending', 'partial')
       AND due_date < ?`,
            [accountId, now]
        );

        const lentData = lentRows[0] || {};
        const borrowedData = borrowedRows[0] || {};
        const overdueData = overdueRows[0] || {};

        return {
            totalLent: lentData.total_outstanding || 0,
            totalBorrowed: borrowedData.total_outstanding || 0,
            totalLentPaid: lentData.total_paid || 0,
            totalBorrowedPaid: borrowedData.total_paid || 0,
            overdueCount: overdueData.count || 0,
            pendingLentCount: lentData.pending_count || 0,
            pendingBorrowedCount: borrowedData.pending_count || 0,
        };
    }

    // ============================================
    // Helper: Map Database Row to Debt
    // ============================================

    private mapRowToDebt(row: any): Debt {
        return {
            id: row.id,
            accountId: row.account_id,
            type: row.type,
            personName: row.person_name,
            amount: row.amount,
            amountPaid: row.amount_paid,
            dueDate: row.due_date,
            status: row.status,
            description: row.description || '',
            categoryId: row.category_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
