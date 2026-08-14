import { Router } from 'express';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionItemRepository } from '../repositories/TransactionItemRepository';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { TransactionService } from '../services/TransactionService';
import { TransactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

import { stockService } from './stockRoutes';

const router = Router();

const transactionRepository = new TransactionRepository();
const itemRepository = new TransactionItemRepository();
const shiftRepository = new ShiftRepository();
const productRepository = new ProductRepository();

const transactionService = new TransactionService(
  transactionRepository,
  itemRepository,
  shiftRepository,
  productRepository,
  stockService
);
const transactionController = new TransactionController(transactionService);

// Authenticated POS Transaction Routes
router.post('/', authMiddleware, transactionController.createTransaction);
router.get('/', authMiddleware, transactionController.getTransactions);
router.get('/payment-summary', authMiddleware, transactionController.getPaymentSummary);

export default router;
