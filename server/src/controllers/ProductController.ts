import { Response } from 'express';
import { ProductService } from '../services/ProductService';
import { sseManager } from '../utils/sseManager';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { auditLogRepository, categoryRepository, stockRepository } from '../repositories/sharedRepositories';
import { pool } from '../database/db';

export class ProductController {
  private productService: ProductService;

  constructor(productService: ProductService) {
    this.productService = productService;
  }

  public getProducts = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unit } = req.query;
      const products = await this.productService.getProductsByBusinessUnit(unit as string);
      return res.status(200).json({ data: products });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Gagal mengambil daftar produk' });
    }
  };

  public createProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.user_id || 'usr-owner-001';
      const username = req.user?.username || 'Pegawai';

      const product = await this.productService.createProduct(req.body);

      const initialGudang = Number(req.body.initial_stock_gudang) || 0;
      const initialEtalase = Number(req.body.initial_stock_etalase) || 0;
      const totalInit = initialGudang + initialEtalase;
      const stockMsg = product.manage_stock ? ` dengan Stok Awal: +${totalInit} Pcs (Gudang: ${initialGudang}, Etalase: ${initialEtalase})` : '';

      if (product.manage_stock) {
        try {
          await stockRepository.create({
            stock_id: `stk-${product.product_id}`,
            product_id: product.product_id,
            current_stock: totalInit,
            stock_gudang: initialGudang,
            stock_etalase: initialEtalase,
            last_updated: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('[ProductController] Warning creating initial stock row:', (err as Error).message);
        }

        try {
          await pool.query(
            `INSERT INTO stock_movements (movement_id, product_id, actor_user_id, movement_type, quantity, stock_before, stock_after, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              product.product_id,
              userId,
              'IN',
              totalInit,
              0,
              totalInit,
              `Produk Baru & Stok Awal (+${totalInit} Pcs) oleh ${username}`
            ]
          );
        } catch {}
      }

      await auditLogRepository.logAction(
        userId,
        username,
        'PRODUCT_CREATE',
        product.product_name,
        product.product_id,
        `Penambahan Produk Baru "${product.product_name}" [${product.business_unit}]${stockMsg} oleh ${username}`
      );

      sseManager.broadcast('PRODUCT_UPDATED', { action: 'CREATED', data: product });
      sseManager.broadcast('STOCK_UPDATED', { action: 'CREATED', product_id: product.product_id });

      return res.status(201).json({ message: 'Produk berhasil ditambahkan', data: product });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menambahkan produk' });
    }
  };

  public updateProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.user_id || 'usr-owner-001';
      const username = req.user?.username || 'Pegawai';
      const { id } = req.params;

      const product = await this.productService.updateProduct(id, req.body);
      if (!product) {
        return res.status(404).json({
          error: 'Produk tidak ditemukan',
          message: `Gagal memperbarui produk: Produk ID #${id} tidak ditemukan di sistem database.`,
        });
      }

      // Fetch category details from category repository for server-sent notification
      const catObj = product.category_id ? await categoryRepository.findById(product.category_id) : null;
      const catName = catObj ? catObj.category_name : 'Kategori Terpilih';
      const unitLabel = product.business_unit === 'FNB' ? 'Food & Beverage (FNB)' : 'FC / Printing & ATK';

      const responseMessage = `Produk "${product.product_name}" diperbarui ke Bidang: ${unitLabel} | Kategori: ${catName} oleh ${username}.`;

      await auditLogRepository.logAction(
        userId,
        username,
        'PRODUCT_UPDATE',
        product.product_name,
        id,
        responseMessage
      );

      sseManager.broadcast('PRODUCT_UPDATED', { action: 'UPDATED', product_id: id, data: product, message: responseMessage });

      return res.status(200).json({
        message: responseMessage,
        data: product,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message || 'Gagal memperbarui detail produk',
        message: `Gagal memperbarui produk: ${error.message || 'Terjadi kesalahan sistem di server'}`,
      });
    }
  };

  public deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.user_id || 'usr-owner-001';
      const username = req.user?.username || 'Pegawai';
      const { id } = req.params;

      const existingProd = await this.productService.getAllProducts().then((list) => list.find((p) => p.product_id === id)).catch(() => null);
      const prodName = existingProd ? existingProd.product_name : `Produk #${id}`;

      await this.productService.deleteProduct(id);

      await auditLogRepository.logAction(
        userId,
        username,
        'PRODUCT_DELETE',
        prodName,
        id,
        `Penghapusan produk "${prodName}" dan stok fisik ID #${id} oleh ${username}`
      );

      sseManager.broadcast('PRODUCT_UPDATED', { action: 'DELETED', product_id: id });
      sseManager.broadcast('STOCK_UPDATED', { action: 'DELETED', product_id: id });
      return res.status(200).json({ message: `Produk "${prodName}" dan stok berhasil dihapus.` });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menghapus produk' });
    }
  };
}
