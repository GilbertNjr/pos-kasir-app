import { Response } from 'express';
import { AuditLogService } from '../services/AuditLogService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class AuditLogController {
  private auditLogService: AuditLogService;

  constructor(auditLogService: AuditLogService) {
    this.auditLogService = auditLogService;
  }

  public getAuditLogs = async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const logs = await this.auditLogService.getAllLogs();
      return res.status(200).json({
        message: 'Daftar audit log sistem berhasil diambil',
        data: logs,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil audit log sistem' });
    }
  };
}
