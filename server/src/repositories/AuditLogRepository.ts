import { AuditLogEntity } from '../types/domain';
import { pool } from '../database/db';

export class AuditLogRepository {
  private inMemoryAuditLogs: AuditLogEntity[] = [];

  async findAll(): Promise<AuditLogEntity[]> {
    try {
      const res = await pool.query(
        `SELECT a.log_id as audit_id, a.user_id, COALESCE(u.username, 'System') as username, 
                a.action, a.affected_entity, a.entity_id, a.details, a.created_at::text as timestamp
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.user_id
         ORDER BY a.created_at DESC`
      );
      if (res.rows.length > 0) {
        this.inMemoryAuditLogs = res.rows;
        return res.rows;
      }
      return [...this.inMemoryAuditLogs];
    } catch (err) {
      console.warn('[AuditLogRepository] Database fetch fallback to memory:', (err as Error).message);
      return [...this.inMemoryAuditLogs];
    }
  }

  async logAction(
    userId: string,
    username: string,
    action: string,
    affectedEntity: string,
    entityId: string,
    details: string
  ): Promise<AuditLogEntity> {
    const audit_id = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    const newLog: AuditLogEntity = {
      audit_id,
      user_id: userId,
      username,
      action,
      affected_entity: affectedEntity,
      entity_id: entityId,
      details,
      timestamp,
    };

    try {
      await pool.query(
        `INSERT INTO audit_logs (log_id, user_id, action, affected_entity, entity_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [audit_id, userId, action, affectedEntity, entityId, details, timestamp]
      );
    } catch (err) {
      console.warn('[AuditLogRepository] Database logAction fallback to memory:', (err as Error).message);
    }

    this.inMemoryAuditLogs.unshift(newLog);
    return newLog;
  }
}

