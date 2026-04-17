/**
 * Purpose: Track and log all AI-initiated CRUD operations for audit trail
 *
 * Inputs:
 *   - accountId (string): Current user's account ID
 *
 * Outputs:
 *   - Returns (AIAuditService): Service instance with audit methods
 *
 * Side effects:
 *   - Logs audit entries to console
 *   - Stores audit entries in memory (can be persisted to DB later)
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  AuditLogEntry,
  PendingAction,
  ActionResult,
  MutationType,
  EntityType,
} from '../../types/aiMutations';

export class AIAuditService {
  private accountId: string;
  private auditLogs: AuditLogEntry[];

  constructor(accountId: string) {
    this.accountId = accountId;
    this.auditLogs = [];
  }

  /**
   * Log a successful operation
   */
  logSuccess(
    action: PendingAction,
    result: ActionResult,
    previousState?: Record<string, any>
  ): string {
    const auditLogId = uuidv4() as string;

    const entry: AuditLogEntry = {
      id: auditLogId,
      timestamp: Date.now(),
      accountId: this.accountId,
      action: action.type,
      entityType: action.entityType,
      entityId: result.entityId || null,
      functionName: action.functionName,
      initiator: 'ai_assistant',
      parameters: action.parameters,
      result: 'success',
      resultData: {
        actionId: result.actionId,
        entityId: result.entityId,
      },
      previousState,
    };

    this.auditLogs.push(entry);
    console.log('[AIAuditService] Success logged:', auditLogId, action.summary);

    // TODO: Persist to database if needed
    // this.persistToDatabase(entry);

    return auditLogId;
  }

  /**
   * Log a failed operation
   */
  logFailure(action: PendingAction, error: Error): string {
    const auditLogId = uuidv4() as string;

    const entry: AuditLogEntry = {
      id: auditLogId,
      timestamp: Date.now(),
      accountId: this.accountId,
      action: action.type,
      entityType: action.entityType,
      entityId: null,
      functionName: action.functionName,
      initiator: 'ai_assistant',
      parameters: action.parameters,
      result: 'failure',
      errorMessage: error.message,
    };

    this.auditLogs.push(entry);
    console.error('[AIAuditService] Failure logged:', auditLogId, error.message);

    // TODO: Persist to database if needed
    // this.persistToDatabase(entry);

    return auditLogId;
  }

  /**
   * Log a cancelled operation
   */
  logCancellation(action: PendingAction): string {
    const auditLogId = uuidv4() as string;

    const entry: AuditLogEntry = {
      id: auditLogId,
      timestamp: Date.now(),
      accountId: this.accountId,
      action: action.type,
      entityType: action.entityType,
      entityId: null,
      functionName: action.functionName,
      initiator: 'ai_assistant',
      parameters: action.parameters,
      result: 'failure',
      errorMessage: 'User cancelled action',
    };

    this.auditLogs.push(entry);
    console.log('[AIAuditService] Cancellation logged:', auditLogId);

    return auditLogId;
  }

  /**
   * Get all audit logs for this account
   */
  getAllLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  /**
   * Get audit logs by date range
   */
  getLogsByDateRange(startDate: number, endDate: number): AuditLogEntry[] {
    return this.auditLogs.filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * Get audit logs by entity type
   */
  getLogsByEntity(entityType: EntityType, entityId: string): AuditLogEntry[] {
    return this.auditLogs.filter(
      (log) => log.entityType === entityType && log.entityId === entityId
    );
  }

  /**
   * Get recent audit logs (last N entries)
   */
  getRecentLogs(limit: number = 10): AuditLogEntry[] {
    return this.auditLogs.slice(-limit);
  }

  /**
   * Clear old audit logs (older than specified days)
   */
  clearOldLogs(daysToKeep: number = 30): void {
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    this.auditLogs = this.auditLogs.filter((log) => log.timestamp >= cutoffTime);
    console.log('[AIAuditService] Cleared logs older than', daysToKeep, 'days');
  }

  /**
   * Get statistics about AI operations
   */
  getStatistics(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    byEntityType: Record<EntityType, number>;
    byActionType: Record<MutationType, number>;
  } {
    const stats = {
      totalOperations: this.auditLogs.length,
      successfulOperations: this.auditLogs.filter((log) => log.result === 'success')
        .length,
      failedOperations: this.auditLogs.filter((log) => log.result === 'failure')
        .length,
      byEntityType: {} as Record<EntityType, number>,
      byActionType: {} as Record<MutationType, number>,
    };

    this.auditLogs.forEach((log) => {
      // Count by entity type
      stats.byEntityType[log.entityType] =
        (stats.byEntityType[log.entityType] || 0) + 1;

      // Count by action type
      stats.byActionType[log.action] = (stats.byActionType[log.action] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export audit logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.auditLogs, null, 2);
  }

  // TODO: Future enhancement - persist to database
  // private async persistToDatabase(entry: AuditLogEntry): Promise<void> {
  //   // Save to SQLite database for permanent record
  //   // const auditRepo = new AuditRepository();
  //   // await auditRepo.create(entry);
  // }
}
