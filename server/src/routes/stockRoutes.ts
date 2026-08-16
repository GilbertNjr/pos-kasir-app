import { Router } from 'express';
import { stockRepository, productRepository } from '../repositories/sharedRepositories';
import { StockService } from '../services/StockService';
import { StockController } from '../controllers/StockController';
import { authMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

export const stockService = new StockService(stockRepository, productRepository);
const stockController = new StockController(stockService);

// Authenticated Stock Management Routes
router.get('/', authMiddleware, stockController.getStocks);
router.post('/update', authMiddleware, stockController.updateStock);

export default router;
