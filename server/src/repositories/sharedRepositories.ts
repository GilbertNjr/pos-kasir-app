import { ProductRepository } from './ProductRepository';
import { StockRepository } from './StockRepository';
import { CategoryRepository } from './CategoryRepository';
import { ShiftRepository } from './ShiftRepository';
import { ShiftUserRepository } from './ShiftUserRepository';
import { ShiftCapitalContributionRepository } from './ShiftCapitalContributionRepository';
import { TransactionRepository } from './TransactionRepository';
import { TransactionItemRepository } from './TransactionItemRepository';
import { ExpenseRepository } from './ExpenseRepository';
import { UserRepository } from './UserRepository';
import { AuditLogRepository } from './AuditLogRepository';
import { ActivationTokenRepository } from './ActivationTokenRepository';

import { BackupService } from '../services/BackupService';

// Singleton Repositories Shared Across All Services & Routes
export const productRepository = new ProductRepository();
export const stockRepository = new StockRepository();
export const categoryRepository = new CategoryRepository();
export const shiftRepository = new ShiftRepository();
export const shiftUserRepository = new ShiftUserRepository();
export const shiftCapitalContributionRepository = new ShiftCapitalContributionRepository();
export const transactionRepository = new TransactionRepository();
export const transactionItemRepository = new TransactionItemRepository();
export const expenseRepository = new ExpenseRepository();
export const userRepository = new UserRepository();
export const auditLogRepository = new AuditLogRepository();
export const activationTokenRepository = new ActivationTokenRepository();

// Singleton Backup Service Shared Across Routes & Shift Closing Trigger
export const backupService = new BackupService(
  userRepository,
  categoryRepository,
  productRepository,
  shiftRepository,
  transactionRepository,
  transactionItemRepository,
  expenseRepository,
  stockRepository
);
