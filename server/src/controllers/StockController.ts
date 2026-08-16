import { Response } from 'express';
import { StockService } from '../services/StockService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { sseManager } from '../utils/sseManager';

export class StockController {
  private stockService: StockService;

  constructor(stockService: StockService) {
    this.stockService = stockService;
  }

  public getStocks = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stocks = await this.stockService.getAllStocksWithProducts();
      return res.status(200).json({ data: stocks });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil data stok barang' });
    }
  };

  public updateStock = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { product_id, current_stock } = req.body;
      if (!product_id || current_stock === undefined) {
        return res.status(400).json({ error: 'Parameter product_id dan current_stock wajib diisi.' });
      }

      const updated = await this.stockService.updateStockQuantity(product_id, Number(current_stock));

      // Broadcast SSE event for real-time stock sync across all connected clients
      sseManager.broadcast('STOCK_UPDATED', {
        product_id,
        current_stock: Number(current_stock),
        updated_at: new Date().toISOString(),
      });

      return res.status(200).json({
        message: 'Stok fisik barang berhasil disesuaikan.',
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal merestok/menyesuaikan stok' });
    }
  };
}
