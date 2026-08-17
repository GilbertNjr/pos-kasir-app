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
      const { product_id, current_stock, stock_gudang, stock_etalase } = req.body;
      if (!product_id || (current_stock === undefined && stock_gudang === undefined && stock_etalase === undefined)) {
        return res.status(400).json({ error: 'Parameter product_id dan jumlah stok wajib diisi.' });
      }

      const gNum = stock_gudang !== undefined ? Number(stock_gudang) : undefined;
      const eNum = stock_etalase !== undefined ? Number(stock_etalase) : undefined;
      const totalNum = current_stock !== undefined ? Number(current_stock) : 0;

      const updated = await this.stockService.updateStockQuantity(product_id, totalNum, gNum, eNum);

      // Broadcast SSE event for real-time stock sync across all connected clients
      sseManager.broadcast('STOCK_UPDATED', {
        product_id,
        current_stock: updated.current_stock,
        stock_gudang: updated.stock_gudang,
        stock_etalase: updated.stock_etalase,
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
