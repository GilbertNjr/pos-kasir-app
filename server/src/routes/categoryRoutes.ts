import { Router } from 'express';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { CategoryService } from '../services/CategoryService';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

// Public/Authenticated Read Route
router.get('/', authMiddleware, categoryController.getCategories);

// Owner-Only Mutation Route
router.post('/', authMiddleware, requireOwner, categoryController.createCategory);

export default router;
