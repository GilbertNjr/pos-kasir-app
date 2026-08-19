import { Router } from 'express';
import {
  transactionRepository,
  transactionItemRepository as itemRepository,
  shiftRepository,
  productRepository,
  shiftUserRepository,
} from '../repositories/sharedRepositories';
import { TransactionService } from '../services/TransactionService';
import { TransactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { idempotencyMiddleware } from '../middlewares/idempotencyMiddleware';
import { stockService } from './stockRoutes';

const router = Router();

export const transactionService = new TransactionService(
  transactionRepository,
  itemRepository,
  shiftRepository,
  productRepository,
  stockService,
  shiftUserRepository
);

const transactionController = new TransactionController(transactionService);

// Authenticated POS Transaction Routes
router.post('/', authMiddleware, idempotencyMiddleware, transactionController.createTransaction);
router.get('/', authMiddleware, transactionController.getTransactions);
router.get('/payment-summary', authMiddleware, transactionController.getPaymentSummary);
router.post('/:id/cancel', authMiddleware, transactionController.cancelTransaction);
router.delete('/:id', authMiddleware, transactionController.deleteTransaction);

export default router;
