import { Response } from 'express';
import { AuditLogService } from '../services/AuditLogService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';

export class AuditLogController {
  private auditLogService: AuditLogService;

  constructor(auditLogService: AuditLogService) {
    this.auditLogService = auditLogService;
  }

  public getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const logs = await this.auditLogService.getAllLogs();
      const isOwner = req.user?.role === 'OWNER';

      // If user is cashier/staff, only expose operational activities (filter out confidential credentials/security records)
      const visibleLogs = isOwner
        ? logs
        : logs.filter((l) => {
            const act = (l.action || '').toUpperCase();
            return !act.includes('PASSWORD') && !act.includes('PIN') && !act.includes('SECRET');
          });

      return res.status(200).json({
        message: 'Daftar audit log sistem berhasil diambil',
        data: visibleLogs,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil audit log sistem' });
    }
  };
}
