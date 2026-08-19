import { Response } from 'express';
import { StockService } from '../services/StockService';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { sseManager } from '../utils/sseManager';
import { auditLogRepository, productRepository } from '../repositories/sharedRepositories';
import { pool } from '../database/db';

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
      const { product_id, current_stock, stock_gudang, stock_etalase, notes } = req.body;
      if (!product_id || (current_stock === undefined && stock_gudang === undefined && stock_etalase === undefined)) {
        return res.status(400).json({ error: 'Parameter product_id dan jumlah stok wajib diisi.' });
      }

      const userId = req.user?.user_id || 'usr-owner-001';
      const username = req.user?.username || 'Pegawai';

      // 1. Get previous stock amount for history tracking
      const stocksBeforeList = await this.stockService.getAllStocksWithProducts();
      const existingStock = stocksBeforeList.find((s) => s.product_id === product_id);
      const stockBefore = existingStock ? existingStock.current_stock : 0;
      const productName = existingStock ? existingStock.product_name : `Produk #${product_id}`;

      const gNum = stock_gudang !== undefined ? Number(stock_gudang) : undefined;
      const eNum = stock_etalase !== undefined ? Number(stock_etalase) : undefined;
      const totalNum = current_stock !== undefined ? Number(current_stock) : 0;

      const updated = await this.stockService.updateStockQuantity(product_id, totalNum, gNum, eNum);

      const diff = totalNum - stockBefore;
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
      const detailStr = `Penyesuaian Stok "${productName}" (${diffStr} Pcs, Stok Akhir: ${totalNum} [Gudang: ${updated.stock_gudang}, Etalase: ${updated.stock_etalase}]). ${notes || ''}`.trim();

      // 2. Insert into audit_logs table & in-memory audit logs
      await auditLogRepository.logAction(
        userId,
        username,
        'STOCK_UPDATE',
        productName,
        product_id,
        detailStr
      );

      // 3. Insert into stock_movements table in Database
      try {
        await pool.query(
          `INSERT INTO stock_movements (movement_id, product_id, actor_user_id, movement_type, quantity, stock_before, stock_after, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            product_id,
            userId,
            diff >= 0 ? 'IN' : 'OUT',
            Math.abs(diff),
            stockBefore,
            totalNum,
            notes || `Restock/Update oleh ${username}`
          ]
        );
      } catch (err) {
        console.warn('[StockController] stock_movements DB insert fallback warning:', (err as Error).message);
      }

      // 4. Broadcast SSE events for real-time sync across all connected clients
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
