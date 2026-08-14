import { Router } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { StockRepository } from '../repositories/StockRepository';
import { BackupService } from '../services/BackupService';
import { BackupController } from '../controllers/BackupController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

const userRepository = new UserRepository();
const categoryRepository = new CategoryRepository();
const productRepository = new ProductRepository();
const shiftRepository = new ShiftRepository();
const transactionRepository = new TransactionRepository();
const itemRepository = new TransactionItemRepository();
const expenseRepository = new ExpenseRepository();
const stockRepository = new StockRepository();

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
