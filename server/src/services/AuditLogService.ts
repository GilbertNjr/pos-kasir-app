import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogEntity } from '../types/domain';

export class AuditLogService {
  private auditLogRepository: AuditLogRepository;

  constructor(auditLogRepository: AuditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }

  async getAllLogs(): Promise<AuditLogEntity[]> {
    return await this.auditLogRepository.findAll();
  }

  async logEvent(
    userId: string,
    username: string,
    action: string,
    affectedEntity: string,
    entityId: string,
    details: string
  ): Promise<AuditLogEntity> {
    return await this.auditLogRepository.logAction(userId, username, action, affectedEntity, entityId, details);
  }
}
