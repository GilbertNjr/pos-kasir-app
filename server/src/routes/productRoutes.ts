import { Router } from 'express';
import { productRepository } from '../repositories/sharedRepositories';
import { ProductService } from '../services/ProductService';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

export const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

// Authenticated Read Route
router.get('/', authMiddleware, productController.getProducts);

// Authenticated Product Mutation Routes (Owner & PJ Shift)
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

export default router;
