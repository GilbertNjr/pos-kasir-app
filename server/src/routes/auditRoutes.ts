import { Router } from 'express';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from '../services/AuditLogService';
import { AuditLogController } from '../controllers/AuditLogController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

const auditLogRepository = new AuditLogRepository();
const auditLogService = new AuditLogService(auditLogRepository);
const auditLogController = new AuditLogController(auditLogService);

// Protected Audit Log & Notifications Route (Authenticated Users)
router.get('/', authMiddleware, auditLogController.getAuditLogs);

export default router;
