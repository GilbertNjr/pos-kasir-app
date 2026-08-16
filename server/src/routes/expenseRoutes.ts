import { Router } from 'express';
import { expenseRepository, shiftRepository } from '../repositories/sharedRepositories';
import { ExpenseService } from '../services/ExpenseService';
import { ExpenseController } from '../controllers/ExpenseController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

const expenseService = new ExpenseService(expenseRepository, shiftRepository);
const expenseController = new ExpenseController(expenseService);

// Authenticated Expense Routes
router.post('/', authMiddleware, expenseController.createExpense);
router.get('/', authMiddleware, expenseController.getExpenses);

export default router;
