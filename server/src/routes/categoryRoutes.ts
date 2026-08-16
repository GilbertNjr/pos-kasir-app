import { Router } from 'express';
import { categoryRepository } from '../repositories/sharedRepositories';
import { CategoryService } from '../services/CategoryService';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

// Public/Authenticated Read Route
router.get('/', authMiddleware, categoryController.getCategories);

// Authenticated Mutation Route (Owner & PJ)
router.post('/', authMiddleware, categoryController.createCategory);

export default router;
