import { Router } from 'express';
import {
  transactionRepository,
  transactionItemRepository as itemRepository,
  productRepository,
  expenseRepository,
} from '../repositories/sharedRepositories';
import { DashboardService } from '../services/DashboardService';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

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
