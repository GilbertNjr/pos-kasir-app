import { Router } from 'express';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { DashboardService } from '../services/DashboardService';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

const transactionRepository = new TransactionRepository();
const itemRepository = new TransactionItemRepository();
const productRepository = new ProductRepository();
const expenseRepository = new ExpenseRepository();

const dashboardService = new DashboardService(
  transactionRepository,
  itemRepository,
  productRepository,
  expenseRepository
);
const dashboardController = new DashboardController(dashboardService);

// Protected Dashboard Route (Owner Only)
router.get('/metrics', authMiddleware, requireOwner, dashboardController.getDashboardMetrics);

export default router;
