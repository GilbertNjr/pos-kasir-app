import { Response } from 'express';
import { ProductService } from '../services/ProductService';
import { sseManager } from '../utils/sseManager';
import { AuthenticatedRequest } from '../middlewares/AuthMiddleware';
import { auditLogRepository } from '../repositories/sharedRepositories';

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
      const userId = req.user?.user_id || 'usr-system';
      const username = req.user?.username || 'Pegawai';

      const product = await this.productService.createProduct(req.body);

      const initialGudang = req.body.initial_stock_gudang || 0;
      const initialEtalase = req.body.initial_stock_etalase || 0;
      const totalInit = Number(initialGudang) + Number(initialEtalase);
      const stockMsg = product.manage_stock ? ` dengan Stok Awal: +${totalInit} Pcs (Gudang: ${initialGudang}, Etalase: ${initialEtalase})` : '';

      await auditLogRepository.logAction(
        userId,
        username,
        'STOCK_UPDATE',
        product.product_name,
        product.product_id,
        `Penambahan Produk Baru "${product.product_name}" [${product.business_unit}]${stockMsg}`
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
      const userId = req.user?.user_id || 'usr-system';
      const username = req.user?.username || 'Pegawai';
      const { id } = req.params;

      const product = await this.productService.updateProduct(id, req.body);

      await auditLogRepository.logAction(
        userId,
        username,
        'PRODUCT_UPDATE',
        product?.product_name || id,
        id,
        `Koreksi Detail Produk "${product?.product_name}" (Harga: Rp ${product?.selling_price})`
      );

      sseManager.broadcast('PRODUCT_UPDATED', { action: 'UPDATED', product_id: id, data: product });
      return res.status(200).json({ message: 'Detail produk berhasil diperbarui', data: product });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal memperbarui detail produk' });
    }
  };

  public deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.user_id || 'usr-system';
      const username = req.user?.username || 'Pegawai';
      const { id } = req.params;

      await this.productService.deleteProduct(id);

      await auditLogRepository.logAction(
        userId,
        username,
        'PRODUCT_DELETE',
        `Produk #${id}`,
        id,
        `Penghapusan produk dan stok fisik ID #${id}`
      );

      sseManager.broadcast('PRODUCT_UPDATED', { action: 'DELETED', product_id: id });
      sseManager.broadcast('STOCK_UPDATED', { action: 'DELETED', product_id: id });
      return res.status(200).json({ message: 'Produk dan stok berhasil dihapus.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Gagal menghapus produk' });
    }
  };
}
