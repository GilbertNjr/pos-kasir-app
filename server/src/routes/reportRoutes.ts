import { Router } from 'express';
import {
  transactionRepository,
  transactionItemRepository as itemRepository,
  productRepository,
  userRepository,
  expenseRepository,
} from '../repositories/sharedRepositories';
import { ReportService } from '../services/ReportService';
import { ReportController } from '../controllers/ReportController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

const reportService = new ReportService(
  transactionRepository,
  itemRepository,
  productRepository,
  userRepository,
  expenseRepository
);

const reportController = new ReportController(reportService);

// Authenticated Reporting Routes
router.get('/sales', authMiddleware, reportController.getSalesReport);

export default router;
