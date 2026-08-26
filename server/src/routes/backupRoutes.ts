import { Router } from 'express';
import { backupService } from '../repositories/sharedRepositories';
import { BackupController } from '../controllers/BackupController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

const backupController = new BackupController(backupService);

// Protected Backup & Restore Routes (Accessible by all authenticated roles: OWNER, PENANGGUNG_JAWAB, KARYAWAN)
router.get('/export', authMiddleware, backupController.exportBackup);
router.get('/history', authMiddleware, backupController.getHistory);
router.delete('/:backupId', authMiddleware, backupController.deleteBackup);
router.post('/restore', authMiddleware, backupController.restoreBackup);

// Google Sheets Auto-Sync Routes
router.get('/google-sheets-status', authMiddleware, backupController.getGoogleSheetsStatus);
router.post('/google-sheets-sync', authMiddleware, backupController.syncGoogleSheets);

export default router;
