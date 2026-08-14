import { Router } from 'express';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { ReportService } from '../services/ReportService';
import { ReportController } from '../controllers/ReportController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

const transactionRepository = new TransactionRepository();
const itemRepository = new TransactionItemRepository();
const productRepository = new ProductRepository();
const userRepository = new UserRepository();
const expenseRepository = new ExpenseRepository();

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
