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

  public getStockMovements = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const logs = await auditLogRepository.findAll();
      const stockLogs = (logs || []).filter(
        (l: any) =>
          l.action &&
          (l.action.includes('STOCK') ||
            l.action.includes('PRODUCT') ||
            l.action.includes('TRANSACTION'))
      );
      return res.status(200).json({ data: stockLogs });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil data pergerakan stok' });
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

  public transferStock = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { product_id, quantity, notes } = req.body;
      const transferQty = Number(quantity);
      if (!product_id || isNaN(transferQty) || transferQty <= 0) {
        return res.status(400).json({ error: 'Parameter product_id dan kuantitas transfer (angka positif) wajib diisi.' });
      }

      const userId = req.user?.user_id || 'usr-owner-001';
      const username = req.user?.username || 'Pegawai';

      const product = await productRepository.findById(product_id);
      const productName = product ? product.product_name : `Produk #${product_id}`;

      const updated = await this.stockService.transferStock(product_id, transferQty);

      // 1. Catat ke audit log
      const detailStr = `Pemindahan Stok "${productName}" sebanyak ${transferQty} Pcs dari Gudang Utama ke Etalase Toko (Stok Akhir Etalase: ${updated.stock_etalase}, Gudang: ${updated.stock_gudang}). ${notes || ''}`.trim();
      await auditLogRepository.logAction(
        userId,
        username,
        'STOCK_TRANSFER',
        productName,
        product_id,
        detailStr
      );

      // 2. Catat ke stock_movements
      try {
        await pool.query(
          `INSERT INTO stock_movements (movement_id, product_id, actor_user_id, movement_type, quantity, stock_before, stock_after, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            product_id,
            userId,
            'IN',
            transferQty,
            (updated.stock_etalase ?? 0) - transferQty,
            updated.stock_etalase,
            `Pindah Gudang -> Etalase (+${transferQty} Pcs) oleh ${username}`
          ]
        );
      } catch (err) {
        console.warn('[StockController] stock_movements transfer DB insert fallback notice:', (err as Error).message);
      }

      // 3. Broadcast SSE signal untuk sinkronisasi seketika di seluruh kasir & dashboard
      sseManager.broadcast('STOCK_UPDATED', {
        product_id,
        current_stock: updated.current_stock,
        stock_gudang: updated.stock_gudang,
        stock_etalase: updated.stock_etalase,
        updated_at: new Date().toISOString(),
      });

      return res.status(200).json({
        message: `Berhasil memindahkan ${transferQty} pcs "${productName}" dari Gudang ke Etalase Toko.`,
        data: updated,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal memproses pemindahan stok barang' });
    }
  };
}
