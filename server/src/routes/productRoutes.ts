import { Router } from 'express';
import { ProductRepository } from '../repositories/ProductRepository';
import { ProductService } from '../services/ProductService';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { requireOwner } from '../middlewares/rbacMiddleware';

const router = Router();

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

// Authenticated Read Route
router.get('/', authMiddleware, productController.getProducts);

// Owner-Only Mutation Route
router.post('/', authMiddleware, requireOwner, productController.createProduct);

export default router;
