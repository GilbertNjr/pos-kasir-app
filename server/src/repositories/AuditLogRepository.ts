import { AuditLogEntity } from '../types/domain';

export class AuditLogRepository {
  private auditLogs: AuditLogEntity[] = [];

  constructor() {
    // Initial sample seed audit log
    this.auditLogs.push({
      audit_id: 'audit-001',
      user_id: 'usr-owner-01',
      username: 'owner',
      action: 'SYSTEM_INIT',
      affected_entity: 'SYSTEM',
      entity_id: 'sys-01',
      details: 'Inisialisasi Sistem POS Usaha Campuran & Audit Log Engine',
      timestamp: new Date().toISOString(),
    });
  }

  async findAll(): Promise<AuditLogEntity[]> {
    // Audit log selalu diurutkan dari yang paling baru
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async logAction(
    userId: string,
    username: string,
    action: string,
    affectedEntity: string,
    entityId: string,
    details: string
  ): Promise<AuditLogEntity> {
    const newLog: AuditLogEntity = {
      audit_id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      username: username,
      action: action,
      affected_entity: affectedEntity,
      entity_id: entityId,
      details: details,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.unshift(newLog);
    return newLog;
  }
}
