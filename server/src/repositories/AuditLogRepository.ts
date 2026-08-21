import { AuditLogEntity } from '../types/domain';
import { pool } from '../database/db';

export class AuditLogRepository {
  private inMemoryAuditLogs: AuditLogEntity[] = [];

  async findAll(): Promise<AuditLogEntity[]> {
    try {
      const res = await pool.query(
        `SELECT COALESCE(a.log_id, a.audit_id) as audit_id, 
                COALESCE(a.user_id, a.actor_user_id) as user_id, 
                COALESCE(u.username, u.full_name, 'Kasir') as username, 
                a.action, 
                COALESCE(a.affected_entity, a.entity_type) as affected_entity, 
                a.entity_id, 
                COALESCE(a.details, a.metadata::text, '') as details, 
                a.created_at::text as timestamp
         FROM audit_logs a
         LEFT JOIN users u ON COALESCE(a.user_id, a.actor_user_id) = u.user_id
         ORDER BY a.created_at DESC`
      );

      const dbRows = res.rows || [];
      const combinedMap = new Map<string, AuditLogEntity>();
      
      // Add in-memory logs first
      this.inMemoryAuditLogs.forEach((l) => combinedMap.set(l.audit_id, l));
      // Overwrite/merge DB logs
      dbRows.forEach((l) => combinedMap.set(l.audit_id, l));

      const sorted = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return sorted;
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

    const validUserId = (userId && userId !== 'usr-system') ? userId : 'usr-owner-001';
    const validUsername = username || 'Kasir';

    const newLog: AuditLogEntity = {
      audit_id,
      user_id: validUserId,
      username: validUsername,
      action,
      affected_entity: affectedEntity,
      entity_id: entityId,
      details,
      timestamp,
    };

    // Prepend to in-memory store
    this.inMemoryAuditLogs.unshift(newLog);

    try {
      await pool.query(
        `INSERT INTO audit_logs (audit_id, log_id, actor_user_id, user_id, action, affected_entity, entity_type, entity_id, details, created_at)
         VALUES ($1, $1, $2, $2, $3, $4, $4, $5, $6, $7)`,
        [audit_id, validUserId, action, affectedEntity, entityId, details, timestamp]
      );
    } catch (err) {
      console.warn('[AuditLogRepository] Database logAction fallback to memory:', (err as Error).message);
    }

    return newLog;
  }
}
