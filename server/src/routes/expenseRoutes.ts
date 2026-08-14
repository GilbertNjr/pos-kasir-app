import { Router } from 'express';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { ShiftRepository } from '../repositories/ShiftRepository';
import { ExpenseService } from '../services/ExpenseService';
import { ExpenseController } from '../controllers/ExpenseController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

const expenseRepository = new ExpenseRepository();
const shiftRepository = new ShiftRepository();

const expenseService = new ExpenseService(expenseRepository, shiftRepository);
const expenseController = new ExpenseController(expenseService);

// Authenticated Expense Routes
router.post('/', authMiddleware, expenseController.createExpense);
router.get('/', authMiddleware, expenseController.getExpenses);

export default router;
