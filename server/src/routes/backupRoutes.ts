import { Router } from 'express';
import {
  userRepository,
  categoryRepository,
  productRepository,
  shiftRepository,
  transactionRepository,
  transactionItemRepository as itemRepository,
  expenseRepository,
  stockRepository,
} from '../repositories/sharedRepositories';
import { BackupService } from '../services/BackupService';
import { BackupController } from '../controllers/BackupController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

const backupService = new BackupService(
  userRepository,
  categoryRepository,
  productRepository,
  shiftRepository,
  transactionRepository,
  itemRepository,
  expenseRepository,
  stockRepository
);

const backupController = new BackupController(backupService);

// Protected Backup & Restore Routes (Owner Only)
router.get('/export', authMiddleware, requireOwner, backupController.exportBackup);
router.get('/history', authMiddleware, requireOwner, backupController.getHistory);
router.post('/restore', authMiddleware, requireOwner, backupController.restoreBackup);

// Google Sheets Auto-Sync Routes (Owner Only)
router.get('/google-sheets-status', authMiddleware, requireOwner, backupController.getGoogleSheetsStatus);
router.post('/google-sheets-sync', authMiddleware, requireOwner, backupController.syncGoogleSheets);

export default router;
